import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "rentoroll_token";
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080";

// ── Token helpers ──────────────────────────────────────────────────────────

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}


export async function clearToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

// ── Types ──────────────────────────────────────────────────────────────────

export type Role = "landlord" | "tenant";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
}

export interface Property {
  id: string;
  landlord_id: string;
  name: string;
  address: string;
  created_at: string;
}

export interface Room {
  id: string;
  property_id: string;
  name: string;
  base_rent: number;
  base_rent_effective_from?: string | null;
  tenant_id?: string;
  tenant_name?: string;
  tenant_email?: string;
  is_occupied: boolean;
}

export type PaymentStatus = "PAID" | "PARTIAL" | "PENDING";

export type AuditAction = "PAYMENT_RECORDED" | "PAYMENT_UPDATED" | "ADVANCE_APPLIED";

export interface PaymentLogEntry {
  action: AuditAction;
  amount: number;
  prev_amount?: number;
  by_user_id: string;
  by_email: string;
  at: string;
  note?: string;
}

export interface RentRecord {
  id: string;
  room_id: string;
  tenant_id?: string;
  property_id: string;
  month: number;
  year: number;
  base_rent: number;
  electricity: number;
  carry_forward: number;  // signed: +ve=debt from prev month, -ve=credit
  total: number;          // base_rent + electricity + carry_forward
  paid_amount: number;    // what was actually received
  status: PaymentStatus;
  paid_date?: string;
  notes?: string;
  payment_history?: PaymentLogEntry[];
  created_at: string;
  updated_at: string;
  // enriched fields (tenant endpoints only)
  room_name?: string;
  property_name?: string;
  landlord_upi?: string;
  landlord_name?: string;
  // advance + vacating (from active assignment)
  advance_amount?: number;
  advance_adjusted?: boolean;
  vacating_date?: string | null;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string;
  upi_id: string;
}

export interface MonthlyRentResult {
  room: Room;
  rent_record: RentRecord;
  tenant_name?: string;
  advance_amount: number;
  advance_adjusted: boolean;
  vacating_date: string | null;
  vacating_set_by: string | null;
}

export interface ApplyAdvanceResult {
  rent_record: RentRecord;
  payment_applied: number;
  refund: number;
  shortfall: number;
}

// ── Core fetch wrapper ─────────────────────────────────────────────────────

// Recursively maps _id → id on any object/array returned from the API
function normalizeIds(data: unknown): unknown {
  if (Array.isArray(data)) return data.map(normalizeIds);
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(obj)) {
      result[key] = normalizeIds(obj[key]);
    }
    if (result._id !== undefined && result.id === undefined) {
      result.id = result._id;
    }
    return result;
  }
  return data;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}/api/v1${path}`, {
    ...options,
    headers,
  });

  const json = await res.json();

  if (!json.success) {
    throw new Error(json.error ?? "Request failed");
  }

  return normalizeIds(json.data) as T;
}

// ── Auth ───────────────────────────────────────────────────────────────────

export async function register(
  name: string,
  email: string,
  password: string,
  role: Role,
  phone?: string
): Promise<{ token: string; user: User }> {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password, role, phone }),
  });
}

export async function login(
  email: string,
  password: string
): Promise<{ token: string; user: User }> {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function forgotPassword(email: string): Promise<void> {
  return request("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(
  email: string,
  otp: string,
  new_password: string
): Promise<void> {
  return request("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, otp, new_password }),
  });
}

export async function getProfile(): Promise<UserProfile> {
  return request("/auth/profile");
}

export async function updateProfile(data: Partial<Pick<UserProfile, "name" | "phone" | "upi_id">>): Promise<UserProfile> {
  return request("/auth/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ── Properties ────────────────────────────────────────────────────────────

export async function getProperties(): Promise<Property[]> {
  return request("/properties");
}

export async function getProperty(id: string): Promise<Property> {
  return request(`/properties/${id}`);
}

export async function createProperty(
  name: string,
  address: string
): Promise<Property> {
  return request("/properties", {
    method: "POST",
    body: JSON.stringify({ name, address }),
  });
}

export async function updateProperty(
  id: string,
  name: string,
  address: string
): Promise<void> {
  return request(`/properties/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name, address }),
  });
}

export async function deleteProperty(id: string): Promise<void> {
  return request(`/properties/${id}`, { method: "DELETE" });
}

// ── Rooms ─────────────────────────────────────────────────────────────────

export async function getRooms(propertyId: string): Promise<Room[]> {
  return request(`/properties/${propertyId}/rooms`);
}

export async function createRoom(
  propertyId: string,
  name: string,
  base_rent: number
): Promise<Room> {
  return request(`/properties/${propertyId}/rooms`, {
    method: "POST",
    body: JSON.stringify({ name, base_rent }),
  });
}

export async function updateRoom(
  id: string,
  name: string,
  base_rent: number
): Promise<void> {
  return request(`/rooms/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name, base_rent }),
  });
}

export interface TenantSearchResult {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export async function searchTenant(email: string): Promise<TenantSearchResult> {
  return request(`/users/search?email=${encodeURIComponent(email)}`);
}

export async function assignTenant(
  roomId: string,
  tenantId: string
): Promise<void> {
  return request(`/rooms/${roomId}/assign`, {
    method: "POST",
    body: JSON.stringify({ tenant_id: tenantId }),
  });
}

export async function removeTenant(roomId: string): Promise<void> {
  return request(`/rooms/${roomId}/assign`, { method: "DELETE" });
}

// ── Rent ──────────────────────────────────────────────────────────────────

export async function getMonthlyRent(
  propertyId: string,
  month: number,
  year: number
): Promise<MonthlyRentResult[]> {
  return request(
    `/rent?propertyId=${propertyId}&month=${month}&year=${year}`
  );
}

export async function getRoomHistory(roomId: string): Promise<RentRecord[]> {
  return request(`/rent/room/${roomId}`);
}

export async function saveRentRecord(data: {
  room_id: string;
  property_id: string;
  month: number;
  year: number;
  base_rent: number;
  electricity: number;
  notes?: string;
}): Promise<RentRecord> {
  return request("/rent", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function markAsPaid(
  id: string,
  paidDate?: string,
  amount?: number
): Promise<void> {
  return request(`/rent/${id}/pay`, {
    method: "PATCH",
    body: JSON.stringify({ paid_date: paidDate, ...(amount != null ? { amount } : {}) }),
  });
}

// ── Tenant ────────────────────────────────────────────────────────────────

export async function getMyRent(
  month: number,
  year: number
): Promise<RentRecord[]> {
  return request(`/tenant/rent?month=${month}&year=${year}`);
}

export async function getMyHistory(): Promise<RentRecord[]> {
  return request("/tenant/history");
}

// ── Advance / Vacating / Rent Increase ────────────────────────────────────

export async function updateAdvance(roomId: string, amount: number): Promise<void> {
  return request(`/rooms/${roomId}/advance`, {
    method: "PATCH",
    body: JSON.stringify({ amount }),
  });
}

export async function setVacatingDate(roomId: string, vacatingDate: string): Promise<void> {
  return request(`/rooms/${roomId}/vacating`, {
    method: "PATCH",
    body: JSON.stringify({ vacating_date: vacatingDate }),
  });
}

export async function clearVacatingDate(roomId: string): Promise<void> {
  return request(`/rooms/${roomId}/vacating`, { method: "DELETE" });
}

export async function applyAdvance(rentRecordId: string): Promise<ApplyAdvanceResult> {
  return request("/rent/apply-advance", {
    method: "POST",
    body: JSON.stringify({ rent_record_id: rentRecordId }),
  });
}

export async function applyRentIncrease(
  roomId: string,
  newBaseRent: number,
  fromMonth: number,
  fromYear: number
): Promise<{ updated_count: number; room: Room }> {
  return request(`/rent/room/${roomId}/increase`, {
    method: "POST",
    body: JSON.stringify({ new_base_rent: newBaseRent, from_month: fromMonth, from_year: fromYear }),
  });
}

export async function setMyVacatingDate(vacatingDate: string): Promise<void> {
  return request("/tenant/vacating", {
    method: "PATCH",
    body: JSON.stringify({ vacating_date: vacatingDate }),
  });
}

export async function clearMyVacatingDate(): Promise<void> {
  return request("/tenant/vacating", { method: "DELETE" });
}
