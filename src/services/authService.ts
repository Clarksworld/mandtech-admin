import { apiRequest, setStoredToken, removeStoredToken, getStoredToken } from './api';
import { AuthResponse, User } from './types';

const USER_KEY = 'mandtech_admin_user';

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function removeStoredUser(): void {
  localStorage.removeItem(USER_KEY);
}

export async function loginAdmin(email: string, password: string): Promise<AuthResponse> {
  const data = await apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (data.token) {
    setStoredToken(data.token);
  }
  const userToStore: User = data.user || { id: 'usr-1', email, role: 'admin' };
  setStoredUser(userToStore);
  return data;
}

export async function createAdmin(email: string, password: string, role = 'admin'): Promise<AuthResponse> {
  const data = await apiRequest<AuthResponse>('/api/auth/create-admin', {
    method: 'POST',
    body: JSON.stringify({ email, password, role }),
  });
  if (data.token) {
    setStoredToken(data.token);
  }
  const userToStore: User = data.user || { id: 'usr-' + Date.now(), email, role: role as 'admin' | 'staff' };
  setStoredUser(userToStore);
  return data;
}

export function logoutAdmin(): void {
  removeStoredToken();
  removeStoredUser();
}

export function isAuthenticated(): boolean {
  return !!getStoredToken();
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await apiRequest<{ status: string }>('/health');
    return res.status === 'ok';
  } catch {
    return false;
  }
}
