import { httpClient } from './httpClient';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

interface AuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
  };
  token: string;
}

export const authAPI = {
  login: async (credentials: LoginCredentials) => {
    return httpClient.post<AuthResponse>('/auth/login', credentials);
  },

  register: async (userData: RegisterData) => {
    return httpClient.post<AuthResponse>('/auth/register', userData);
  },

  logout: async () => {
    return httpClient.post('/auth/logout');
  },

  refreshToken: async () => {
    return httpClient.post<{ token: string }>('/auth/refresh');
  },

  getCurrentUser: async () => {
    return httpClient.get<AuthResponse['user']>('/auth/me');
  },

  forgotPassword: async (email: string) => {
    return httpClient.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, newPassword: string) => {
    return httpClient.post('/auth/reset-password', { token, newPassword });
  }
};