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

const assignmentsCollection = "tenant_assignments"

type AssignmentRepository interface {
	FindActiveByRoom(ctx context.Context, roomID primitive.ObjectID) (*models.TenantAssignment, error)
	FindByTenant(ctx context.Context, tenantID primitive.ObjectID) ([]models.TenantAssignment, error)
	Create(ctx context.Context, assignment *models.TenantAssignment) error
	Deactivate(ctx context.Context, roomID primitive.ObjectID) error
}

type mongoAssignmentRepo struct {
	col *mongo.Collection
}

func NewAssignmentRepository() AssignmentRepository {
	return &mongoAssignmentRepo{col: database.GetCollection(assignmentsCollection)}
}

func (r *mongoAssignmentRepo) FindActiveByRoom(ctx context.Context, roomID primitive.ObjectID) (*models.TenantAssignment, error) {
	var assignment models.TenantAssignment
	err := r.col.FindOne(ctx, bson.M{"room_id": roomID, "is_active": true}).Decode(&assignment)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	return &assignment, err
}

func (r *mongoAssignmentRepo) FindByTenant(ctx context.Context, tenantID primitive.ObjectID) ([]models.TenantAssignment, error) {
	cursor, err := r.col.Find(ctx, bson.M{"tenant_id": tenantID}, options.Find().SetSort(bson.M{"created_at": -1}))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var assignments []models.TenantAssignment
	if err = cursor.All(ctx, &assignments); err != nil {
		return nil, err
	}
	return assignments, nil
}

func (r *mongoAssignmentRepo) Create(ctx context.Context, assignment *models.TenantAssignment) error {
	assignment.ID = primitive.NewObjectID()
	assignment.CreatedAt = time.Now().UTC()
	assignment.IsActive = true
	_, err := r.col.InsertOne(ctx, assignment)
	return err
}

func (r *mongoAssignmentRepo) Deactivate(ctx context.Context, roomID primitive.ObjectID) error {
	now := time.Now().UTC()
	_, err := r.col.UpdateMany(ctx,
		bson.M{"room_id": roomID, "is_active": true},
		bson.M{"$set": bson.M{"is_active": false, "end_date": now}},
	)
	return err
}
