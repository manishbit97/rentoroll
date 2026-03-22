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

const propertiesCollection = "properties"

type PropertyRepository interface {
	FindByLandlord(ctx context.Context, landlordID primitive.ObjectID) ([]models.Property, error)
	FindByID(ctx context.Context, id primitive.ObjectID) (*models.Property, error)
	Create(ctx context.Context, property *models.Property) error
	Update(ctx context.Context, id primitive.ObjectID, name, address string) error
	Delete(ctx context.Context, id primitive.ObjectID) error
}

type mongoPropertyRepo struct {
	col *mongo.Collection
}

func NewPropertyRepository() PropertyRepository {
	return &mongoPropertyRepo{col: database.GetCollection(propertiesCollection)}
}

func (r *mongoPropertyRepo) FindByLandlord(ctx context.Context, landlordID primitive.ObjectID) ([]models.Property, error) {
	cursor, err := r.col.Find(ctx, bson.M{"landlord_id": landlordID}, options.Find().SetSort(bson.M{"created_at": 1}))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var properties []models.Property
	if err = cursor.All(ctx, &properties); err != nil {
		return nil, err
	}
	return properties, nil
}

func (r *mongoPropertyRepo) FindByID(ctx context.Context, id primitive.ObjectID) (*models.Property, error) {
	var property models.Property
	err := r.col.FindOne(ctx, bson.M{"_id": id}).Decode(&property)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	return &property, err
}

func (r *mongoPropertyRepo) Create(ctx context.Context, property *models.Property) error {
	property.ID = primitive.NewObjectID()
	now := time.Now().UTC()
	property.CreatedAt = now
	property.UpdatedAt = now
	_, err := r.col.InsertOne(ctx, property)
	return err
}

func (r *mongoPropertyRepo) Update(ctx context.Context, id primitive.ObjectID, name, address string) error {
	_, err := r.col.UpdateOne(ctx,
		bson.M{"_id": id},
		bson.M{"$set": bson.M{"name": name, "address": address, "updated_at": time.Now().UTC()}},
	)
	return err
}

func (r *mongoPropertyRepo) Delete(ctx context.Context, id primitive.ObjectID) error {
	_, err := r.col.DeleteOne(ctx, bson.M{"_id": id})
	return err
}
