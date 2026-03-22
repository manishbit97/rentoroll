package main

import (
	"fmt"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	config "github.com/manishbit97/rentoroll/configs"
	"github.com/manishbit97/rentoroll/database"
	"github.com/manishbit97/rentoroll/internal/handlers"
	"github.com/manishbit97/rentoroll/internal/repositories"
	router "github.com/manishbit97/rentoroll/internal/routers"
	"github.com/manishbit97/rentoroll/internal/services"
)

func setupAndRunApp() error {
	err := config.LoadENV()
	if err != nil {
		return err
	}

	// Start database
	err = database.StartMongoDB()
	if err != nil {
		return err
	}
	defer database.CloseMongoDB()

	// Ensure indexes
	if err = database.EnsureIndexes(); err != nil {
		fmt.Printf("Warning: failed to create indexes: %v\n", err)
	}

	// Run initial setup if requested
	if os.Getenv("RUN_SETUP") == "true" {
		runInitialDbSetup()
	}

	// ── Wire up repositories ──────────────────────────────────────────
	userRepo := repositories.NewUserRepository()
	propertyRepo := repositories.NewPropertyRepository()
	roomRepo := repositories.NewRoomRepository()
	assignmentRepo := repositories.NewAssignmentRepository()
	rentRepo := repositories.NewRentRepository()

	// ── Wire up services ──────────────────────────────────────────────
	authSvc := services.NewAuthService(userRepo)
	propertySvc := services.NewPropertyService(propertyRepo)
	roomSvc := services.NewRoomService(roomRepo, assignmentRepo, propertyRepo, userRepo)
	rentSvc := services.NewRentService(rentRepo, roomRepo, assignmentRepo, userRepo)

	// ── Wire up handlers ──────────────────────────────────────────────
	h := router.Handlers{
		Auth:     handlers.NewAuthHandler(authSvc),
		User:     handlers.NewUserHandler(userRepo),
		Property: handlers.NewPropertyHandler(propertySvc),
		Room:     handlers.NewRoomHandler(roomSvc),
		Rent:     handlers.NewRentHandler(rentSvc),
	}

	// ── Create Fiber app ──────────────────────────────────────────────
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"success": false,
				"data":    nil,
				"error":   err.Error(),
			})
		},
	})

	// Middleware
	app.Use(recover.New())
	app.Use(logger.New(logger.Config{
		Format: "[${ip}]:${port} ${status} - ${method} ${path} ${latency}\n",
	}))
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, PATCH, DELETE, OPTIONS",
	}))

	// Setup routes
	router.SetupRoutes(app, h)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	return app.Listen(":" + port)
}

func main() {
	if err := setupAndRunApp(); err != nil {
		fmt.Fprintf(os.Stderr, "fatal: %v\n", err)
		os.Exit(1)
	}
}
