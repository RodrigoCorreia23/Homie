import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';
import { listingService } from '../../services/listing.service';
import type { Listing } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Default center (Lisboa)
const DEFAULT_LAT = 38.7223;
const DEFAULT_LNG = -9.1393;
const DEFAULT_RADIUS = 20;

export default function MapScreen() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    setIsLoading(true);
    try {
      const data = await listingService.getListingsForMap(
        DEFAULT_LAT,
        DEFAULT_LNG,
        DEFAULT_RADIUS
      );
      setListings(data);
    } catch {
      // Failed to load listings
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (cents: number) => `${(cents / 100).toFixed(0)}`;

  const renderMapContent = () => {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.webPlaceholder}>
          <Ionicons name="map-outline" size={64} color={COLORS.textLight} />
          <Text style={styles.webPlaceholderTitle}>Map View</Text>
          <Text style={styles.webPlaceholderText}>
            Map is available on mobile devices.
          </Text>
          <Text style={styles.webPlaceholderText}>
            {listings.length} listings in this area.
          </Text>
        </View>
      );
    }

    // Native map using react-native-maps
    let MapView: any;
    let Marker: any;
    try {
      const Maps = require('react-native-maps');
      MapView = Maps.default;
      Marker = Maps.Marker;
    } catch {
      return (
        <View style={styles.webPlaceholder}>
          <Ionicons name="map-outline" size={64} color={COLORS.textLight} />
          <Text style={styles.webPlaceholderTitle}>Map Unavailable</Text>
          <Text style={styles.webPlaceholderText}>
            react-native-maps is not configured.
          </Text>
        </View>
      );
    }

    return (
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: DEFAULT_LAT,
          longitude: DEFAULT_LNG,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        onPress={() => setSelectedListing(null)}
      >
        {listings.map((listing) => (
          <Marker
            key={listing.id}
            coordinate={{
              latitude: listing.latitude,
              longitude: listing.longitude,
            }}
            onPress={() => setSelectedListing(listing)}
          />
        ))}
      </MapView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Map</Text>
        <Text style={styles.headerSubtitle}>
          {listings.length} listing{listings.length !== 1 ? 's' : ''} nearby
        </Text>
      </View>

      <View style={styles.mapContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          renderMapContent()
        )}
      </View>

      {selectedListing && (
        <TouchableOpacity
          style={styles.bottomSheet}
          onPress={() => router.push(`/listing/${selectedListing.id}`)}
          activeOpacity={0.9}
        >
          <View style={styles.bottomSheetHandle} />
          <View style={styles.bottomSheetContent}>
            <View style={styles.bottomSheetImageContainer}>
              {selectedListing.photos?.[0]?.url ? (
                <Image
                  source={{ uri: selectedListing.photos[0].url }}
                  style={styles.bottomSheetImage}
                />
              ) : (
                <View style={styles.bottomSheetImagePlaceholder}>
                  <Ionicons
                    name="home-outline"
                    size={24}
                    color={COLORS.textLight}
                  />
                </View>
              )}
            </View>
            <View style={styles.bottomSheetInfo}>
              <Text style={styles.bottomSheetTitle} numberOfLines={1}>
                {selectedListing.title}
              </Text>
              <View style={styles.bottomSheetRow}>
                <Ionicons
                  name="location-outline"
                  size={14}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.bottomSheetCity}>
                  {selectedListing.city}
                </Text>
              </View>
              <Text style={styles.bottomSheetPrice}>
                EUR {formatPrice(selectedListing.pricePerMonth)}/mo
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={COLORS.textLight}
            />
          </View>
        </TouchableOpacity>
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
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.background,
  },
  webPlaceholderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  webPlaceholderText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  bottomSheetContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  bottomSheetImageContainer: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
  },
  bottomSheetImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bottomSheetImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSheetInfo: {
    flex: 1,
    gap: 4,
  },
  bottomSheetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  bottomSheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bottomSheetCity: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  bottomSheetPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
