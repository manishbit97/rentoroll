package middleware

import (
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/manishbit97/rentoroll/internal/models"
	"github.com/manishbit97/rentoroll/internal/services"
)

const CtxUserKey = "user_claims"

// RequireAuth validates the Bearer JWT and attaches claims to the request context.
func RequireAuth() fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(errorResponse("missing authorization header"))
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			return c.Status(fiber.StatusUnauthorized).JSON(errorResponse("invalid authorization format"))
		}

		tokenStr := parts[1]
		secret := os.Getenv("JWT_SECRET")
		if secret == "" {
			secret = "rentoroll-dev-secret-change-in-prod"
		}

		claims := &services.JWTClaims{}
		token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fiber.ErrUnauthorized
			}
			return []byte(secret), nil
		})

		if err != nil || !token.Valid {
			return c.Status(fiber.StatusUnauthorized).JSON(errorResponse("invalid or expired token"))
		}

		c.Locals(CtxUserKey, claims)
		return c.Next()
	}
}

// RequireRole restricts the route to users with the specified role.
func RequireRole(role models.Role) fiber.Handler {
	return func(c *fiber.Ctx) error {
		claims, ok := c.Locals(CtxUserKey).(*services.JWTClaims)
		if !ok || claims == nil {
			return c.Status(fiber.StatusUnauthorized).JSON(errorResponse("unauthorized"))
		}
		if claims.Role != role {
			return c.Status(fiber.StatusForbidden).JSON(errorResponse("insufficient permissions"))
		}
		return c.Next()
	}
}

// GetClaims is a helper to extract claims from fiber context.
func GetClaims(c *fiber.Ctx) *services.JWTClaims {
	claims, _ := c.Locals(CtxUserKey).(*services.JWTClaims)
	return claims
}

func errorResponse(msg string) fiber.Map {
	return fiber.Map{"success": false, "error": msg, "data": nil}
}
