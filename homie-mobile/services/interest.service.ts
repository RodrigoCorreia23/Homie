import api from './api';
import { Interest } from '../types';

export const interestService = {
  sendInterest: async (
    listingId: string,
    message?: string
  ): Promise<Interest> => {
    const response = await api.post('/api/interests', { listingId, message });
    return response.data;
  },

  getSentInterests: async (): Promise<Interest[]> => {
    const response = await api.get('/api/interests/sent');
    return response.data;
  },

  getReceivedInterests: async (): Promise<Interest[]> => {
    const response = await api.get('/api/interests/received');
    return response.data;
  },

  acceptInterest: async (id: string): Promise<Interest> => {
    const response = await api.patch(`/api/interests/${id}/accept`);
    return response.data;
  },

  rejectInterest: async (id: string): Promise<Interest> => {
    const response = await api.patch(`/api/interests/${id}/reject`);
    return response.data;
  },
};
