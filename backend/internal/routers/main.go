package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/manishbit97/rentoroll/internal/handlers"
	"github.com/manishbit97/rentoroll/internal/middleware"
	"github.com/manishbit97/rentoroll/internal/models"
)

type Handlers struct {
	Auth     *handlers.AuthHandler
	User     *handlers.UserHandler
	Property *handlers.PropertyHandler
	Room     *handlers.RoomHandler
	Rent     *handlers.RentHandler
}

// lm (landlord middleware) wraps handlers with auth + landlord role check.
// Using per-route middleware instead of api.Group("") because an empty-prefix
// group applies its middleware to ALL paths under the parent, including /tenant/*.
func lm(h ...fiber.Handler) []fiber.Handler {
	return append([]fiber.Handler{
		middleware.RequireAuth(),
		middleware.RequireRole(models.RoleLandlord),
	}, h...)
}

// tm (tenant middleware) wraps handlers with auth + tenant role check.
func tm(h ...fiber.Handler) []fiber.Handler {
	return append([]fiber.Handler{
		middleware.RequireAuth(),
		middleware.RequireRole(models.RoleTenant),
	}, h...)
}

func SetupRoutes(app *fiber.App, h Handlers) {
	// Health check (public)
	app.Get("/health", handlers.HandleHealthCheck)

	api := app.Group("/api/v1")

	// ── Public auth ────────────────────────────────────────────────────
	auth := api.Group("/auth")
	auth.Post("/register", h.Auth.Register)
	auth.Post("/login", h.Auth.Login)

	// ── Landlord routes ────────────────────────────────────────────────
	// User search
	api.Get("/users/search", lm(h.User.SearchTenant)...)

	// Properties
	api.Get("/properties", lm(h.Property.List)...)
	api.Post("/properties", lm(h.Property.Create)...)
	api.Get("/properties/:id", lm(h.Property.GetByID)...)
	api.Put("/properties/:id", lm(h.Property.Update)...)
	api.Delete("/properties/:id", lm(h.Property.Delete)...)

	// Rooms
	api.Get("/properties/:propertyId/rooms", lm(h.Room.ListByProperty)...)
	api.Post("/properties/:propertyId/rooms", lm(h.Room.Create)...)
	api.Put("/rooms/:id", lm(h.Room.Update)...)
	api.Delete("/rooms/:id", lm(h.Room.Delete)...)
	api.Post("/rooms/:id/assign", lm(h.Room.AssignTenant)...)
	api.Delete("/rooms/:id/assign", lm(h.Room.RemoveTenant)...)

	// Rent (landlord view)
	// NOTE: specific routes before parameterised ones to avoid Fiber ambiguity
	api.Get("/rent/room/:roomId", lm(h.Rent.GetRoomHistory)...)
	api.Get("/rent", lm(h.Rent.GetMonthly)...)
	api.Post("/rent", lm(h.Rent.SaveRecord)...)
	api.Patch("/rent/:id/pay", lm(h.Rent.MarkPaid)...)

	// ── Tenant routes (/tenant prefix keeps them isolated) ─────────────
	api.Get("/tenant/rent", tm(h.Rent.GetMyRent)...)
	api.Get("/tenant/history", tm(h.Rent.GetMyHistory)...)
}
