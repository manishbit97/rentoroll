package main

import (
	"context"
	"log"
	"time"

	"github.com/manishbit97/rentoroll/database"
	"github.com/manishbit97/rentoroll/internal/models"
	"github.com/manishbit97/rentoroll/internal/repositories"
	"github.com/manishbit97/rentoroll/internal/services"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func runInitialDbSetup() {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	userRepo := repositories.NewUserRepository()
	authSvc := services.NewAuthService(userRepo)
	propertyRepo := repositories.NewPropertyRepository()
	roomRepo := repositories.NewRoomRepository()

	// ── Create demo landlord ──────────────────────────────────────────
	landlord, err := userRepo.FindByEmail(ctx, "landlord@rentoroll.com")
	if err != nil {
		log.Printf("setup: error checking landlord: %v", err)
		return
	}

	if landlord == nil {
		_, _, err = authSvc.Register(ctx, services.RegisterInput{
			Name:     "Demo Landlord",
			Email:    "landlord@rentoroll.com",
			Password: "demo1234",
			Role:     models.RoleLandlord,
		})
		if err != nil {
			log.Printf("setup: failed to create demo landlord: %v", err)
			return
		}
		log.Println("setup: demo landlord created (landlord@rentoroll.com / demo1234)")

		// Reload to get ID
		landlord, err = userRepo.FindByEmail(ctx, "landlord@rentoroll.com")
		if err != nil || landlord == nil {
			log.Printf("setup: failed to reload landlord: %v", err)
			return
		}
	}

	// ── Create demo tenant ────────────────────────────────────────────
	tenant, err := userRepo.FindByEmail(ctx, "tenant@rentoroll.com")
	if err == nil && tenant == nil {
		_, _, err = authSvc.Register(ctx, services.RegisterInput{
			Name:     "Demo Tenant",
			Email:    "tenant@rentoroll.com",
			Password: "demo1234",
			Role:     models.RoleTenant,
		})
		if err != nil {
			log.Printf("setup: failed to create demo tenant: %v", err)
		} else {
			log.Println("setup: demo tenant created (tenant@rentoroll.com / demo1234)")
		}
	}

	// ── Create demo property if none exist ────────────────────────────
	existing, err := propertyRepo.FindByLandlord(ctx, landlord.ID)
	if err != nil || len(existing) > 0 {
		log.Println("setup: property already exists, skipping")
		return
	}

	prop := &models.Property{
		LandlordID: landlord.ID,
		Name:       "Sunset Apartments",
		Address:    "123 Main Street, Springfield",
	}
	if err = propertyRepo.Create(ctx, prop); err != nil {
		log.Printf("setup: failed to create property: %v", err)
		return
	}
	log.Printf("setup: created property: %s", prop.Name)

	// ── Seed 4 rooms ──────────────────────────────────────────────────
	rooms := []struct {
		name     string
		baseRent float64
	}{
		{"Flat 101", 8000},
		{"Flat 102", 7500},
		{"Flat 103", 8500},
		{"Flat 104", 7000},
	}

	for _, r := range rooms {
		room := &models.Room{
			PropertyID: prop.ID,
			Name:       r.name,
			BaseRent:   r.baseRent,
		}
		if err = roomRepo.Create(ctx, room); err != nil {
			log.Printf("setup: failed to create room %s: %v", r.name, err)
		} else {
			log.Printf("setup: created room: %s (₹%.0f/mo)", r.name, r.baseRent)
		}
	}

	log.Println("setup: initial DB setup completed successfully")
}

// roomExists is a helper to check if room collection is non-empty.
func roomExists(ctx context.Context, propertyID primitive.ObjectID) bool {
	col := database.GetCollection("rooms")
	count, err := col.CountDocuments(ctx, bson.M{"property_id": propertyID})
	return err == nil && count > 0
}
