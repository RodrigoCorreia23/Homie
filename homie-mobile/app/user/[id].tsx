import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { userService } from '../../services/user.service';
import { COLORS } from '../../utils/constants';
import { useT } from '../../utils/i18n';
import type { User } from '../../types';

export default function UserProfileScreen() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) loadProfile();
  }, [id]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const data = await userService.getPublicProfile(id!);
      setProfile(data);
    } catch {
      // Failed
    } finally {
      setIsLoading(false);
    }
  };

  const getGenderLabel = (g?: string) => {
    switch (g) {
      case 'MALE': return t('Masculino');
      case 'FEMALE': return t('Feminino');
      case 'OTHER': return t('Outro');
      default: return null;
    }
  };

  const getScheduleLabel = (s?: string) =>
    s === 'DAY' ? t('Diurno') : s === 'NIGHT' ? t('Noturno') : '--';

  const formatBudget = (cents?: number) =>
    cents ? `EUR ${(cents / 100).toFixed(0)}` : '--';

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, headerTitle: '', headerBackTitle: t('Voltar'), headerTintColor: COLORS.primary, headerStyle: { backgroundColor: COLORS.surface } }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, headerTitle: '', headerBackTitle: t('Voltar'), headerTintColor: COLORS.primary, headerStyle: { backgroundColor: COLORS.surface } }} />
        <View style={styles.loadingContainer}>
          <Ionicons name="person-outline" size={48} color={COLORS.textLight} />
          <Text style={styles.errorText}>{t('Perfil não encontrado')}</Text>
        </View>
      </>
    );
  }

  const habits = profile.habits;
  const photos = profile.photos || [];
  const primaryPhoto = photos[0]?.url;
  const genderLabel = getGenderLabel(profile.gender);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: profile.name,
          headerBackTitle: t('Voltar'),
          headerTintColor: COLORS.primary,
          headerStyle: { backgroundColor: COLORS.surface },
        }}
      />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {primaryPhoto ? (
              <Image source={{ uri: primaryPhoto }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={48} color={COLORS.textLight} />
              </View>
            )}
          </View>
          <Text style={styles.name}>{profile.name}</Text>
          {genderLabel && <Text style={styles.detail}>{genderLabel}</Text>}
          {profile.city && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.locationText}>{profile.city}</Text>
            </View>
          )}
          {(profile as any).preferredCity && (
            <View style={styles.locationRow}>
              <Ionicons name="search" size={14} color={COLORS.primary} />
              <Text style={styles.preferredText}>{t('Procura em')} {(profile as any).preferredCity}</Text>
            </View>
          )}
        </View>

        {/* Photos */}
        {photos.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('Fotos')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photosScroll}>
              {photos.map((photo) => (
                <Image key={photo.id} source={{ uri: photo.url }} style={styles.photoThumb} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Bio */}
        {profile.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('Sobre')}</Text>
            <Text style={styles.bio}>{profile.bio}</Text>
          </View>
        )}

        {/* Habits */}
        {habits && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('Hábitos')}</Text>
            <View style={styles.habitsCard}>
              {renderHabit('sunny-outline', t('Horário'), getScheduleLabel(habits.schedule))}
              {renderHabit('bonfire-outline', t('Fumador'), habits.smoker ? t('Sim') : t('Não'))}
              {renderHabit('paw-outline', t('Animais'), habits.pets ? t('Sim') : t('Não'))}
              {renderHabit('sparkles-outline', t('Limpeza'), `${habits.cleanliness}/5`)}
              {renderHabit('volume-medium-outline', t('Barulho'), `${habits.noise}/5`)}
              {renderHabit('people-outline', t('Visitas'), `${habits.visitors}/5`)}
              {renderHabit('wallet-outline', t('Orçamento'), `${formatBudget(habits.budgetMin)} - ${formatBudget(habits.budgetMax)}`)}
            </View>
          </View>
        )}

        {/* Tags summary */}
        {habits && (
          <View style={styles.section}>
            <View style={styles.tagsContainer}>
              <View style={styles.tag}>
                <Ionicons name={habits.schedule === 'DAY' ? 'sunny-outline' : 'moon-outline'} size={14} color={COLORS.primary} />
                <Text style={styles.tagText}>{getScheduleLabel(habits.schedule)}</Text>
              </View>
              {habits.smoker ? (
                <View style={[styles.tag, styles.tagWarning]}>
                  <Text style={styles.tagWarningText}>{t('Fumador')}</Text>
                </View>
              ) : (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{t('Não fuma')}</Text>
                </View>
              )}
              {habits.pets && (
                <View style={styles.tag}>
                  <Ionicons name="paw-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.tagText}>{t('Tem animais')}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </>
  );
}

function renderHabit(icon: keyof typeof Ionicons.glyphMap, label: string, value: string) {
  return (
    <View style={styles.habitRow}>
      <Ionicons name={icon} size={18} color={COLORS.primary} />
      <Text style={styles.habitLabel}>{label}</Text>
      <Text style={styles.habitValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, gap: 12 },
  errorText: { fontSize: 16, color: COLORS.textSecondary },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 6,
  },
  avatarContainer: { width: 100, height: 100, borderRadius: 50, overflow: 'hidden', marginBottom: 8 },
  avatar: { width: '100%', height: '100%', resizeMode: 'cover' },
  avatarPlaceholder: { width: '100%', height: '100%', backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  detail: { fontSize: 14, color: COLORS.textSecondary },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 14, color: COLORS.textSecondary },
  preferredText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  section: { paddingHorizontal: 20, marginTop: 20, gap: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginLeft: 4 },
  photosScroll: { gap: 8 },
  photoThumb: { width: 100, height: 100, borderRadius: 12 },
  bio: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 22 },
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
  habitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  habitLabel: { flex: 1, fontSize: 14, color: COLORS.textSecondary },
  habitValue: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  tagText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  tagWarning: { backgroundColor: '#FEF3C7' },
  tagWarningText: { fontSize: 13, fontWeight: '600', color: '#D97706' },
});
