package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Room struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	PropertyID primitive.ObjectID `bson:"property_id" json:"property_id"`
	Name       string             `bson:"name" json:"name"`
	BaseRent   float64            `bson:"base_rent" json:"base_rent"`
	CreatedAt  time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt  time.Time          `bson:"updated_at" json:"updated_at"`
}
