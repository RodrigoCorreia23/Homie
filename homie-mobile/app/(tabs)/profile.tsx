import { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useListingStore } from '../../store/listingStore';
import { COLORS } from '../../utils/constants';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { myListings, fetchMyListings } = useListingStore();

  useEffect(() => {
    fetchMyListings();
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  const formatBudget = (cents?: number) => {
    if (!cents) return '--';
    return `EUR ${(cents / 100).toFixed(0)}`;
  };

  const getScheduleLabel = (schedule?: string) => {
    if (schedule === 'DAY') return 'Day Person';
    if (schedule === 'NIGHT') return 'Night Owl';
    return '--';
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'SEEKER':
        return { label: 'Seeker', color: COLORS.primary };
      case 'LANDLORD':
        return { label: 'Landlord', color: COLORS.success };
      case 'BOTH':
        return { label: 'Both', color: COLORS.warning };
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

      {user?.habits && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Habits</Text>
          <View style={styles.habitsCard}>
            {renderHabitRow(
              'sunny-outline',
              'Schedule',
              getScheduleLabel(user.habits.schedule)
            )}
            {renderHabitRow(
              'bonfire-outline',
              'Smoker',
              user.habits.smoker ? 'Yes' : 'No'
            )}
            {renderHabitRow(
              'paw-outline',
              'Pets',
              user.habits.pets ? 'Yes' : 'No'
            )}
            {renderHabitRow(
              'sparkles-outline',
              'Cleanliness',
              `${user.habits.cleanliness}/5`
            )}
            {renderHabitRow(
              'volume-medium-outline',
              'Noise',
              `${user.habits.noise}/5`
            )}
            {renderHabitRow(
              'people-outline',
              'Visitors',
              `${user.habits.visitors}/5`
            )}
            {renderHabitRow(
              'wallet-outline',
              'Budget',
              `${formatBudget(user.habits.budgetMin)} - ${formatBudget(user.habits.budgetMax)}`
            )}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Listings</Text>
        <TouchableOpacity style={styles.infoCard} activeOpacity={0.7}>
          <Ionicons name="home-outline" size={22} color={COLORS.primary} />
          <Text style={styles.infoCardText}>
            {myListings.length} listing{myListings.length !== 1 ? 's' : ''}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={COLORS.textLight}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.settingsCard}>
          <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7}>
            <Ionicons
              name="create-outline"
              size={20}
              color={COLORS.primary}
            />
            <Text style={styles.settingsRowText}>Edit Profile</Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={COLORS.textLight}
            />
          </TouchableOpacity>

          <View style={styles.settingsDivider} />

          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() => router.push('/auth/onboarding')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={COLORS.primary}
            />
            <Text style={styles.settingsRowText}>Edit Habits</Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={COLORS.textLight}
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <View style={styles.bottomSpacer} />
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  infoCardText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
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
