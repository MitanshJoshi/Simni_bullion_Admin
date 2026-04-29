import apiClient from './apiClient';

export interface AdminUser {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  loginId: string | null;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AdminUser;
}

export async function login(loginId: string, password: string): Promise<LoginResponse> {
  const { data } = await apiClient.post('/auth/login', { loginId, password });
  return data.data;
}

export async function getMe(): Promise<AdminUser> {
  const { data } = await apiClient.get('/users/me');
  return data.data;
}
