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

const roomsCollection = "rooms"

type RoomRepository interface {
	FindByProperty(ctx context.Context, propertyID primitive.ObjectID) ([]models.Room, error)
	FindByID(ctx context.Context, id primitive.ObjectID) (*models.Room, error)
	Create(ctx context.Context, room *models.Room) error
	Update(ctx context.Context, id primitive.ObjectID, name string, baseRent float64) error
	Delete(ctx context.Context, id primitive.ObjectID) error
}

type mongoRoomRepo struct {
	col *mongo.Collection
}

func NewRoomRepository() RoomRepository {
	return &mongoRoomRepo{col: database.GetCollection(roomsCollection)}
}

func (r *mongoRoomRepo) FindByProperty(ctx context.Context, propertyID primitive.ObjectID) ([]models.Room, error) {
	cursor, err := r.col.Find(ctx, bson.M{"property_id": propertyID}, options.Find().SetSort(bson.M{"name": 1}))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var rooms []models.Room
	if err = cursor.All(ctx, &rooms); err != nil {
		return nil, err
	}
	return rooms, nil
}

func (r *mongoRoomRepo) FindByID(ctx context.Context, id primitive.ObjectID) (*models.Room, error) {
	var room models.Room
	err := r.col.FindOne(ctx, bson.M{"_id": id}).Decode(&room)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	return &room, err
}

func (r *mongoRoomRepo) Create(ctx context.Context, room *models.Room) error {
	room.ID = primitive.NewObjectID()
	now := time.Now().UTC()
	room.CreatedAt = now
	room.UpdatedAt = now
	_, err := r.col.InsertOne(ctx, room)
	return err
}

func (r *mongoRoomRepo) Update(ctx context.Context, id primitive.ObjectID, name string, baseRent float64) error {
	_, err := r.col.UpdateOne(ctx,
		bson.M{"_id": id},
		bson.M{"$set": bson.M{"name": name, "base_rent": baseRent, "updated_at": time.Now().UTC()}},
	)
	return err
}

func (r *mongoRoomRepo) Delete(ctx context.Context, id primitive.ObjectID) error {
	_, err := r.col.DeleteOne(ctx, bson.M{"_id": id})
	return err
}
