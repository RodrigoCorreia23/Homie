import api from './api';
import { AuthResponse } from '../types';

export const authService = {
  signup: async (data: {
    email: string;
    password: string;
    name: string;
    dateOfBirth?: string;
  }): Promise<AuthResponse> => {
    const response = await api.post('/api/auth/signup', data);
    return response.data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await api.post('/api/auth/refresh', { refreshToken });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/api/auth/logout');
  },
};
