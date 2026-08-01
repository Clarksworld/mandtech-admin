import { apiRequest, setStoredToken, removeStoredToken, getStoredToken } from './api';
import { AuthResponse } from './types';

export async function loginAdmin(email: string, password: string): Promise<AuthResponse> {
  const data = await apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (data.token) {
    setStoredToken(data.token);
  }
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
  return data;
}

export function logoutAdmin(): void {
  removeStoredToken();
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
