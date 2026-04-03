import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { notificationService } from '../services/notification.service';
import { useT } from '../utils/i18n';
import { COLORS } from '../utils/constants';
import type { Notification } from '../types';

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  NEW_INTEREST: 'hand-right',
  INTEREST_ACCEPTED: 'checkmark-circle',
  NEW_MESSAGE: 'chatbubble',
  NEW_MATCHING_LISTING: 'home',
  RENT_DUE: 'calendar',
  RENT_OVERDUE: 'alert-circle',
  PAYMENT_RECEIVED: 'cash',
  PAYMENT_CONFIRMED: 'checkmark-done-circle',
};

const COLOR_MAP: Record<string, string> = {
  NEW_INTEREST: COLORS.primary,
  INTEREST_ACCEPTED: COLORS.success,
  NEW_MESSAGE: COLORS.primary,
  NEW_MATCHING_LISTING: COLORS.warning,
  RENT_DUE: '#D97706',
  RENT_OVERDUE: COLORS.error,
  PAYMENT_RECEIVED: COLORS.success,
  PAYMENT_CONFIRMED: COLORS.success,
};

export default function NotificationsScreen() {
  const t = useT();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      // ignore
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // ignore
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t('Agora');
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderNotification = ({ item }: { item: Notification }) => {
    const icon = ICON_MAP[item.type] || 'notifications';
    const color = COLOR_MAP[item.type] || COLORS.textSecondary;

    return (
      <TouchableOpacity
        style={[styles.notifCard, !item.read && styles.notifCardUnread]}
        onPress={() => !item.read && handleMarkAsRead(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <View style={styles.notifContent}>
          <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread]}>
            {item.title}
          </Text>
          {item.body && (
            <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
          )}
        </View>
        <View style={styles.notifMeta}>
          <Text style={styles.notifTime}>{formatTime(item.createdAt)}</Text>
          {!item.read && <View style={styles.unreadDot} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: t('Notificações'),
          headerBackTitle: t('Voltar'),
          headerTintColor: COLORS.primary,
          headerStyle: { backgroundColor: COLORS.surface },
          headerRight: () =>
            unreadCount > 0 ? (
              <TouchableOpacity onPress={handleMarkAllAsRead} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.markAllText}>{t('Marcar tudo')}</Text>
              </TouchableOpacity>
            ) : null,
        }}
      />
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderNotification}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="notifications-off-outline" size={64} color={COLORS.textLight} />
                <Text style={styles.emptyTitle}>{t('Sem notificações')}</Text>
              </View>
            }
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { flexGrow: 1 },
  markAllText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  notifCardUnread: {
    backgroundColor: COLORS.primaryLight,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifContent: { flex: 1, gap: 2 },
  notifTitle: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  notifTitleUnread: { fontWeight: '700' },
  notifBody: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  notifMeta: { alignItems: 'flex-end', gap: 6 },
  notifTime: { fontSize: 12, color: COLORS.textLight },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  emptyState: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingTop: 100, gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text },
});
