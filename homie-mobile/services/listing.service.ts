import api from './api';
import { Listing, ListingFeedResponse } from '../types';

export interface ListingFilters {
  page?: number;
  limit?: number;
  city?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  furnished?: boolean;
  billsIncluded?: boolean;
  smokersAllowed?: boolean;
  petsAllowed?: boolean;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

export const listingService = {
  getListingFeed: async (
    filters?: ListingFilters
  ): Promise<ListingFeedResponse> => {
    const response = await api.get('/api/listings', { params: filters });
    return response.data;
  },

  getListingsForMap: async (
    lat: number,
    lng: number,
    radius: number
  ): Promise<Listing[]> => {
    const response = await api.get('/api/listings/map', {
      params: { lat, lng, radius },
    });
    return response.data;
  },

  getMyListings: async (): Promise<Listing[]> => {
    const response = await api.get('/api/listings/mine');
    return response.data;
  },

  getListingById: async (id: string): Promise<Listing> => {
    const response = await api.get(`/api/listings/${id}`);
    return response.data;
  },

  createListing: async (data: Partial<Listing>): Promise<Listing> => {
    const response = await api.post('/api/listings', data);
    return response.data;
  },

  updateListing: async (
    id: string,
    data: Partial<Listing>
  ): Promise<Listing> => {
    const response = await api.put(`/api/listings/${id}`, data);
    return response.data;
  },

  deleteListing: async (id: string): Promise<void> => {
    await api.delete(`/api/listings/${id}`);
  },

  updateStatus: async (id: string, status: string): Promise<Listing> => {
    const response = await api.patch(`/api/listings/${id}/status`, { status });
    return response.data;
  },
};
