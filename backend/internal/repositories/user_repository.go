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
)

const usersCollection = "users"

type UserRepository interface {
	FindByEmail(ctx context.Context, email string) (*models.User, error)
	FindByID(ctx context.Context, id primitive.ObjectID) (*models.User, error)
	Create(ctx context.Context, user *models.User) error
}

type mongoUserRepo struct {
	col *mongo.Collection
}

func NewUserRepository() UserRepository {
	return &mongoUserRepo{col: database.GetCollection(usersCollection)}
}

func (r *mongoUserRepo) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	err := r.col.FindOne(ctx, bson.M{"email": email}).Decode(&user)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	return &user, err
}

func (r *mongoUserRepo) FindByID(ctx context.Context, id primitive.ObjectID) (*models.User, error) {
	var user models.User
	err := r.col.FindOne(ctx, bson.M{"_id": id}).Decode(&user)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	return &user, err
}

func (r *mongoUserRepo) Create(ctx context.Context, user *models.User) error {
	user.ID = primitive.NewObjectID()
	now := time.Now().UTC()
	user.CreatedAt = now
	user.UpdatedAt = now
	_, err := r.col.InsertOne(ctx, user)
	return err
}
