package handlers

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/manishbit97/rentoroll/internal/middleware"
	"github.com/manishbit97/rentoroll/internal/services"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type PropertyHandler struct {
	propertySvc services.PropertyService
}

func NewPropertyHandler(propertySvc services.PropertyService) *PropertyHandler {
	return &PropertyHandler{propertySvc: propertySvc}
}

func (h *PropertyHandler) List(c *fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	landlordID, err := primitive.ObjectIDFromHex(claims.UserID)
	if err != nil {
		return badRequest(c, "invalid user id")
	}

	properties, err := h.propertySvc.List(c.Context(), landlordID)
	if err != nil {
		return serverError(c, err)
	}
	return ok(c, properties)
}

func (h *PropertyHandler) GetByID(c *fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	landlordID, err := primitive.ObjectIDFromHex(claims.UserID)
	if err != nil {
		return badRequest(c, "invalid user id")
	}

	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return badRequest(c, "invalid property id")
	}

	prop, err := h.propertySvc.GetByID(c.Context(), id, landlordID)
	if err != nil {
		if errors.Is(err, services.ErrNotFound) {
			return notFound(c, "property not found")
		}
		if errors.Is(err, services.ErrForbidden) {
			return forbidden(c, "access denied")
		}
		return serverError(c, err)
	}
	return ok(c, prop)
}

func (h *PropertyHandler) Create(c *fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	landlordID, err := primitive.ObjectIDFromHex(claims.UserID)
	if err != nil {
		return badRequest(c, "invalid user id")
	}

	var input services.CreatePropertyInput
	if err := c.BodyParser(&input); err != nil {
		return badRequest(c, "invalid request body")
	}
	if input.Name == "" {
		return badRequest(c, "property name is required")
	}

	prop, err := h.propertySvc.Create(c.Context(), landlordID, input)
	if err != nil {
		return serverError(c, err)
	}
	return created(c, prop)
}

func (h *PropertyHandler) Update(c *fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	landlordID, err := primitive.ObjectIDFromHex(claims.UserID)
	if err != nil {
		return badRequest(c, "invalid user id")
	}

	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return badRequest(c, "invalid property id")
	}

	var body struct {
		Name    string `json:"name"`
		Address string `json:"address"`
	}
	if err = c.BodyParser(&body); err != nil {
		return badRequest(c, "invalid request body")
	}

	if err = h.propertySvc.Update(c.Context(), id, landlordID, body.Name, body.Address); err != nil {
		if errors.Is(err, services.ErrNotFound) {
			return notFound(c, "property not found")
		}
		if errors.Is(err, services.ErrForbidden) {
			return forbidden(c, "access denied")
		}
		return serverError(c, err)
	}
	return ok(c, fiber.Map{"message": "property updated"})
}

func (h *PropertyHandler) Delete(c *fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	landlordID, err := primitive.ObjectIDFromHex(claims.UserID)
	if err != nil {
		return badRequest(c, "invalid user id")
	}

	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return badRequest(c, "invalid property id")
	}

	if err = h.propertySvc.Delete(c.Context(), id, landlordID); err != nil {
		if errors.Is(err, services.ErrNotFound) {
			return notFound(c, "property not found")
		}
		if errors.Is(err, services.ErrForbidden) {
			return forbidden(c, "access denied")
		}
		return serverError(c, err)
	}
	return ok(c, fiber.Map{"message": "property deleted"})
}
