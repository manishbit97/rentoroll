package services

import (
	"context"
	"time"

	"github.com/manishbit97/rentoroll/internal/models"
	"github.com/manishbit97/rentoroll/internal/repositories"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CreateRoomInput struct {
	PropertyID string  `json:"property_id"`
	Name       string  `json:"name"`
	BaseRent   float64 `json:"base_rent"`
}

type AssignTenantInput struct {
	TenantEmail string `json:"tenant_email"`
}

type RoomWithTenant struct {
	models.Room
	TenantID    *primitive.ObjectID `json:"tenant_id,omitempty"`
	TenantName  string              `json:"tenant_name,omitempty"`
	TenantEmail string              `json:"tenant_email,omitempty"`
	IsOccupied  bool                `json:"is_occupied"`
}

type RoomService interface {
	ListByProperty(ctx context.Context, propertyID, landlordID primitive.ObjectID) ([]RoomWithTenant, error)
	GetByID(ctx context.Context, id primitive.ObjectID) (*models.Room, error)
	Create(ctx context.Context, propertyID, landlordID primitive.ObjectID, input CreateRoomInput) (*models.Room, error)
	Update(ctx context.Context, id primitive.ObjectID, name string, baseRent float64) error
	Delete(ctx context.Context, id primitive.ObjectID) error
	AssignTenant(ctx context.Context, roomID primitive.ObjectID, tenantID primitive.ObjectID) error
	RemoveTenant(ctx context.Context, roomID primitive.ObjectID) error
}

type roomService struct {
	roomRepo       repositories.RoomRepository
	assignmentRepo repositories.AssignmentRepository
	propertyRepo   repositories.PropertyRepository
	userRepo       repositories.UserRepository
}

func NewRoomService(
	roomRepo repositories.RoomRepository,
	assignmentRepo repositories.AssignmentRepository,
	propertyRepo repositories.PropertyRepository,
	userRepo repositories.UserRepository,
) RoomService {
	return &roomService{
		roomRepo:       roomRepo,
		assignmentRepo: assignmentRepo,
		propertyRepo:   propertyRepo,
		userRepo:       userRepo,
	}
}

func (s *roomService) ListByProperty(ctx context.Context, propertyID, landlordID primitive.ObjectID) ([]RoomWithTenant, error) {
	// Verify property ownership
	prop, err := s.propertyRepo.FindByID(ctx, propertyID)
	if err != nil {
		return nil, err
	}
	if prop == nil || prop.LandlordID != landlordID {
		return nil, ErrForbidden
	}

	rooms, err := s.roomRepo.FindByProperty(ctx, propertyID)
	if err != nil {
		return nil, err
	}

	result := make([]RoomWithTenant, 0, len(rooms))
	for _, room := range rooms {
		rwt := RoomWithTenant{Room: room}
		assignment, err := s.assignmentRepo.FindActiveByRoom(ctx, room.ID)
		if err == nil && assignment != nil {
			tenant, err := s.userRepo.FindByID(ctx, assignment.TenantID)
			if err == nil && tenant != nil {
				rwt.TenantID = &assignment.TenantID
				rwt.TenantName = tenant.Name
				rwt.TenantEmail = tenant.Email
				rwt.IsOccupied = true
			}
		}
		result = append(result, rwt)
	}
	return result, nil
}

func (s *roomService) GetByID(ctx context.Context, id primitive.ObjectID) (*models.Room, error) {
	room, err := s.roomRepo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if room == nil {
		return nil, ErrNotFound
	}
	return room, nil
}

func (s *roomService) Create(ctx context.Context, propertyID, landlordID primitive.ObjectID, input CreateRoomInput) (*models.Room, error) {
	// Verify ownership
	prop, err := s.propertyRepo.FindByID(ctx, propertyID)
	if err != nil {
		return nil, err
	}
	if prop == nil {
		return nil, ErrNotFound
	}
	if prop.LandlordID != landlordID {
		return nil, ErrForbidden
	}

	room := &models.Room{
		PropertyID: propertyID,
		Name:       input.Name,
		BaseRent:   input.BaseRent,
	}
	if err = s.roomRepo.Create(ctx, room); err != nil {
		return nil, err
	}
	return room, nil
}

func (s *roomService) Update(ctx context.Context, id primitive.ObjectID, name string, baseRent float64) error {
	return s.roomRepo.Update(ctx, id, name, baseRent)
}

func (s *roomService) Delete(ctx context.Context, id primitive.ObjectID) error {
	return s.roomRepo.Delete(ctx, id)
}

func (s *roomService) AssignTenant(ctx context.Context, roomID primitive.ObjectID, tenantID primitive.ObjectID) error {
	// Deactivate any existing assignment
	if err := s.assignmentRepo.Deactivate(ctx, roomID); err != nil {
		return err
	}
	return s.assignmentRepo.Create(ctx, &models.TenantAssignment{
		RoomID:    roomID,
		TenantID:  tenantID,
		StartDate: time.Now().UTC(),
		IsActive:  true,
	})
}

func (s *roomService) RemoveTenant(ctx context.Context, roomID primitive.ObjectID) error {
	return s.assignmentRepo.Deactivate(ctx, roomID)
}
