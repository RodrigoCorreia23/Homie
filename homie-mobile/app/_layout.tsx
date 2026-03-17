import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';
import { COLORS } from '../utils/constants';
import { registerForPushNotifications } from '../utils/notifications';

export default function RootLayout() {
  const { loadStoredAuth, isAuthenticated, isLoading } = useAuthStore();
  const { loadLang } = useLanguageStore();

  useEffect(() => {
    loadStoredAuth();
    loadLang();
  }, []);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      registerForPushNotifications();
    }
  }, [isAuthenticated, isLoading]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/signup" />
        <Stack.Screen
          name="auth/onboarding"
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="listing/[id]"
          options={{
            headerShown: true,
            headerTitle: '',
            headerBackTitle: 'Back',
            headerTintColor: COLORS.primary,
            headerStyle: { backgroundColor: COLORS.surface },
          }}
        />
      </Stack>
    </>
  );
}
