import {
  clearToken,
  getToken,
  login,
  register,
  Role,
  setToken,
  User,
} from "./api";

interface AuthState {
  user: User | null;
  token: string | null;
}

// Decode JWT payload without verification (verification is done server-side)
function decodeJWT(token: string): User | null {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return {
      id: decoded.user_id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name ?? "",
    };
  } catch {
    return null;
  }
}

export async function signIn(
  email: string,
  password: string,
): Promise<AuthState> {
  const res = await login(email, password);
  await setToken(res.token);
  return { user: res.user, token: res.token };
}

export async function signUp(
  name: string,
  email: string,
  password: string,
  role: Role,
  phone?: string,
): Promise<AuthState> {
  const res = await register(name, email, password, role, phone);
  await setToken(res.token);
  return { user: res.user, token: res.token };
}

export async function signOut(): Promise<void> {
  await clearToken();
}

export async function getAuthState(): Promise<AuthState> {
  const token = await getToken();
  if (!token) return { user: null, token: null };
  const user = decodeJWT(token);
  return { user, token };
}
