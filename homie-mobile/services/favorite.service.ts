import api from './api';
import { Favorite } from '../types';

export const favoriteService = {
  getFavorites: async (): Promise<Favorite[]> => {
    const response = await api.get('/api/favorites');
    return response.data;
  },

  addFavorite: async (listingId: string): Promise<Favorite> => {
    const response = await api.post('/api/favorites', { listingId });
    return response.data;
  },

  removeFavorite: async (listingId: string): Promise<void> => {
    await api.delete(`/api/favorites/${listingId}`);
  },
};
