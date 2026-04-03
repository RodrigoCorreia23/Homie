import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { interestService } from '../services/interest.service';
import { useT } from '../utils/i18n';
import { COLORS } from '../utils/constants';
import type { Interest } from '../types';

export default function InterestsScreen() {
  const t = useT();
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadInterests();
  }, []);

  const loadInterests = async () => {
    try {
      const data = await interestService.getReceivedInterests();
      setInterests(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInterests();
    setRefreshing(false);
  }, []);

  const handleAccept = (interest: Interest) => {
    Alert.alert(t('Aceitar interesse'), t('Ao aceitar, uma conversa será criada entre vocês.'), [
      { text: t('Cancelar'), style: 'cancel' },
      {
        text: t('Aceitar'),
        onPress: async () => {
          setProcessing(interest.id);
          try {
            await interestService.acceptInterest(interest.id);
            setInterests((prev) =>
              prev.map((i) => (i.id === interest.id ? { ...i, status: 'ACCEPTED' } : i))
            );
          } catch {
            Alert.alert(t('Erro'), t('Não foi possível aceitar.'));
          } finally {
            setProcessing(null);
          }
        },
      },
    ]);
  };

  const handleReject = (interest: Interest) => {
    Alert.alert(t('Rejeitar interesse'), t('Tens a certeza que queres rejeitar?'), [
      { text: t('Cancelar'), style: 'cancel' },
      {
        text: t('Rejeitar'),
        style: 'destructive',
        onPress: async () => {
          setProcessing(interest.id);
          try {
            await interestService.rejectInterest(interest.id);
            setInterests((prev) =>
              prev.map((i) => (i.id === interest.id ? { ...i, status: 'REJECTED' } : i))
            );
          } catch {
            Alert.alert(t('Erro'), t('Não foi possível rejeitar.'));
          } finally {
            setProcessing(null);
          }
        },
      },
    ]);
  };

  const pendingInterests = interests.filter((i) => i.status === 'PENDING');
  const resolvedInterests = interests.filter((i) => i.status !== 'PENDING');

  const renderInterestCard = ({ item }: { item: Interest }) => {
    const user = item.user;
    const listing = item.listing;
    const isPending = item.status === 'PENDING';
    const isProcessing = processing === item.id;

    return (
      <View style={[styles.card, !isPending && styles.cardResolved]}>
        <View style={styles.cardHeader}>
          <TouchableOpacity
            style={styles.userRow}
            onPress={() => user?.id && router.push(`/user/${user.id}` as any)}
          >
            {user?.photos?.[0]?.url ? (
              <Image source={{ uri: user.photos[0].url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={20} color={COLORS.textLight} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{user?.name || t('Utilizador')}</Text>
              {listing && (
                <Text style={styles.listingTitle} numberOfLines={1}>
                  {listing.title} · {listing.city}
                </Text>
              )}
            </View>
          </TouchableOpacity>

          {!isPending && (
            <View style={[
              styles.statusBadge,
              item.status === 'ACCEPTED' && { backgroundColor: '#D1FAE5' },
              item.status === 'REJECTED' && { backgroundColor: '#FEE2E2' },
            ]}>
              <Text style={[
                styles.statusBadgeText,
                item.status === 'ACCEPTED' && { color: '#059669' },
                item.status === 'REJECTED' && { color: '#DC2626' },
              ]}>
                {item.status === 'ACCEPTED' ? t('Aceite') : t('Rejeitado')}
              </Text>
            </View>
          )}
        </View>

        {item.message && (
          <View style={styles.messageBox}>
            <Ionicons name="chatbubble-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.messageText} numberOfLines={3}>{item.message}</Text>
          </View>
        )}

        {isPending && (
          <View style={styles.actions}>
            {isProcessing ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <>
                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => handleReject(item)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={18} color={COLORS.error} />
                  <Text style={styles.rejectBtnText}>{t('Rejeitar')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={() => handleAccept(item)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="checkmark" size={18} color={COLORS.surface} />
                  <Text style={styles.acceptBtnText}>{t('Aceitar')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: t('Interesses recebidos'),
          headerBackTitle: t('Voltar'),
          headerTintColor: COLORS.primary,
          headerStyle: { backgroundColor: COLORS.surface },
        }}
      />
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={[...pendingInterests, ...resolvedInterests]}
            keyExtractor={(item) => item.id}
            renderItem={renderInterestCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
            }
            ListHeaderComponent={
              pendingInterests.length > 0 ? (
                <View style={styles.pendingBanner}>
                  <Ionicons name="notifications" size={18} color="#D97706" />
                  <Text style={styles.pendingBannerText}>
                    {pendingInterests.length} {pendingInterests.length === 1 ? t('interesse pendente') : t('interesses pendentes')}
                  </Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="hand-right-outline" size={64} color={COLORS.textLight} />
                <Text style={styles.emptyTitle}>{t('Sem interesses')}</Text>
                <Text style={styles.emptySubtitle}>
                  {t('Quando alguém mostrar interesse nos teus anúncios, aparece aqui.')}
                </Text>
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
  listContent: { padding: 16, gap: 12 },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 4,
  },
  pendingBannerText: { fontSize: 14, fontWeight: '600', color: '#D97706' },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardResolved: { opacity: 0.7 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center',
  },
  userName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  listingTitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  messageBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 12,
  },
  messageText: { flex: 1, fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  actions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  rejectBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.error },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  acceptBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.surface },
  emptyState: {
    justifyContent: 'center', alignItems: 'center',
    paddingTop: 80, gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 48 },
});
