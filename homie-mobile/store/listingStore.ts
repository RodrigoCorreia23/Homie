import { create } from 'zustand';
import { Listing, Favorite } from '../types';
import {
  listingService,
  ListingFilters,
} from '../services/listing.service';
import { favoriteService } from '../services/favorite.service';

interface ListingState {
  listings: Listing[];
  myListings: Listing[];
  favorites: Favorite[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: ListingFilters;
  isLoading: boolean;
  fetchListings: (filters?: ListingFilters) => Promise<void>;
  fetchMyListings: () => Promise<void>;
  fetchFavorites: () => Promise<void>;
  toggleFavorite: (listingId: string) => Promise<void>;
  setFilters: (filters: ListingFilters) => void;
  clearFilters: () => void;
}

const defaultPagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
};

export const useListingStore = create<ListingState>((set, get) => ({
  listings: [],
  myListings: [],
  favorites: [],
  pagination: defaultPagination,
  filters: {},
  isLoading: false,

  fetchListings: async (filters?: ListingFilters) => {
    set({ isLoading: true });
    try {
      const mergedFilters = { ...get().filters, ...filters };
      const response = await listingService.getListingFeed(mergedFilters);
      set({
        listings: response.listings,
        pagination: response.pagination,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchMyListings: async () => {
    set({ isLoading: true });
    try {
      const myListings = await listingService.getMyListings();
      set({ myListings, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchFavorites: async () => {
    set({ isLoading: true });
    try {
      const favorites = await favoriteService.getFavorites();
      set({ favorites, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  toggleFavorite: async (listingId: string) => {
    const { favorites } = get();
    const existing = favorites.find((f) => f.listingId === listingId);

    if (existing) {
      set({
        favorites: favorites.filter((f) => f.listingId !== listingId),
      });
      try {
        await favoriteService.removeFavorite(listingId);
      } catch {
        set({ favorites });
      }
    } else {
      try {
        const newFavorite = await favoriteService.addFavorite(listingId);
        set({ favorites: [...favorites, newFavorite] });
      } catch {
        // Revert handled by not updating state on error
      }
    }
  },

  setFilters: (filters: ListingFilters) => {
    set({ filters: { ...get().filters, ...filters } });
  },

  clearFilters: () => {
    set({ filters: {} });
  },
}));
