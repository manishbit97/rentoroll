package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/manishbit97/rentoroll/internal/models"
	"github.com/manishbit97/rentoroll/internal/repositories"
)

type UserHandler struct {
	userRepo repositories.UserRepository
}

func NewUserHandler(userRepo repositories.UserRepository) *UserHandler {
	return &UserHandler{userRepo: userRepo}
}

// SearchTenant godoc
// GET /api/v1/users/search?email=...
// Landlord-only: look up a registered tenant by email so they can be assigned to a room.
func (h *UserHandler) SearchTenant(c *fiber.Ctx) error {
	email := c.Query("email")
	if email == "" {
		return badRequest(c, "email query param is required")
	}

	user, err := h.userRepo.FindByEmail(c.Context(), email)
	if err != nil {
		return serverError(c, err)
	}
	if user == nil {
		return notFound(c, "no user found with that email")
	}
	if user.Role != models.RoleTenant {
		return badRequest(c, "that user is not a tenant")
	}

	return ok(c, fiber.Map{
		"id":    user.ID.Hex(),
		"name":  user.Name,
		"email": user.Email,
		"role":  user.Role,
	})
}
