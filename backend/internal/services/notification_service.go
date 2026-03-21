package services

import "context"

// NotificationChannel is the interface that all messaging providers must implement.
// Future implementations: WhatsAppChannel, SMSChannel, EmailChannel.
type NotificationChannel interface {
	// Send sends a notification to the recipient.
	Send(ctx context.Context, recipientPhone string, message string) error
	// Name returns the channel identifier (e.g. "whatsapp", "sms", "email").
	Name() string
}
