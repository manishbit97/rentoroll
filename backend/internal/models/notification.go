package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type NotificationChannel string

const (
	ChannelWhatsApp NotificationChannel = "whatsapp"
	ChannelSMS      NotificationChannel = "sms"
	ChannelEmail    NotificationChannel = "email"
)

type NotificationStatus string

const (
	NotificationSent   NotificationStatus = "sent"
	NotificationFailed NotificationStatus = "failed"
)

type NotificationLog struct {
	ID           primitive.ObjectID  `bson:"_id,omitempty" json:"id"`
	RentRecordID primitive.ObjectID  `bson:"rent_record_id" json:"rent_record_id"`
	TenantID     primitive.ObjectID  `bson:"tenant_id" json:"tenant_id"`
	Channel      NotificationChannel `bson:"channel" json:"channel"`
	Message      string              `bson:"message" json:"message"`
	Status       NotificationStatus  `bson:"status" json:"status"`
	Error        string              `bson:"error,omitempty" json:"error,omitempty"`
	SentAt       time.Time           `bson:"sent_at" json:"sent_at"`
}
