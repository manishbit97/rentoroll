package handlers

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/manishbit97/rentoroll/internal/services"
)

type AuthHandler struct {
	authSvc services.AuthService
}

func NewAuthHandler(authSvc services.AuthService) *AuthHandler {
	return &AuthHandler{authSvc: authSvc}
}

func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var input services.RegisterInput
	if err := c.BodyParser(&input); err != nil {
		return badRequest(c, "invalid request body")
	}
	if input.Name == "" || input.Email == "" || input.Password == "" || input.Role == "" {
		return badRequest(c, "name, email, password and role are required")
	}
	if len(input.Password) < 6 {
		return badRequest(c, "password must be at least 6 characters")
	}

	user, token, err := h.authSvc.Register(c.Context(), input)
	if err != nil {
		if errors.Is(err, services.ErrEmailTaken) {
			return badRequest(c, err.Error())
		}
		if errors.Is(err, services.ErrInvalidRole) {
			return badRequest(c, err.Error())
		}
		return serverError(c, err)
	}

	return created(c, fiber.Map{"token": token, "user": user})
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var input services.LoginInput
	if err := c.BodyParser(&input); err != nil {
		return badRequest(c, "invalid request body")
	}
	if input.Email == "" || input.Password == "" {
		return badRequest(c, "email and password are required")
	}

	user, token, err := h.authSvc.Login(c.Context(), input)
	if err != nil {
		if errors.Is(err, services.ErrInvalidCreds) {
			return unauthorized(c, err.Error())
		}
		return serverError(c, err)
	}

	return ok(c, fiber.Map{"token": token, "user": user})
}
