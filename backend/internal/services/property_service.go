package services

import (
	"context"
	"errors"

	"github.com/manishbit97/rentoroll/internal/models"
	"github.com/manishbit97/rentoroll/internal/repositories"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

var ErrNotFound = errors.New("resource not found")
var ErrForbidden = errors.New("access denied")

type CreatePropertyInput struct {
	Name    string `json:"name"`
	Address string `json:"address"`
}

type PropertyService interface {
	List(ctx context.Context, landlordID primitive.ObjectID) ([]models.Property, error)
	GetByID(ctx context.Context, id primitive.ObjectID, landlordID primitive.ObjectID) (*models.Property, error)
	Create(ctx context.Context, landlordID primitive.ObjectID, input CreatePropertyInput) (*models.Property, error)
	Update(ctx context.Context, id primitive.ObjectID, landlordID primitive.ObjectID, name, address string) error
	Delete(ctx context.Context, id primitive.ObjectID, landlordID primitive.ObjectID) error
}

type propertyService struct {
	repo repositories.PropertyRepository
}

func NewPropertyService(repo repositories.PropertyRepository) PropertyService {
	return &propertyService{repo: repo}
}

func (s *propertyService) List(ctx context.Context, landlordID primitive.ObjectID) ([]models.Property, error) {
	return s.repo.FindByLandlord(ctx, landlordID)
}

func (s *propertyService) GetByID(ctx context.Context, id primitive.ObjectID, landlordID primitive.ObjectID) (*models.Property, error) {
	prop, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if prop == nil {
		return nil, ErrNotFound
	}
	if prop.LandlordID != landlordID {
		return nil, ErrForbidden
	}
	return prop, nil
}

func (s *propertyService) Create(ctx context.Context, landlordID primitive.ObjectID, input CreatePropertyInput) (*models.Property, error) {
	prop := &models.Property{
		LandlordID: landlordID,
		Name:       input.Name,
		Address:    input.Address,
	}
	if err := s.repo.Create(ctx, prop); err != nil {
		return nil, err
	}
	return prop, nil
}

func (s *propertyService) Update(ctx context.Context, id primitive.ObjectID, landlordID primitive.ObjectID, name, address string) error {
	prop, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if prop == nil {
		return ErrNotFound
	}
	if prop.LandlordID != landlordID {
		return ErrForbidden
	}
	return s.repo.Update(ctx, id, name, address)
}

func (s *propertyService) Delete(ctx context.Context, id primitive.ObjectID, landlordID primitive.ObjectID) error {
	prop, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if prop == nil {
		return ErrNotFound
	}
	if prop.LandlordID != landlordID {
		return ErrForbidden
	}
	return s.repo.Delete(ctx, id)
}
