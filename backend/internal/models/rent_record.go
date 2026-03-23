package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type PaymentStatus string

const (
	StatusPaid    PaymentStatus = "PAID"
	StatusPartial PaymentStatus = "PARTIAL"
	StatusPending PaymentStatus = "PENDING"
)

type AuditAction string

const (
	ActionPaymentRecorded AuditAction = "PAYMENT_RECORDED"
	ActionPaymentUpdated  AuditAction = "PAYMENT_UPDATED"
)

type PaymentLogEntry struct {
	Action     AuditAction `bson:"action"                json:"action"`
	Amount     float64     `bson:"amount"                json:"amount"`
	PrevAmount float64     `bson:"prev_amount,omitempty" json:"prev_amount,omitempty"`
	ByUserID   string      `bson:"by_user_id"            json:"by_user_id"`
	ByEmail    string      `bson:"by_email"              json:"by_email"`
	At         time.Time   `bson:"at"                    json:"at"`
	Note       string      `bson:"note,omitempty"        json:"note,omitempty"`
}

type RentRecord struct {
	ID           primitive.ObjectID  `bson:"_id,omitempty" json:"id"`
	RoomID       primitive.ObjectID  `bson:"room_id" json:"room_id"`
	TenantID     *primitive.ObjectID `bson:"tenant_id,omitempty" json:"tenant_id,omitempty"`
	PropertyID   primitive.ObjectID  `bson:"property_id" json:"property_id"`
	Month        int                 `bson:"month" json:"month"`
	Year         int                 `bson:"year" json:"year"`
	BaseRent     float64             `bson:"base_rent" json:"base_rent"`
	Electricity  float64             `bson:"electricity" json:"electricity"`
	CarryForward float64             `bson:"carry_forward" json:"carry_forward"` // signed: +ve=debt, -ve=credit
	Total        float64             `bson:"total" json:"total"`                 // base_rent + electricity + carry_forward
	PaidAmount   float64             `bson:"paid_amount" json:"paid_amount"`     // what was actually received
	Status       PaymentStatus       `bson:"status" json:"status"`
	PaidDate     *time.Time          `bson:"paid_date,omitempty" json:"paid_date,omitempty"`
	Notes          string             `bson:"notes,omitempty" json:"notes,omitempty"`
	PaymentHistory []PaymentLogEntry  `bson:"payment_history,omitempty" json:"payment_history,omitempty"`
	CreatedAt      time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt    time.Time           `bson:"updated_at" json:"updated_at"`
}

// RentRecordWithRoom enriches the record with room name for display
type RentRecordWithRoom struct {
	RentRecord `bson:",inline"`
	RoomName   string `bson:"room_name,omitempty" json:"room_name,omitempty"`
	TenantName string `bson:"tenant_name,omitempty" json:"tenant_name,omitempty"`
}
