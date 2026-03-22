package repositories

import (
	"context"
	"errors"
	"time"

	"github.com/manishbit97/rentoroll/database"
	"github.com/manishbit97/rentoroll/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const rentRecordsCollection = "rent_records"

type RentRepository interface {
	FindByRoomAndMonth(ctx context.Context, roomID primitive.ObjectID, month, year int) (*models.RentRecord, error)
	FindByProperty(ctx context.Context, propertyID primitive.ObjectID, month, year int) ([]models.RentRecord, error)
	FindByRoom(ctx context.Context, roomID primitive.ObjectID) ([]models.RentRecord, error)
	FindByTenant(ctx context.Context, tenantID primitive.ObjectID) ([]models.RentRecord, error)
	FindCurrentByTenant(ctx context.Context, tenantID primitive.ObjectID, month, year int) ([]models.RentRecord, error)
	FindPreviousMonth(ctx context.Context, roomID primitive.ObjectID, month, year int) (*models.RentRecord, error)
	Upsert(ctx context.Context, record *models.RentRecord) error
	MarkPaid(ctx context.Context, id primitive.ObjectID, paidDate time.Time) error
	RecordPayment(ctx context.Context, id primitive.ObjectID, paidAmount float64, status models.PaymentStatus, paidDate time.Time, entry models.PaymentLogEntry) error
	UpdateCarryForward(ctx context.Context, id primitive.ObjectID, carryForward, total float64, status models.PaymentStatus) error
	FindByID(ctx context.Context, id primitive.ObjectID) (*models.RentRecord, error)
}

type mongoRentRepo struct {
	col *mongo.Collection
}

func NewRentRepository() RentRepository {
	return &mongoRentRepo{col: database.GetCollection(rentRecordsCollection)}
}

func (r *mongoRentRepo) FindByRoomAndMonth(ctx context.Context, roomID primitive.ObjectID, month, year int) (*models.RentRecord, error) {
	var record models.RentRecord
	err := r.col.FindOne(ctx, bson.M{"room_id": roomID, "month": month, "year": year}).Decode(&record)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	return &record, err
}

func (r *mongoRentRepo) FindByProperty(ctx context.Context, propertyID primitive.ObjectID, month, year int) ([]models.RentRecord, error) {
	cursor, err := r.col.Find(ctx, bson.M{"property_id": propertyID, "month": month, "year": year})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var records []models.RentRecord
	if err = cursor.All(ctx, &records); err != nil {
		return nil, err
	}
	return records, nil
}

func (r *mongoRentRepo) FindByRoom(ctx context.Context, roomID primitive.ObjectID) ([]models.RentRecord, error) {
	opts := options.Find().SetSort(bson.D{{Key: "year", Value: -1}, {Key: "month", Value: -1}})
	cursor, err := r.col.Find(ctx, bson.M{"room_id": roomID}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var records []models.RentRecord
	if err = cursor.All(ctx, &records); err != nil {
		return nil, err
	}
	return records, nil
}

func (r *mongoRentRepo) FindByTenant(ctx context.Context, tenantID primitive.ObjectID) ([]models.RentRecord, error) {
	opts := options.Find().SetSort(bson.D{{Key: "year", Value: -1}, {Key: "month", Value: -1}})
	cursor, err := r.col.Find(ctx, bson.M{"tenant_id": tenantID}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var records []models.RentRecord
	if err = cursor.All(ctx, &records); err != nil {
		return nil, err
	}
	return records, nil
}

func (r *mongoRentRepo) FindCurrentByTenant(ctx context.Context, tenantID primitive.ObjectID, month, year int) ([]models.RentRecord, error) {
	cursor, err := r.col.Find(ctx, bson.M{"tenant_id": tenantID, "month": month, "year": year})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var records []models.RentRecord
	if err = cursor.All(ctx, &records); err != nil {
		return nil, err
	}
	return records, nil
}

// FindPreviousMonth returns the record for the month immediately before the given month/year.
func (r *mongoRentRepo) FindPreviousMonth(ctx context.Context, roomID primitive.ObjectID, month, year int) (*models.RentRecord, error) {
	prevMonth, prevYear := month-1, year
	if prevMonth == 0 {
		prevMonth = 12
		prevYear--
	}
	return r.FindByRoomAndMonth(ctx, roomID, prevMonth, prevYear)
}

func (r *mongoRentRepo) Upsert(ctx context.Context, record *models.RentRecord) error {
	now := time.Now().UTC()

	if record.ID.IsZero() {
		// Create new
		record.ID = primitive.NewObjectID()
		record.CreatedAt = now
		record.UpdatedAt = now
		if record.Status == "" {
			record.Status = models.StatusPending
		}
		_, err := r.col.InsertOne(ctx, record)
		return err
	}

	// Update existing
	update := bson.M{
		"$set": bson.M{
			"base_rent":    record.BaseRent,
			"electricity":  record.Electricity,
			"carry_forward": record.CarryForward,
			"total":        record.Total,
			"paid_amount":  record.PaidAmount,
			"status":       record.Status,
			"notes":        record.Notes,
			"updated_at":   now,
		},
	}
	if record.TenantID != nil {
		update["$set"].(bson.M)["tenant_id"] = record.TenantID
	}
	_, err := r.col.UpdateOne(ctx, bson.M{"_id": record.ID}, update)
	return err
}

func (r *mongoRentRepo) MarkPaid(ctx context.Context, id primitive.ObjectID, paidDate time.Time) error {
	_, err := r.col.UpdateOne(ctx,
		bson.M{"_id": id},
		bson.M{"$set": bson.M{
			"status":     models.StatusPaid,
			"paid_date":  paidDate,
			"updated_at": time.Now().UTC(),
		}},
	)
	return err
}

// RecordPayment updates paid_amount, status, and paid_date, and appends an audit log entry.
func (r *mongoRentRepo) RecordPayment(ctx context.Context, id primitive.ObjectID, paidAmount float64, status models.PaymentStatus, paidDate time.Time, entry models.PaymentLogEntry) error {
	set := bson.M{
		"paid_amount": paidAmount,
		"status":      status,
		"updated_at":  time.Now().UTC(),
	}
	if status == models.StatusPaid {
		set["paid_date"] = paidDate
	}
	update := bson.M{
		"$set":  set,
		"$push": bson.M{"payment_history": entry},
	}
	_, err := r.col.UpdateOne(ctx, bson.M{"_id": id}, update)
	return err
}

// UpdateCarryForward updates carry_forward, total, and status on a record (used for cascade).
func (r *mongoRentRepo) UpdateCarryForward(ctx context.Context, id primitive.ObjectID, carryForward, total float64, status models.PaymentStatus) error {
	_, err := r.col.UpdateOne(ctx,
		bson.M{"_id": id},
		bson.M{"$set": bson.M{
			"carry_forward": carryForward,
			"total":         total,
			"status":        status,
			"updated_at":    time.Now().UTC(),
		}},
	)
	return err
}

func (r *mongoRentRepo) FindByID(ctx context.Context, id primitive.ObjectID) (*models.RentRecord, error) {
	var record models.RentRecord
	err := r.col.FindOne(ctx, bson.M{"_id": id}).Decode(&record)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	return &record, err
}
