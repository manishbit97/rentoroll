package services

import (
	"context"
	"time"

	"github.com/manishbit97/rentoroll/internal/models"
	"github.com/manishbit97/rentoroll/internal/repositories"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type SaveRentInput struct {
	RoomID      string  `json:"room_id"`
	PropertyID  string  `json:"property_id"`
	Month       int     `json:"month"`
	Year        int     `json:"year"`
	BaseRent    float64 `json:"base_rent"`
	Electricity float64 `json:"electricity"`
	Notes       string  `json:"notes"`
}

type MonthlyRentResult struct {
	Room       models.Room        `json:"room"`
	RentRecord *models.RentRecord `json:"rent_record"`
	TenantName string             `json:"tenant_name,omitempty"`
}

type RentService interface {
	GetMonthlyForProperty(ctx context.Context, propertyID primitive.ObjectID, month, year int) ([]MonthlyRentResult, error)
	GetRoomHistory(ctx context.Context, roomID primitive.ObjectID) ([]models.RentRecord, error)
	SaveRecord(ctx context.Context, input SaveRentInput) (*models.RentRecord, error)
	MarkPaid(ctx context.Context, id primitive.ObjectID, paidDate time.Time, byUserID, byEmail string) error
	RecordPayment(ctx context.Context, id primitive.ObjectID, amount float64, paidDate time.Time, byUserID, byEmail string) error
	GetMyRent(ctx context.Context, tenantID primitive.ObjectID, month, year int) ([]models.RentRecord, error)
	GetMyHistory(ctx context.Context, tenantID primitive.ObjectID) ([]models.RentRecord, error)
}

type rentService struct {
	rentRepo       repositories.RentRepository
	roomRepo       repositories.RoomRepository
	assignmentRepo repositories.AssignmentRepository
	userRepo       repositories.UserRepository
	notifiers      []NotificationChannel
}

func NewRentService(
	rentRepo repositories.RentRepository,
	roomRepo repositories.RoomRepository,
	assignmentRepo repositories.AssignmentRepository,
	userRepo repositories.UserRepository,
	notifiers ...NotificationChannel,
) RentService {
	return &rentService{
		rentRepo:       rentRepo,
		roomRepo:       roomRepo,
		assignmentRepo: assignmentRepo,
		userRepo:       userRepo,
		notifiers:      notifiers,
	}
}

// nextMonthYear returns the month and year following the given month/year.
func nextMonthYear(month, year int) (int, int) {
	if month == 12 {
		return 1, year + 1
	}
	return month + 1, year
}

// computeCarryForward returns the signed balance remaining from the previous month.
// Positive = debt carried in, Negative = credit carried in.
func (s *rentService) computeCarryForward(ctx context.Context, roomID primitive.ObjectID, month, year int) float64 {
	prev, err := s.rentRepo.FindPreviousMonth(ctx, roomID, month, year)
	if err != nil || prev == nil {
		return 0
	}
	return prev.Total - prev.PaidAmount
}

// cascadeCarryForward propagates a carry_forward update through all subsequent months
// that already have records, stopping when no record exists or the carry_forward is unchanged.
func (s *rentService) cascadeCarryForward(ctx context.Context, roomID primitive.ObjectID, month, year int, newCF float64) {
	record, err := s.rentRepo.FindByRoomAndMonth(ctx, roomID, month, year)
	if err != nil || record == nil {
		return // no record yet — lazy pick-up will use carry_forward when created
	}
	if record.CarryForward == newCF {
		return // no change, stop cascade
	}

	newTotal := record.BaseRent + record.Electricity + newCF
	if newTotal < 0 {
		newTotal = 0
	}

	var newStatus models.PaymentStatus
	switch {
	case record.PaidAmount >= newTotal:
		newStatus = models.StatusPaid
	case record.PaidAmount > 0:
		newStatus = models.StatusPartial
	default:
		newStatus = models.StatusPending
	}

	_ = s.rentRepo.UpdateCarryForward(ctx, record.ID, newCF, newTotal, newStatus)

	// Recurse: this month's remaining balance propagates to the next
	nextRemaining := newTotal - record.PaidAmount
	nextM, nextY := nextMonthYear(month, year)
	s.cascadeCarryForward(ctx, roomID, nextM, nextY, nextRemaining)
}

// GetMonthlyForProperty returns all rooms in a property with their rent record for the given month.
// If no record exists for a room, it creates a PENDING stub so the UI always has a full set.
func (s *rentService) GetMonthlyForProperty(ctx context.Context, propertyID primitive.ObjectID, month, year int) ([]MonthlyRentResult, error) {
	rooms, err := s.roomRepo.FindByProperty(ctx, propertyID)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	nowMonth := int(now.Month())
	nowYear := now.Year()
	isPastMonth := year < nowYear || (year == nowYear && month < nowMonth)

	results := make([]MonthlyRentResult, 0, len(rooms))
	for _, room := range rooms {
		record, err := s.rentRepo.FindByRoomAndMonth(ctx, room.ID, month, year)
		if err != nil {
			return nil, err
		}

		// Auto-create PENDING stub only for current/future months — not past months
		// (past month stubs bloat DB and get the wrong tenant_id if tenant has changed)
		if record == nil && !isPastMonth {
			cf := s.computeCarryForward(ctx, room.ID, month, year)
			total := room.BaseRent + cf
			if total < 0 {
				total = 0
			}
			stub := &models.RentRecord{
				RoomID:       room.ID,
				PropertyID:   propertyID,
				Month:        month,
				Year:         year,
				BaseRent:     room.BaseRent,
				Electricity:  0,
				CarryForward: cf,
				Total:        total,
				Status:       models.StatusPending,
			}
			if err = s.rentRepo.Upsert(ctx, stub); err != nil {
				return nil, err
			}
			record = stub
		}

		result := MonthlyRentResult{Room: room, RentRecord: record}

		// Always resolve the current active assignment as the source of truth
		// for occupancy and tenant name.
		assignment, _ := s.assignmentRepo.FindActiveByRoom(ctx, room.ID)
		if assignment != nil {
			if record != nil && record.TenantID == nil {
				record.TenantID = &assignment.TenantID
				_ = s.rentRepo.Upsert(ctx, record)
			}
			if tenant, _ := s.userRepo.FindByID(ctx, assignment.TenantID); tenant != nil {
				result.TenantName = tenant.Name
			}
		}

		results = append(results, result)
	}
	return results, nil
}

func (s *rentService) GetRoomHistory(ctx context.Context, roomID primitive.ObjectID) ([]models.RentRecord, error) {
	return s.rentRepo.FindByRoom(ctx, roomID)
}

func (s *rentService) SaveRecord(ctx context.Context, input SaveRentInput) (*models.RentRecord, error) {
	roomID, err := primitive.ObjectIDFromHex(input.RoomID)
	if err != nil {
		return nil, err
	}
	propertyID, err := primitive.ObjectIDFromHex(input.PropertyID)
	if err != nil {
		return nil, err
	}

	// Check for existing record
	existing, err := s.rentRepo.FindByRoomAndMonth(ctx, roomID, input.Month, input.Year)
	if err != nil {
		return nil, err
	}

	if existing != nil {
		// Preserve the existing carry_forward (don't change what was already rolled in)
		total := input.BaseRent + input.Electricity + existing.CarryForward
		if total < 0 {
			total = 0
		}
		existing.BaseRent = input.BaseRent
		existing.Electricity = input.Electricity
		existing.Total = total
		existing.Notes = input.Notes
		switch {
		case existing.PaidAmount >= total:
			existing.Status = models.StatusPaid
		case existing.PaidAmount > 0:
			existing.Status = models.StatusPartial
		default:
			existing.Status = models.StatusPending
		}
		if err = s.rentRepo.Upsert(ctx, existing); err != nil {
			return nil, err
		}
		return existing, nil
	}

	cf := s.computeCarryForward(ctx, roomID, input.Month, input.Year)
	total := input.BaseRent + input.Electricity + cf
	if total < 0 {
		total = 0
	}

	record := &models.RentRecord{
		RoomID:       roomID,
		PropertyID:   propertyID,
		Month:        input.Month,
		Year:         input.Year,
		BaseRent:     input.BaseRent,
		Electricity:  input.Electricity,
		CarryForward: cf,
		Total:        total,
		Notes:        input.Notes,
		Status:       models.StatusPending,
	}

	assignment, _ := s.assignmentRepo.FindActiveByRoom(ctx, roomID)
	if assignment != nil {
		record.TenantID = &assignment.TenantID
	}

	if err = s.rentRepo.Upsert(ctx, record); err != nil {
		return nil, err
	}
	return record, nil
}

// RecordPayment records a payment amount for a rent record and cascades the remaining
// balance (or credit) to all subsequent months that already have records.
func (s *rentService) RecordPayment(ctx context.Context, id primitive.ObjectID, amount float64, paidDate time.Time, byUserID, byEmail string) error {
	record, err := s.rentRepo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if record == nil {
		return ErrNotFound
	}

	prevAmount := record.PaidAmount

	var status models.PaymentStatus
	switch {
	case amount >= record.Total:
		status = models.StatusPaid
	case amount > 0:
		status = models.StatusPartial
	default:
		status = models.StatusPending
	}

	action := models.ActionPaymentRecorded
	if prevAmount > 0 {
		action = models.ActionPaymentUpdated
	}
	entry := models.PaymentLogEntry{
		Action:   action,
		Amount:   amount,
		ByUserID: byUserID,
		ByEmail:  byEmail,
		At:       time.Now().UTC(),
	}
	if action == models.ActionPaymentUpdated {
		entry.PrevAmount = prevAmount
	}

	if err = s.rentRepo.RecordPayment(ctx, id, amount, status, paidDate, entry); err != nil {
		return err
	}

	// Cascade remaining balance (signed) to next month
	remaining := record.Total - amount
	nextM, nextY := nextMonthYear(record.Month, record.Year)
	s.cascadeCarryForward(ctx, record.RoomID, nextM, nextY, remaining)

	if status == models.StatusPaid && len(s.notifiers) > 0 && record.TenantID != nil {
		go s.notifyTenant(record)
	}

	return nil
}

// MarkPaid marks a record as fully paid (backward compat).
func (s *rentService) MarkPaid(ctx context.Context, id primitive.ObjectID, paidDate time.Time, byUserID, byEmail string) error {
	record, err := s.rentRepo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if record == nil {
		return ErrNotFound
	}
	return s.RecordPayment(ctx, id, record.Total, paidDate, byUserID, byEmail)
}

func (s *rentService) notifyTenant(record *models.RentRecord) {
	ctx := context.Background()
	if record.TenantID == nil {
		return
	}
	tenant, err := s.userRepo.FindByID(ctx, *record.TenantID)
	if err != nil || tenant == nil || tenant.Phone == "" {
		return
	}
	msg := "Your rent payment has been recorded. Thank you!"
	for _, ch := range s.notifiers {
		_ = ch.Send(ctx, tenant.Phone, msg)
	}
}

func (s *rentService) GetMyRent(ctx context.Context, tenantID primitive.ObjectID, month, year int) ([]models.RentRecord, error) {
	return s.rentRepo.FindCurrentByTenant(ctx, tenantID, month, year)
}

func (s *rentService) GetMyHistory(ctx context.Context, tenantID primitive.ObjectID) ([]models.RentRecord, error) {
	return s.rentRepo.FindByTenant(ctx, tenantID)
}
