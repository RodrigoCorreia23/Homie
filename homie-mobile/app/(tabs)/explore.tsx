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
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useListingStore } from '../../store/listingStore';
import { COLORS } from '../../utils/constants';
import type { Listing } from '../../types';

const LISTING_TYPES = ['All', 'ROOM', 'APARTMENT', 'COLIVING'] as const;

export default function ExploreScreen() {
  const { listings, isLoading, fetchListings, filters, setFilters } =
    useListingStore();
  const [city, setCity] = useState(filters.city || '');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchListings();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchListings();
    setRefreshing(false);
  }, [fetchListings]);

  const handleSearch = () => {
    const newFilters: Record<string, any> = {};
    if (city.trim()) newFilters.city = city.trim();
    if (selectedType !== 'All') newFilters.type = selectedType;
    setFilters(newFilters);
    fetchListings(newFilters);
  };

  const formatPrice = (cents: number) => {
    return `${(cents / 100).toFixed(0)}`;
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'ROOM':
        return COLORS.primary;
      case 'APARTMENT':
        return COLORS.success;
      case 'COLIVING':
        return COLORS.warning;
      default:
        return COLORS.textSecondary;
    }
  };

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
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: getTypeBadgeColor(item.type) },
              ]}
            >
              <Text style={styles.typeBadgeText}>{item.type}</Text>
            </View>
            {item.compatibility != null && (
              <View style={styles.compatBadge}>
                <Text style={styles.compatBadgeText}>
                  {item.compatibility}% match
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.cardRow}>
            <Ionicons
              name="location-outline"
              size={14}
              color={COLORS.textSecondary}
            />
            <Text style={styles.cardCity}>{item.city}</Text>
          </View>
          <Text style={styles.cardPrice}>
            EUR {formatPrice(item.pricePerMonth)}
            <Text style={styles.cardPriceUnit}>/month</Text>
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
      </View>

      <View style={styles.filterBar}>
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={18} color={COLORS.textLight} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by city..."
              placeholderTextColor={COLORS.textLight}
              value={city}
              onChangeText={setCity}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearch}
            activeOpacity={0.8}
          >
            <Ionicons name="options-outline" size={20} color={COLORS.surface} />
          </TouchableOpacity>
        </View>

        <View style={styles.typeFilter}>
          {LISTING_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeChip,
                selectedType === type && styles.typeChipActive,
              ]}
              onPress={() => {
                setSelectedType(type);
                const newFilters: Record<string, any> = {};
                if (city.trim()) newFilters.city = city.trim();
                if (type !== 'All') newFilters.type = type;
                setFilters(newFilters);
                fetchListings(newFilters);
              }}
            >
              <Text
                style={[
                  styles.typeChipText,
                  selectedType === type && styles.typeChipTextActive,
                ]}
              >
                {type === 'All' ? 'All' : type.charAt(0) + type.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

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
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons
                name="search-outline"
                size={64}
                color={COLORS.textLight}
              />
              <Text style={styles.emptyTitle}>No listings found</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your filters
              </Text>
            </View>
          }
        />
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
  listContent: {
    padding: 16,
    gap: 16,
  },
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
