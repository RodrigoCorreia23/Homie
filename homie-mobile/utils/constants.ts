const DEV_API_URL = 'http://localhost:3001';
const PROD_API_URL = 'https://homie-api.onrender.com';

export const API_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;

export const COLORS = {
  primary: '#4A90D9',
  primaryDark: '#3A7BC8',
  primaryLight: '#E8F1FB',
  secondary: '#FF6B6B',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  background: '#F5F7FA',
  surface: '#FFFFFF',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
};
