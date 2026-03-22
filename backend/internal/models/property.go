package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Property struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	LandlordID primitive.ObjectID `bson:"landlord_id" json:"landlord_id"`
	Name       string             `bson:"name" json:"name"`
	Address    string             `bson:"address" json:"address"`
	CreatedAt  time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt  time.Time          `bson:"updated_at" json:"updated_at"`
}
