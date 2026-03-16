import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useListingStore } from '../../store/listingStore';
import { COLORS } from '../../utils/constants';
import type { Favorite } from '../../types';

export default function FavoritesScreen() {
  const { favorites, isLoading, fetchFavorites, toggleFavorite } =
    useListingStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFavorites();
    setRefreshing(false);
  }, [fetchFavorites]);

  const formatPrice = (cents: number) => `${(cents / 100).toFixed(0)}`;

  const handleRemoveFavorite = (listingId: string) => {
    toggleFavorite(listingId);
  };

  const renderFavoriteCard = ({ item }: { item: Favorite }) => {
    const listing = item.listing;
    if (!listing) return null;

    const photoUrl = listing.photos?.[0]?.url;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/listing/${listing.id}`)}
        activeOpacity={0.8}
      >
        <View style={styles.cardImageContainer}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.cardImage} />
          ) : (
            <View style={styles.cardImagePlaceholder}>
              <Ionicons name="home-outline" size={32} color={COLORS.textLight} />
            </View>
          )}
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {listing.title}
            </Text>
            <TouchableOpacity
              onPress={() => handleRemoveFavorite(listing.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="heart" size={22} color={COLORS.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.cardRow}>
            <Ionicons
              name="location-outline"
              size={14}
              color={COLORS.textSecondary}
            />
            <Text style={styles.cardCity}>{listing.city}</Text>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.cardPrice}>
              EUR {formatPrice(listing.pricePerMonth)}
              <Text style={styles.cardPriceUnit}>/month</Text>
            </Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{listing.type}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favorites</Text>
        <Text style={styles.headerSubtitle}>
          {favorites.length} saved listing{favorites.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={renderFavoriteCard}
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
              name="heart-outline"
              size={64}
              color={COLORS.textLight}
            />
            <Text style={styles.emptyTitle}>No saved listings yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the heart icon on a listing to save it here
            </Text>
          </View>
        }
      />
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
    paddingBottom: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardImageContainer: {
    width: 110,
    height: 120,
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
  cardContent: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
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
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  cardPriceUnit: {
    fontSize: 12,
    fontWeight: '400',
    color: COLORS.textSecondary,
  },
  typeBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
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
    textAlign: 'center',
    paddingHorizontal: 48,
  },
});
