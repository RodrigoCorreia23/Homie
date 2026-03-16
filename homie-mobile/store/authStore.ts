import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types';
import { authService } from '../services/auth.service';
import { userService } from '../services/user.service';

const TOKEN_KEY = 'homie_access_token';
const REFRESH_TOKEN_KEY = 'homie_refresh_token';

async function saveToStore(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function getFromStore(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return await SecureStore.getItemAsync(key);
}

async function removeFromStore(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: {
    email: string;
    password: string;
    name: string;
    dateOfBirth?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => void;
  loadStoredAuth: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await authService.login(email, password);
      await saveToStore(TOKEN_KEY, response.accessToken);
      await saveToStore(REFRESH_TOKEN_KEY, response.refreshToken);
      set({
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  signup: async (data) => {
    set({ isLoading: true });
    try {
      const response = await authService.signup(data);
      await saveToStore(TOKEN_KEY, response.accessToken);
      await saveToStore(REFRESH_TOKEN_KEY, response.refreshToken);
      set({
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore logout API errors
    }
    await removeFromStore(TOKEN_KEY);
    await removeFromStore(REFRESH_TOKEN_KEY);
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setTokens: (accessToken: string, refreshToken: string) => {
    saveToStore(TOKEN_KEY, accessToken);
    saveToStore(REFRESH_TOKEN_KEY, refreshToken);
    set({ accessToken, refreshToken });
  },

  loadStoredAuth: async () => {
    set({ isLoading: true });
    try {
      const accessToken = await getFromStore(TOKEN_KEY);
      const refreshToken = await getFromStore(REFRESH_TOKEN_KEY);

      if (accessToken && refreshToken) {
        set({ accessToken, refreshToken });
        const user = await userService.getProfile();
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      await removeFromStore(TOKEN_KEY);
      await removeFromStore(REFRESH_TOKEN_KEY);
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  refreshAuth: async () => {
    const { refreshToken } = get();
    if (!refreshToken) return;

    try {
      const response = await authService.refresh(refreshToken);
      await saveToStore(TOKEN_KEY, response.accessToken);
      await saveToStore(REFRESH_TOKEN_KEY, response.refreshToken);
      set({
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        isAuthenticated: true,
      });
    } catch {
      get().logout();
    }
  },
}));
