import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useListingStore } from '../../store/listingStore';
import { useAuthStore } from '../../store/authStore';
import { userService } from '../../services/user.service';
import { listingService } from '../../services/listing.service';
import { COLORS } from '../../utils/constants';
import { useT } from '../../utils/i18n';
import type { Listing, SeekerProfile } from '../../types';

const LISTING_TYPES = ['Todos', 'ROOM', 'APARTMENT', 'COLIVING'] as const;

type ViewMode = 'listings' | 'seekers';

export default function ExploreScreen() {
  const t = useT();
  const { user } = useAuthStore();
  const { listings, isLoading, fetchListings, setFilters } = useListingStore();

  // Determine default view based on role
  const defaultView: ViewMode =
    user?.role === 'LANDLORD' ? 'seekers' : 'listings';
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView);

  // Listings state
  const [city, setCity] = useState(user?.preferredCity || '');
  const [selectedType, setSelectedType] = useState<string>('Todos');
  const [radius, setRadius] = useState(50); // default 50km
  const [showRadiusFilter, setShowRadiusFilter] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Seekers state
  const [seekers, setSeekers] = useState<SeekerProfile[]>([]);
  const [seekersLoading, setSeekerLoading] = useState(false);
  const [seekerRadius, setSeekerRadius] = useState(50);
  const [showSeekerRadiusFilter, setShowSeekerRadiusFilter] = useState(false);
  // Landlord's listings for location selector
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);

  useEffect(() => {
    if (viewMode === 'listings') {
      fetchListings({ radius });
    } else {
      loadMyListings();
    }
  }, [viewMode]);

  const loadMyListings = async () => {
    try {
      const data = await listingService.getMyListings();
      setMyListings(data);
      // Auto-select first listing
      if (data.length > 0 && !selectedListingId) {
        setSelectedListingId(data[0].id);
        loadSeekers({ lat: data[0].latitude, lng: data[0].longitude });
      } else {
        loadSeekers();
      }
    } catch {
      loadSeekers();
    }
  };

  const loadSeekers = async (opts?: { lat?: number; lng?: number; radius?: number }) => {
    setSeekerLoading(true);
    try {
      const params: any = {
        radius: opts?.radius ?? seekerRadius,
      };
      if (opts?.lat !== undefined && opts?.lng !== undefined) {
        params.lat = opts.lat;
        params.lng = opts.lng;
      }
      const result = await userService.discoverSeekers(params);
      setSeekers(result.seekers);
    } catch {
      // ignore
    } finally {
      setSeekerLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (viewMode === 'listings') {
      await fetchListings();
    } else {
      const selected = myListings.find((l) => l.id === selectedListingId);
      if (selected) {
        await loadSeekers({ lat: selected.latitude, lng: selected.longitude });
      } else {
        await loadSeekers();
      }
    }
    setRefreshing(false);
  }, [viewMode, fetchListings, selectedListingId, myListings]);

  const handleListingSearch = () => {
    const newFilters: Record<string, any> = { radius };
    if (city.trim()) newFilters.city = city.trim();
    if (selectedType !== 'Todos') newFilters.type = selectedType;
    setFilters(newFilters);
    fetchListings(newFilters);
  };

  const handleSelectListing = (listing: Listing) => {
    setSelectedListingId(listing.id);
    loadSeekers({ lat: listing.latitude, lng: listing.longitude, radius: seekerRadius });
  };

  const formatPrice = (cents: number) => `${(cents / 100).toFixed(0)}`;

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'ROOM': return COLORS.primary;
      case 'APARTMENT': return COLORS.success;
      case 'COLIVING': return COLORS.warning;
      default: return COLORS.textSecondary;
    }
  };

  const getGenderLabel = (g?: string) => {
    switch (g) {
      case 'MALE': return t('Masculino');
      case 'FEMALE': return t('Feminino');
      case 'OTHER': return t('Outro');
      default: return '';
    }
  };

  const getScheduleLabel = (s?: string) => {
    switch (s) {
      case 'DAY': return t('Diurno');
      case 'NIGHT': return t('Noturno');
      default: return '';
    }
  };

  // ─── View mode toggle (for BOTH role) ──────────────────
  const renderViewToggle = () => {
    if (user?.role !== 'BOTH') return null;
    return (
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.viewToggleBtn, viewMode === 'listings' && styles.viewToggleBtnActive]}
          onPress={() => setViewMode('listings')}
        >
          <Ionicons
            name="home-outline"
            size={16}
            color={viewMode === 'listings' ? COLORS.surface : COLORS.textSecondary}
          />
          <Text style={[styles.viewToggleText, viewMode === 'listings' && styles.viewToggleTextActive]}>
            {t('Casas')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewToggleBtn, viewMode === 'seekers' && styles.viewToggleBtnActive]}
          onPress={() => setViewMode('seekers')}
        >
          <Ionicons
            name="people-outline"
            size={16}
            color={viewMode === 'seekers' ? COLORS.surface : COLORS.textSecondary}
          />
          <Text style={[styles.viewToggleText, viewMode === 'seekers' && styles.viewToggleTextActive]}>
            {t('Inquilinos')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ─── Listing card ──────────────────────────────────────
  const renderListingCard = ({ item }: { item: Listing }) => {
    const photoUrl = item.photos?.[0]?.url;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/listing/${item.id}`)}
        activeOpacity={0.8}
      >
        <View style={styles.cardImageContainer}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.cardImage} />
          ) : (
            <View style={styles.cardImagePlaceholder}>
              <Ionicons name="home-outline" size={40} color={COLORS.textLight} />
            </View>
          )}
          <View style={styles.cardBadgeRow}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <View style={[styles.typeBadge, { backgroundColor: getTypeBadgeColor(item.type) }]}>
                <Text style={styles.typeBadgeText}>{item.type}</Text>
              </View>
              {item.boostedUntil && new Date(item.boostedUntil) > new Date() && (
                <View style={styles.boostBadge}>
                  <Ionicons name="flash" size={10} color="#F59E0B" />
                  <Text style={styles.boostBadgeText}>DESTAQUE</Text>
                </View>
              )}
            </View>
            {item.compatibility != null && (
              <View style={styles.compatBadge}>
                <Text style={styles.compatBadgeText}>{item.compatibility}% match</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <View style={styles.cardRow}>
            <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.cardCity}>
              {item.city}
              {item.distance != null && (
                <Text style={styles.cardDistance}> · {item.distance < 1 ? `${(item.distance * 1000).toFixed(0)}m` : `${item.distance.toFixed(1)}km`}</Text>
              )}
            </Text>
          </View>
          <Text style={styles.cardPrice}>
            EUR {formatPrice(item.pricePerMonth)}
            <Text style={styles.cardPriceUnit}>{t('/mês')}</Text>
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // ─── Seeker card ───────────────────────────────────────
  const renderSeekerCard = ({ item }: { item: SeekerProfile }) => {
    const photoUrl = item.photos?.[0]?.url;
    const habits = item.habits;

    return (
      <TouchableOpacity
        style={styles.seekerCard}
        onPress={() => router.push(`/user/${item.id}` as any)}
        activeOpacity={0.8}
      >
        <View style={styles.seekerHeader}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.seekerAvatar} />
          ) : (
            <View style={styles.seekerAvatarPlaceholder}>
              <Ionicons name="person" size={28} color={COLORS.textLight} />
            </View>
          )}
          <View style={styles.seekerInfo}>
            <Text style={styles.seekerName}>{item.name}</Text>
            {item.gender && (
              <Text style={styles.seekerDetail}>{getGenderLabel(item.gender)}</Text>
            )}
            {item.preferredCity && (
              <View style={styles.seekerLocationRow}>
                <Ionicons name="location-outline" size={13} color={COLORS.primary} />
                <Text style={styles.seekerLocation}>
                  {t('Procura em')} {item.preferredCity}
                  {item.distance != null && ` · ${item.distance.toFixed(1)}km`}
                </Text>
              </View>
            )}
          </View>
        </View>

        {habits && (
          <View style={styles.seekerTags}>
            <View style={styles.tag}>
              <Ionicons name={habits.schedule === 'DAY' ? 'sunny-outline' : 'moon-outline'} size={12} color={COLORS.primary} />
              <Text style={styles.tagText}>{getScheduleLabel(habits.schedule)}</Text>
            </View>
            {habits.smoker && (
              <View style={[styles.tag, styles.tagWarning]}>
                <Text style={styles.tagTextWarning}>{t('Fumador')}</Text>
              </View>
            )}
            {!habits.smoker && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{t('Não fuma')}</Text>
              </View>
            )}
            {habits.pets && (
              <View style={styles.tag}>
                <Ionicons name="paw-outline" size={12} color={COLORS.primary} />
                <Text style={styles.tagText}>{t('Tem animais')}</Text>
              </View>
            )}
            <View style={styles.tag}>
              <Text style={styles.tagText}>{t('Limpeza')} {habits.cleanliness}/5</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{t('Barulho')} {habits.noise}/5</Text>
            </View>
            {habits.budgetMax ? (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{t('Até')} {((habits.budgetMax || 0) / 100).toFixed(0)}€</Text>
              </View>
            ) : null}
          </View>
        )}

        {item.bio ? (
          <Text style={styles.seekerBio} numberOfLines={2}>{item.bio}</Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  const RADIUS_OPTIONS = [5, 10, 15, 25, 50] as const;

  // ─── Listing filter bar ────────────────────────────────
  const renderListingFilters = () => (
    <View style={styles.filterBar}>
      <View style={styles.searchRow}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={18} color={COLORS.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder={t("Pesquisar por cidade...")}
            placeholderTextColor={COLORS.textLight}
            value={city}
            onChangeText={setCity}
            onSubmitEditing={handleListingSearch}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity
          style={[styles.searchButton, showRadiusFilter && { backgroundColor: COLORS.primaryDark }]}
          onPress={() => setShowRadiusFilter(!showRadiusFilter)}
          activeOpacity={0.8}
        >
          <Ionicons name="options-outline" size={20} color={COLORS.surface} />
        </TouchableOpacity>
      </View>

      {showRadiusFilter && (
        <View style={styles.radiusSection}>
          <Text style={styles.radiusLabel}>
            {t('Raio:')} <Text style={styles.radiusValue}>{radius} km</Text>
          </Text>
          <View style={styles.radiusOptions}>
            {RADIUS_OPTIONS.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.radiusChip, radius === r && styles.radiusChipActive]}
                onPress={() => {
                  setRadius(r);
                  const newFilters: Record<string, any> = { radius: r };
                  if (city.trim()) newFilters.city = city.trim();
                  if (selectedType !== 'Todos') newFilters.type = selectedType;
                  setFilters(newFilters);
                  fetchListings(newFilters);
                }}
              >
                <Text style={[styles.radiusChipText, radius === r && styles.radiusChipTextActive]}>
                  {r} km
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.typeFilter}>
        {LISTING_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.typeChip, selectedType === type && styles.typeChipActive]}
            onPress={() => {
              setSelectedType(type);
              const newFilters: Record<string, any> = { radius };
              if (city.trim()) newFilters.city = city.trim();
              if (type !== 'Todos') newFilters.type = type;
              setFilters(newFilters);
              fetchListings(newFilters);
            }}
          >
            <Text style={[styles.typeChipText, selectedType === type && styles.typeChipTextActive]}>
              {type === 'Todos' ? t('Todos') : type.charAt(0) + type.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const SEEKER_RADIUS_OPTIONS = [5, 10, 15, 25, 50] as const;

  // ─── Seeker filter bar ─────────────────────────────────
  const renderSeekerFilters = () => (
    <View style={styles.filterBar}>
      {myListings.length > 0 && (
        <View style={styles.listingSelectorSection}>
          <Text style={styles.listingSelectorLabel}>
            <Ionicons name="home-outline" size={14} color={COLORS.text} /> {t('Mostrar inquilinos perto de:')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.listingSelectorScroll}>
            {myListings.map((listing) => {
              const isSelected = selectedListingId === listing.id;
              return (
                <TouchableOpacity
                  key={listing.id}
                  style={[styles.listingChip, isSelected && styles.listingChipActive]}
                  onPress={() => handleSelectListing(listing)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="location"
                    size={14}
                    color={isSelected ? COLORS.surface : COLORS.primary}
                  />
                  <Text
                    style={[styles.listingChipText, isSelected && styles.listingChipTextActive]}
                    numberOfLines={1}
                  >
                    {listing.title}
                  </Text>
                  <Text
                    style={[styles.listingChipCity, isSelected && styles.listingChipCityActive]}
                  >
                    {listing.city}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {myListings.length === 0 && !seekersLoading && (
        <View style={styles.noListingsHint}>
          <Ionicons name="information-circle-outline" size={18} color={COLORS.textSecondary} />
          <Text style={styles.noListingsHintText}>
            {t('Cria um anúncio para ver inquilinos perto da tua propriedade.')}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.radiusToggleBtn, showSeekerRadiusFilter && styles.radiusToggleBtnActive]}
        onPress={() => setShowSeekerRadiusFilter(!showSeekerRadiusFilter)}
        activeOpacity={0.7}
      >
        <Ionicons name="options-outline" size={16} color={showSeekerRadiusFilter ? COLORS.surface : COLORS.primary} />
        <Text style={[styles.radiusToggleText, showSeekerRadiusFilter && styles.radiusToggleTextActive]}>
          {t('Raio:')} {seekerRadius} km
        </Text>
      </TouchableOpacity>

      {showSeekerRadiusFilter && (
        <View style={styles.radiusSection}>
          <View style={styles.radiusOptions}>
            {SEEKER_RADIUS_OPTIONS.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.radiusChip, seekerRadius === r && styles.radiusChipActive]}
                onPress={() => {
                  setSeekerRadius(r);
                  const selected = myListings.find((l) => l.id === selectedListingId);
                  if (selected) {
                    loadSeekers({ lat: selected.latitude, lng: selected.longitude, radius: r });
                  } else {
                    loadSeekers({ radius: r });
                  }
                }}
              >
                <Text style={[styles.radiusChipText, seekerRadius === r && styles.radiusChipTextActive]}>
                  {r} km
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  const renderSkeleton = () => (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonContent}>
        <View style={styles.skeletonLine} />
        <View style={styles.skeletonLineShort} />
        <View style={styles.skeletonLinePrice} />
      </View>
    </View>
  );

  const renderEmpty = (message: string, subtitle: string) => (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={64} color={COLORS.textLight} />
      <Text style={styles.emptyTitle}>{message}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {viewMode === 'listings' ? t('Explorar') : t('Inquilinos')}
        </Text>
      </View>

      {renderViewToggle()}

      {viewMode === 'listings' ? (
        <>
          {renderListingFilters()}
          {isLoading && listings.length === 0 ? (
            <View style={styles.skeletonContainer}>
              {renderSkeleton()}
              {renderSkeleton()}
              {renderSkeleton()}
            </View>
          ) : (
            <FlatList
              data={listings}
              keyExtractor={(item) => item.id}
              renderItem={renderListingCard}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
              }
              ListEmptyComponent={renderEmpty(t('Sem resultados'), t('Tenta ajustar os filtros'))}
            />
          )}
        </>
      ) : (
        <>
          {renderSeekerFilters()}
          {seekersLoading && seekers.length === 0 ? (
            <View style={styles.skeletonContainer}>
              {renderSkeleton()}
              {renderSkeleton()}
            </View>
          ) : (
            <FlatList
              data={seekers}
              keyExtractor={(item) => item.id}
              renderItem={renderSeekerCard}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
              }
              ListEmptyComponent={renderEmpty(
                t('Sem inquilinos encontrados'),
                t('Ainda não há pessoas à procura nesta zona')
              )}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  // View toggle (BOTH role)
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 8,
  },
  viewToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  viewToggleBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  viewToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  viewToggleTextActive: {
    color: COLORS.surface,
  },
  // Filter bar
  filterBar: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  searchButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Radius filter
  radiusSection: {
    gap: 8,
  },
  radiusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  radiusValue: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  radiusOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  radiusChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  radiusChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  radiusChipTextActive: {
    color: COLORS.surface,
  },
  typeFilter: {
    flexDirection: 'row',
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  typeChipTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  // List
  listContent: {
    padding: 16,
    gap: 16,
  },
  // Listing card
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImageContainer: {
    height: 180,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBadgeRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    color: COLORS.surface,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  boostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  boostBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  compatBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  compatBadgeText: {
    color: COLORS.surface,
    fontSize: 11,
    fontWeight: '700',
  },
  cardContent: {
    padding: 16,
    gap: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardCity: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  cardDistance: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 2,
  },
  cardPriceUnit: {
    fontSize: 13,
    fontWeight: '400',
    color: COLORS.textSecondary,
  },
  // Seeker card
  seekerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    gap: 14,
  },
  seekerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  seekerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  seekerAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seekerInfo: {
    flex: 1,
    gap: 2,
  },
  seekerName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  seekerDetail: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  seekerLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  seekerLocation: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  seekerTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  tagWarning: {
    backgroundColor: '#FEF3C7',
  },
  tagTextWarning: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  seekerBio: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  // Listing selector (landlord)
  listingSelectorSection: {
    gap: 8,
  },
  listingSelectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  listingSelectorScroll: {
    gap: 8,
    paddingBottom: 2,
  },
  listingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.background,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    maxWidth: 220,
  },
  listingChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  listingChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    flexShrink: 1,
  },
  listingChipTextActive: {
    color: COLORS.surface,
  },
  listingChipCity: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  listingChipCityActive: {
    color: COLORS.surface,
    opacity: 0.8,
  },
  noListingsHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.background,
    padding: 14,
    borderRadius: 12,
  },
  noListingsHintText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  radiusToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  radiusToggleBtnActive: {
    backgroundColor: COLORS.primary,
  },
  radiusToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  radiusToggleTextActive: {
    color: COLORS.surface,
  },
  // Skeleton
  skeletonContainer: {
    padding: 16,
    gap: 16,
  },
  skeletonCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  skeletonImage: {
    height: 180,
    backgroundColor: COLORS.border,
  },
  skeletonContent: {
    padding: 16,
    gap: 10,
  },
  skeletonLine: {
    height: 16,
    backgroundColor: COLORS.border,
    borderRadius: 8,
    width: '70%',
  },
  skeletonLineShort: {
    height: 12,
    backgroundColor: COLORS.border,
    borderRadius: 6,
    width: '40%',
  },
  skeletonLinePrice: {
    height: 20,
    backgroundColor: COLORS.border,
    borderRadius: 10,
    width: '30%',
  },
  // Empty
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
