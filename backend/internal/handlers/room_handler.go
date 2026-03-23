package handlers

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/manishbit97/rentoroll/internal/middleware"
	"github.com/manishbit97/rentoroll/internal/services"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type RoomHandler struct {
	roomSvc services.RoomService
}

func NewRoomHandler(roomSvc services.RoomService) *RoomHandler {
	return &RoomHandler{roomSvc: roomSvc}
}

func (h *RoomHandler) ListByProperty(c *fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	landlordID, err := primitive.ObjectIDFromHex(claims.UserID)
	if err != nil {
		return badRequest(c, "invalid user id")
	}

	propertyID, err := primitive.ObjectIDFromHex(c.Params("propertyId"))
	if err != nil {
		return badRequest(c, "invalid property id")
	}

	rooms, err := h.roomSvc.ListByProperty(c.Context(), propertyID, landlordID)
	if err != nil {
		if errors.Is(err, services.ErrForbidden) {
			return forbidden(c, "access denied")
		}
		return serverError(c, err)
	}
	return ok(c, rooms)
}

func (h *RoomHandler) Create(c *fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	landlordID, err := primitive.ObjectIDFromHex(claims.UserID)
	if err != nil {
		return badRequest(c, "invalid user id")
	}

	propertyID, err := primitive.ObjectIDFromHex(c.Params("propertyId"))
	if err != nil {
		return badRequest(c, "invalid property id")
	}

	var input services.CreateRoomInput
	if err = c.BodyParser(&input); err != nil {
		return badRequest(c, "invalid request body")
	}
	if input.Name == "" {
		return badRequest(c, "room name is required")
	}
	if input.BaseRent <= 0 {
		return badRequest(c, "base rent must be greater than 0")
	}

	room, err := h.roomSvc.Create(c.Context(), propertyID, landlordID, input)
	if err != nil {
		if errors.Is(err, services.ErrNotFound) {
			return notFound(c, "property not found")
		}
		if errors.Is(err, services.ErrForbidden) {
			return forbidden(c, "access denied")
		}
		return serverError(c, err)
	}
	return created(c, room)
}

func (h *RoomHandler) Update(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return badRequest(c, "invalid room id")
	}

	var body struct {
		Name     string  `json:"name"`
		BaseRent float64 `json:"base_rent"`
	}
	if err = c.BodyParser(&body); err != nil {
		return badRequest(c, "invalid request body")
	}

	if err = h.roomSvc.Update(c.Context(), id, body.Name, body.BaseRent); err != nil {
		if errors.Is(err, services.ErrNotFound) {
			return notFound(c, "room not found")
		}
		return serverError(c, err)
	}
	return ok(c, fiber.Map{"message": "room updated"})
}

func (h *RoomHandler) Delete(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return badRequest(c, "invalid room id")
	}

	if err = h.roomSvc.Delete(c.Context(), id); err != nil {
		return serverError(c, err)
	}
	return ok(c, fiber.Map{"message": "room deleted"})
}

func (h *RoomHandler) AssignTenant(c *fiber.Ctx) error {
	roomID, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return badRequest(c, "invalid room id")
	}

	var body struct {
		TenantID string `json:"tenant_id"`
	}
	if err = c.BodyParser(&body); err != nil {
		return badRequest(c, "invalid request body")
	}
	if body.TenantID == "" {
		return badRequest(c, "tenant_id is required")
	}

	tenantID, err := primitive.ObjectIDFromHex(body.TenantID)
	if err != nil {
		return badRequest(c, "invalid tenant id")
	}

	if err = h.roomSvc.AssignTenant(c.Context(), roomID, tenantID); err != nil {
		return serverError(c, err)
	}
	return ok(c, fiber.Map{"message": "tenant assigned"})
}

func (h *RoomHandler) RemoveTenant(c *fiber.Ctx) error {
	roomID, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return badRequest(c, "invalid room id")
	}

	if err = h.roomSvc.RemoveTenant(c.Context(), roomID); err != nil {
		return serverError(c, err)
	}
	return ok(c, fiber.Map{"message": "tenant removed"})
}
