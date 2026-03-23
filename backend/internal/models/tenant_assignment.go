package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TenantAssignment struct {
	ID        primitive.ObjectID  `bson:"_id,omitempty" json:"id"`
	RoomID    primitive.ObjectID  `bson:"room_id" json:"room_id"`
	TenantID  primitive.ObjectID  `bson:"tenant_id" json:"tenant_id"`
	StartDate time.Time           `bson:"start_date" json:"start_date"`
	EndDate   *time.Time          `bson:"end_date,omitempty" json:"end_date,omitempty"`
	IsActive  bool                `bson:"is_active" json:"is_active"`
	CreatedAt time.Time           `bson:"created_at" json:"created_at"`
}

// TenantAssignmentWithDetails enriches the assignment with tenant + room info
type TenantAssignmentWithDetails struct {
	TenantAssignment `bson:",inline"`
	TenantName       string `bson:"tenant_name,omitempty" json:"tenant_name,omitempty"`
	TenantEmail      string `bson:"tenant_email,omitempty" json:"tenant_email,omitempty"`
	RoomName         string `bson:"room_name,omitempty" json:"room_name,omitempty"`
}
