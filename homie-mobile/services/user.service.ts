import api from './api';
import { User, Habits, UserPhoto } from '../types';

export const userService = {
  getProfile: async (): Promise<User> => {
    const response = await api.get('/api/users/me');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.put('/api/users/me', data);
    return response.data;
  },

  updateHabits: async (data: Partial<Habits>): Promise<Habits> => {
    const response = await api.put('/api/users/me/habits', data);
    return response.data;
  },

  addPhoto: async (url: string, position: number): Promise<UserPhoto> => {
    const response = await api.post('/api/users/me/photos', { url, position });
    return response.data;
  },

  deletePhoto: async (photoId: string): Promise<void> => {
    await api.delete(`/api/users/me/photos/${photoId}`);
  },

  getPublicProfile: async (userId: string): Promise<User> => {
    const response = await api.get(`/api/users/${userId}`);
    return response.data;
  },

  completeOnboarding: async (data: {
    role: string;
    preferredCity?: string;
    habits: any;
  }) => {
    const response = await api.post('/api/users/me/onboarding', data);
    return response.data;
  },

  updatePushToken: async (token: string) => {
    const response = await api.put('/api/users/me/push-token', { token });
    return response.data;
  },
};
