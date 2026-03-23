package database

import (
	"context"
	"errors"
	"os"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var mongoClient *mongo.Client
var dbName string

func GetCollection(name string) *mongo.Collection {
	return mongoClient.Database(dbName).Collection(name)
}

func StartMongoDB() error {
	uri := os.Getenv("MONGODB_URI")
	if uri == "" {
		return errors.New("MONGODB_URI environment variable is required")
	}

	database := os.Getenv("DATABASE")
	if database == "" {
		return errors.New("DATABASE environment variable is required")
	}
	dbName = database

	var err error
	mongoClient, err = mongo.Connect(context.Background(), options.Client().ApplyURI(uri))
	if err != nil {
		return err
	}

	if err = mongoClient.Ping(context.Background(), nil); err != nil {
		return errors.New("cannot connect to MongoDB: " + err.Error())
	}

	return nil
}

func CloseMongoDB() {
	if err := mongoClient.Disconnect(context.Background()); err != nil {
		panic(err)
	}
}

// EnsureIndexes creates all required indexes for the application.
func EnsureIndexes() error {
	ctx := context.Background()

	// users: unique email
	_, err := GetCollection("users").Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "email", Value: 1}},
		Options: options.Index().SetUnique(true),
	})
	if err != nil {
		return err
	}

	// properties: landlord_id
	_, err = GetCollection("properties").Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "landlord_id", Value: 1}},
	})
	if err != nil {
		return err
	}

	// rooms: property_id
	_, err = GetCollection("rooms").Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "property_id", Value: 1}},
	})
	if err != nil {
		return err
	}

	// tenant_assignments: compound + tenant lookup
	_, err = GetCollection("tenant_assignments").Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "room_id", Value: 1}, {Key: "is_active", Value: 1}}},
		{Keys: bson.D{{Key: "tenant_id", Value: 1}}},
	})
	if err != nil {
		return err
	}

	// rent_records: unique compound (room+month+year)
	_, err = GetCollection("rent_records").Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "room_id", Value: 1}, {Key: "month", Value: 1}, {Key: "year", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{Keys: bson.D{{Key: "property_id", Value: 1}, {Key: "month", Value: 1}, {Key: "year", Value: 1}}},
		{Keys: bson.D{{Key: "tenant_id", Value: 1}}},
	})
	return err
}
