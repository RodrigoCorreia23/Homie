import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useListingStore } from '../../store/listingStore';
import { useLanguageStore } from '../../store/languageStore';
import { listingService } from '../../services/listing.service';
import { userService } from '../../services/user.service';
import PhotoGrid from '../../components/PhotoGrid';
import { useT } from '../../utils/i18n';
import { COLORS } from '../../utils/constants';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { myListings, fetchMyListings } = useListingStore();
  const { lang, toggleLang } = useLanguageStore();
  const t = useT();

  const [boostModalVisible, setBoostModalVisible] = useState(false);
  const [boostListingId, setBoostListingId] = useState<string | null>(null);
  const [boostTiers, setBoostTiers] = useState<any[]>([]);
  const [boostLoading, setBoostLoading] = useState(false);

  useEffect(() => {
    fetchMyListings();
  }, []);

  const openBoostModal = async (listingId: string) => {
    setBoostListingId(listingId);
    setBoostModalVisible(true);
    try {
      const tiers = await listingService.getBoostTiers();
      setBoostTiers(tiers);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os planos.');
    }
  };

  const handleBoost = async (tier: string) => {
    if (!boostListingId) return;
    setBoostLoading(true);
    try {
      const { paymentIntentId } = await listingService.createBoost(boostListingId, tier);
      // In production, this would open Stripe's payment sheet
      // For now, confirm directly (works with Stripe test mode)
      await listingService.confirmBoost(boostListingId, paymentIntentId);
      Alert.alert('Destaque ativado!', 'O teu anúncio vai aparecer no topo dos resultados.');
      setBoostModalVisible(false);
      fetchMyListings();
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message || 'Falha no pagamento.');
    } finally {
      setBoostLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  const formatBudget = (cents?: number) => {
    if (!cents) return '--';
    return `EUR ${(cents / 100).toFixed(0)}`;
  };

  const getScheduleLabel = (schedule?: string) => {
    if (schedule === 'DAY') return 'Diurno';
    if (schedule === 'NIGHT') return 'Noturno';
    return '--';
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'SEEKER':
        return { label: 'Procura casa', color: COLORS.primary };
      case 'LANDLORD':
        return { label: 'Proprietário', color: COLORS.success };
      case 'BOTH':
        return { label: 'Ambos', color: COLORS.warning };
      default:
        return { label: 'User', color: COLORS.textSecondary };
    }
  };

  const roleBadge = getRoleBadge(user?.role);

  const renderHabitRow = (
    icon: keyof typeof Ionicons.glyphMap,
    label: string,
    value: string
  ) => (
    <View style={styles.habitRow}>
      <Ionicons name={icon} size={18} color={COLORS.primary} />
      <Text style={styles.habitLabel}>{label}</Text>
      <Text style={styles.habitValue}>{value}</Text>
    </View>
  );

  const primaryPhoto = user?.photos?.[0]?.url;

  const handleAddUserPhoto = async (url: string, position: number) => {
    await userService.addPhoto(url, position);
    // Refresh profile to get updated photos
    const updatedUser = await userService.getProfile();
    useAuthStore.setState({ user: updatedUser });
  };

  const handleRemoveUserPhoto = async (photoId: string) => {
    await userService.deletePhoto(photoId);
    const updatedUser = await userService.getProfile();
    useAuthStore.setState({ user: updatedUser });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {primaryPhoto ? (
              <Image source={{ uri: primaryPhoto }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color={COLORS.textLight} />
              </View>
            )}
          </View>

          <Text style={styles.name}>{user?.name || 'User'}</Text>
          {user?.city && (
            <View style={styles.locationRow}>
              <Ionicons
                name="location-outline"
                size={14}
                color={COLORS.textSecondary}
              />
              <Text style={styles.city}>{user.city}</Text>
            </View>
          )}
          <View
            style={[styles.roleBadge, { backgroundColor: roleBadge.color }]}
          >
            <Text style={styles.roleBadgeText}>{roleBadge.label}</Text>
          </View>
        </View>
      </View>

      {/* Quick actions */}
      <View style={styles.quickActionsRow}>
        {(user?.role === 'LANDLORD' || user?.role === 'BOTH') && (
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => router.push('/interests' as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="hand-right-outline" size={22} color={COLORS.primary} />
            <Text style={styles.quickActionText}>{t('Interesses')}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.quickActionBtn}
          onPress={() => router.push('/notifications' as any)}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={22} color={COLORS.primary} />
          <Text style={styles.quickActionText}>{t('Notificações')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('As minhas fotos')}</Text>
        <PhotoGrid
          photos={(user?.photos || []).map((p) => ({ id: p.id, url: p.url, position: p.position }))}
          maxPhotos={6}
          folder="users"
          onPhotoAdded={handleAddUserPhoto}
          onPhotoRemoved={handleRemoveUserPhoto}
        />
      </View>

      {user?.habits && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hábitos</Text>
          <View style={styles.habitsCard}>
            {renderHabitRow('sunny-outline', 'Horário', getScheduleLabel(user.habits.schedule))}
            {renderHabitRow('bonfire-outline', 'Fumador', user.habits.smoker ? 'Sim' : 'Não')}
            {renderHabitRow('paw-outline', 'Animais', user.habits.pets ? 'Sim' : 'Não')}
            {renderHabitRow('sparkles-outline', 'Limpeza', `${user.habits.cleanliness}/5`)}
            {renderHabitRow('volume-medium-outline', 'Barulho', `${user.habits.noise}/5`)}
            {renderHabitRow('people-outline', 'Visitas', `${user.habits.visitors}/5`)}
            {renderHabitRow('wallet-outline', 'Orçamento', `${formatBudget(user.habits.budgetMin)} - ${formatBudget(user.habits.budgetMax)}`)}
          </View>
        </View>
      )}

      {(user?.role === 'LANDLORD' || user?.role === 'BOTH') && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Os meus anúncios</Text>
            <TouchableOpacity
              style={styles.createListingBtn}
              onPress={() => router.push('/listing/create')}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={18} color={COLORS.surface} />
              <Text style={styles.createListingBtnText}>Criar</Text>
            </TouchableOpacity>
          </View>

          {myListings.length > 0 ? (
            <View style={styles.myListingsContainer}>
              {myListings.map((listing) => (
                <TouchableOpacity
                  key={listing.id}
                  style={styles.myListingCard}
                  onPress={() => router.push(`/listing/${listing.id}`)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="home-outline" size={20} color={COLORS.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.myListingTitle} numberOfLines={1}>{listing.title}</Text>
                    <Text style={styles.myListingCity}>{listing.city} · EUR {((listing.pricePerMonth || 0) / 100).toFixed(0)}/mês</Text>
                  </View>
                  <View style={styles.listingActions}>
                    {listing.status === 'ACTIVE' && (
                      listing.boostedUntil && new Date(listing.boostedUntil) > new Date() ? (
                        <View style={styles.boostedBadge}>
                          <Ionicons name="flash" size={12} color="#F59E0B" />
                          <Text style={styles.boostedBadgeText}>Destaque</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.boostBtn}
                          onPress={(e) => {
                            e.stopPropagation?.();
                            openBoostModal(listing.id);
                          }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="flash-outline" size={14} color="#F59E0B" />
                          <Text style={styles.boostBtnText}>Boost</Text>
                        </TouchableOpacity>
                      )
                    )}
                    <View style={[
                      styles.statusBadge,
                      listing.status === 'ACTIVE' && { backgroundColor: '#D1FAE5' },
                      listing.status === 'PAUSED' && { backgroundColor: '#FEF3C7' },
                      listing.status === 'RENTED' && { backgroundColor: '#DBEAFE' },
                    ]}>
                      <Text style={[
                        styles.statusBadgeText,
                        listing.status === 'ACTIVE' && { color: '#059669' },
                        listing.status === 'PAUSED' && { color: '#D97706' },
                        listing.status === 'RENTED' && { color: '#2563EB' },
                      ]}>
                        {listing.status === 'ACTIVE' ? 'Ativo' : listing.status === 'PAUSED' ? 'Pausado' : listing.status === 'RENTED' ? 'Arrendado' : listing.status}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <TouchableOpacity
              style={styles.emptyListingsCard}
              onPress={() => router.push('/listing/create')}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={32} color={COLORS.primary} />
              <Text style={styles.emptyListingsText}>Cria o teu primeiro anúncio</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('Definições')}</Text>
        <View style={styles.settingsCard}>
          <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7}>
            <Ionicons name="create-outline" size={20} color={COLORS.primary} />
            <Text style={styles.settingsRowText}>{t('Editar perfil')}</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
          <View style={styles.settingsDivider} />
          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() => router.push('/auth/onboarding')}
            activeOpacity={0.7}
          >
            <Ionicons name="options-outline" size={20} color={COLORS.primary} />
            <Text style={styles.settingsRowText}>{t('Editar hábitos')}</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
          <View style={styles.settingsDivider} />
          <TouchableOpacity
            style={styles.settingsRow}
            onPress={toggleLang}
            activeOpacity={0.7}
          >
            <Ionicons name="language-outline" size={20} color={COLORS.primary} />
            <Text style={styles.settingsRowText}>{t('Idioma')}</Text>
            <View style={styles.langToggle}>
              <Text style={[styles.langOption, lang === 'pt' && styles.langOptionActive]}>PT</Text>
              <Text style={[styles.langOption, lang === 'en' && styles.langOptionActive]}>EN</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
        <Text style={styles.logoutText}>{t('Terminar sessão')}</Text>
      </TouchableOpacity>

      <View style={styles.bottomSpacer} />

      {/* Boost Modal */}
      <Modal
        visible={boostModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBoostModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Destacar anúncio</Text>
              <TouchableOpacity onPress={() => setBoostModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDesc}>
              O teu anúncio aparece no topo dos resultados durante o período escolhido.
            </Text>

            {boostTiers.map((tier) => (
              <TouchableOpacity
                key={tier.id}
                style={styles.tierCard}
                onPress={() => handleBoost(tier.id)}
                disabled={boostLoading}
                activeOpacity={0.7}
              >
                <View style={styles.tierInfo}>
                  <Ionicons name="flash" size={20} color="#F59E0B" />
                  <View>
                    <Text style={styles.tierDays}>{tier.label}</Text>
                    <Text style={styles.tierDesc}>Destaque por {tier.days} dias</Text>
                  </View>
                </View>
                <Text style={styles.tierPrice}>{tier.priceFormatted}</Text>
              </TouchableOpacity>
            ))}

            {boostLoading && (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.modalLoadingText}>A processar pagamento...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    backgroundColor: COLORS.surface,
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  city: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  roleBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 4,
  },
  roleBadgeText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '700',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 4,
  },
  habitsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  habitLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  habitValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createListingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createListingBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.surface,
  },
  myListingsContainer: {
    gap: 8,
  },
  myListingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  myListingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  myListingCity: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyListingsCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 32,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  emptyListingsText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  listingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  boostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  boostBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  boostedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  boostedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  tierCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tierDays: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  tierDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  tierPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  modalLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
  },
  modalLoadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  settingsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  settingsRowText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  settingsDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 48,
  },
  langToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  langOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  langOptionActive: {
    backgroundColor: COLORS.primary,
    color: COLORS.surface,
    overflow: 'hidden',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.error,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
  },
  bottomSpacer: {
    height: 24,
  },
});
