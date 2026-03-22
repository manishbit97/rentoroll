package handlers

import (
	"errors"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/manishbit97/rentoroll/internal/middleware"
	"github.com/manishbit97/rentoroll/internal/services"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type RentHandler struct {
	rentSvc services.RentService
}

func NewRentHandler(rentSvc services.RentService) *RentHandler {
	return &RentHandler{rentSvc: rentSvc}
}

// GetMonthly GET /api/v1/rent?propertyId=&month=&year=
func (h *RentHandler) GetMonthly(c *fiber.Ctx) error {
	propertyIDStr := c.Query("propertyId")
	if propertyIDStr == "" {
		return badRequest(c, "propertyId query param required")
	}
	propertyID, err := primitive.ObjectIDFromHex(propertyIDStr)
	if err != nil {
		return badRequest(c, "invalid property id")
	}

	now := time.Now()
	month := now.Month()
	year := now.Year()

	if m := c.QueryInt("month", 0); m > 0 {
		month = time.Month(m)
	}
	if y := c.QueryInt("year", 0); y > 0 {
		year = y
	}

	results, err := h.rentSvc.GetMonthlyForProperty(c.Context(), propertyID, int(month), year)
	if err != nil {
		return serverError(c, err)
	}
	return ok(c, results)
}

// GetRoomHistory GET /api/v1/rent/room/:roomId
func (h *RentHandler) GetRoomHistory(c *fiber.Ctx) error {
	roomID, err := primitive.ObjectIDFromHex(c.Params("roomId"))
	if err != nil {
		return badRequest(c, "invalid room id")
	}

	records, err := h.rentSvc.GetRoomHistory(c.Context(), roomID)
	if err != nil {
		return serverError(c, err)
	}
	return ok(c, records)
}

// SaveRecord POST /api/v1/rent
func (h *RentHandler) SaveRecord(c *fiber.Ctx) error {
	var input services.SaveRentInput
	if err := c.BodyParser(&input); err != nil {
		return badRequest(c, "invalid request body")
	}
	if input.RoomID == "" || input.PropertyID == "" {
		return badRequest(c, "room_id and property_id are required")
	}
	if input.Month < 1 || input.Month > 12 {
		return badRequest(c, "month must be between 1 and 12")
	}
	if input.Year < 2020 {
		return badRequest(c, "invalid year")
	}

	record, err := h.rentSvc.SaveRecord(c.Context(), input)
	if err != nil {
		return serverError(c, err)
	}
	return ok(c, record)
}

// MarkPaid PATCH /api/v1/rent/:id/pay
// Body: { paid_date?: string, amount?: float64 }
// If amount > 0, records a partial or full payment with cascade.
// If amount is omitted or 0, marks the record as fully paid (backward compat).
func (h *RentHandler) MarkPaid(c *fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return badRequest(c, "invalid rent record id")
	}

	var body struct {
		PaidDate string  `json:"paid_date"`
		Amount   float64 `json:"amount"`
	}
	if err = c.BodyParser(&body); err != nil {
		return badRequest(c, "invalid request body")
	}

	paidDate := time.Now().UTC()
	if body.PaidDate != "" {
		parsed, err := time.Parse(time.RFC3339, body.PaidDate)
		if err != nil {
			parsed, err = time.Parse("2006-01-02", body.PaidDate)
			if err != nil {
				return badRequest(c, "paid_date must be RFC3339 or YYYY-MM-DD format")
			}
		}
		paidDate = parsed.UTC()
	}

	byUserID, byEmail := "", ""
	if claims != nil {
		byUserID = claims.UserID
		byEmail = claims.Email
	}

	if body.Amount > 0 {
		if err = h.rentSvc.RecordPayment(c.Context(), id, body.Amount, paidDate, byUserID, byEmail); err != nil {
			if errors.Is(err, services.ErrNotFound) {
				return notFound(c, "rent record not found")
			}
			return serverError(c, err)
		}
		return ok(c, fiber.Map{"message": "payment recorded", "paid_date": paidDate, "amount": body.Amount})
	}

	if err = h.rentSvc.MarkPaid(c.Context(), id, paidDate, byUserID, byEmail); err != nil {
		if errors.Is(err, services.ErrNotFound) {
			return notFound(c, "rent record not found")
		}
		return serverError(c, err)
	}
	return ok(c, fiber.Map{"message": "marked as paid", "paid_date": paidDate})
}

// GetMyRent GET /api/v1/tenant/rent?month=&year=
func (h *RentHandler) GetMyRent(c *fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	tenantID, err := primitive.ObjectIDFromHex(claims.UserID)
	if err != nil {
		return badRequest(c, "invalid user id")
	}

	now := time.Now()
	monthStr := c.Query("month", strconv.Itoa(int(now.Month())))
	yearStr := c.Query("year", strconv.Itoa(now.Year()))

	month, err := strconv.Atoi(monthStr)
	if err != nil {
		return badRequest(c, "invalid month")
	}
	year, err := strconv.Atoi(yearStr)
	if err != nil {
		return badRequest(c, "invalid year")
	}

	records, err := h.rentSvc.GetMyRent(c.Context(), tenantID, month, year)
	if err != nil {
		return serverError(c, err)
	}
	return ok(c, records)
}

// GetMyHistory GET /api/v1/tenant/history
func (h *RentHandler) GetMyHistory(c *fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	tenantID, err := primitive.ObjectIDFromHex(claims.UserID)
	if err != nil {
		return badRequest(c, "invalid user id")
	}

	records, err := h.rentSvc.GetMyHistory(c.Context(), tenantID)
	if err != nil {
		return serverError(c, err)
	}
	return ok(c, records)
}
