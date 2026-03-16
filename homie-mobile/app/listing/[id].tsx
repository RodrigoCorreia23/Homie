import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { listingService } from '../../services/listing.service';
import { interestService } from '../../services/interest.service';
import { useListingStore } from '../../store/listingStore';
import { COLORS } from '../../utils/constants';
import type { Listing } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [interestMessage, setInterestMessage] = useState('');
  const [sendingInterest, setSendingInterest] = useState(false);
  const [interestSent, setInterestSent] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const { favorites, toggleFavorite } = useListingStore();

  const isFavorited = favorites.some((f) => f.listingId === id);

  useEffect(() => {
    if (id) {
      loadListing();
    }
  }, [id]);

  const loadListing = async () => {
    setIsLoading(true);
    try {
      const data = await listingService.getListingById(id!);
      setListing(data);
    } catch {
      // Failed to load listing
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = () => {
    if (id) toggleFavorite(id);
  };

  const handleSendInterest = async () => {
    if (!id) return;
    setSendingInterest(true);
    try {
      await interestService.sendInterest(
        id,
        interestMessage.trim() || undefined
      );
      setInterestSent(true);
      setShowInterestModal(false);
      setInterestMessage('');
    } catch {
      // Failed to send interest
    } finally {
      setSendingInterest(false);
    }
  };

  const formatPrice = (cents: number) => `${(cents / 100).toFixed(0)}`;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handlePhotoScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setActivePhotoIndex(index);
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: '',
            headerBackTitle: 'Back',
            headerTintColor: COLORS.primary,
            headerStyle: { backgroundColor: COLORS.surface },
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </>
    );
  }

  if (!listing) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: '',
            headerBackTitle: 'Back',
            headerTintColor: COLORS.primary,
            headerStyle: { backgroundColor: COLORS.surface },
          }}
        />
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.textLight} />
          <Text style={styles.errorText}>Listing not found</Text>
        </View>
      </>
    );
  }

  const photos = listing.photos || [];

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: '',
          headerBackTitle: 'Back',
          headerTintColor: COLORS.primary,
          headerStyle: { backgroundColor: COLORS.surface },
          headerRight: () => (
            <TouchableOpacity
              onPress={handleToggleFavorite}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={isFavorited ? 'heart' : 'heart-outline'}
                size={24}
                color={isFavorited ? COLORS.secondary : COLORS.text}
              />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo Carousel */}
        <View style={styles.carouselContainer}>
          {photos.length > 0 ? (
            <>
              <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handlePhotoScroll}
                scrollEventThrottle={16}
              >
                {photos.map((photo, index) => (
                  <Image
                    key={photo.id}
                    source={{ uri: photo.url }}
                    style={styles.carouselImage}
                  />
                ))}
              </ScrollView>
              {photos.length > 1 && (
                <View style={styles.paginationDots}>
                  {photos.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.dot,
                        index === activePhotoIndex && styles.dotActive,
                      ]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.carouselPlaceholder}>
              <Ionicons
                name="image-outline"
                size={48}
                color={COLORS.textLight}
              />
              <Text style={styles.carouselPlaceholderText}>No photos</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* Title & Price */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{listing.title}</Text>
            <Text style={styles.price}>
              EUR {formatPrice(listing.pricePerMonth)}
              <Text style={styles.priceUnit}>/month</Text>
            </Text>
          </View>

          {/* Location & Type */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons
                name="location-outline"
                size={16}
                color={COLORS.textSecondary}
              />
              <Text style={styles.metaText}>
                {listing.address}, {listing.city}
              </Text>
            </View>
          </View>

          {/* Compatibility */}
          {listing.compatibility != null && (
            <View style={styles.compatSection}>
              <View style={styles.compatBadge}>
                <Ionicons name="heart-circle" size={20} color={COLORS.success} />
                <Text style={styles.compatText}>
                  {listing.compatibility}% compatibility
                </Text>
              </View>
            </View>
          )}

          {/* Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Ionicons name="bed-outline" size={20} color={COLORS.primary} />
                <Text style={styles.detailValue}>
                  {listing.bedrooms}
                </Text>
                <Text style={styles.detailLabel}>Bedrooms</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="water-outline" size={20} color={COLORS.primary} />
                <Text style={styles.detailValue}>
                  {listing.bathrooms}
                </Text>
                <Text style={styles.detailLabel}>Bathrooms</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons
                  name={listing.furnished ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={listing.furnished ? COLORS.success : COLORS.textLight}
                />
                <Text style={styles.detailValue}>
                  {listing.furnished ? 'Yes' : 'No'}
                </Text>
                <Text style={styles.detailLabel}>Furnished</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons
                  name={
                    listing.billsIncluded
                      ? 'checkmark-circle'
                      : 'close-circle'
                  }
                  size={20}
                  color={
                    listing.billsIncluded ? COLORS.success : COLORS.textLight
                  }
                />
                <Text style={styles.detailValue}>
                  {listing.billsIncluded ? 'Yes' : 'No'}
                </Text>
                <Text style={styles.detailLabel}>Bills Incl.</Text>
              </View>
            </View>
          </View>

          {/* Available From */}
          <View style={styles.infoRow}>
            <Ionicons
              name="calendar-outline"
              size={18}
              color={COLORS.primary}
            />
            <Text style={styles.infoText}>
              Available from {formatDate(listing.availableFrom)}
            </Text>
          </View>

          {/* House Rules */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>House Rules</Text>
            <View style={styles.rulesContainer}>
              <View style={styles.ruleItem}>
                <Ionicons
                  name={listing.smokersAllowed ? 'checkmark' : 'close'}
                  size={18}
                  color={
                    listing.smokersAllowed ? COLORS.success : COLORS.error
                  }
                />
                <Text style={styles.ruleText}>
                  {listing.smokersAllowed
                    ? 'Smokers allowed'
                    : 'No smoking'}
                </Text>
              </View>
              <View style={styles.ruleItem}>
                <Ionicons
                  name={listing.petsAllowed ? 'checkmark' : 'close'}
                  size={18}
                  color={listing.petsAllowed ? COLORS.success : COLORS.error}
                />
                <Text style={styles.ruleText}>
                  {listing.petsAllowed ? 'Pets allowed' : 'No pets'}
                </Text>
              </View>
              {listing.preferredGender && listing.preferredGender !== 'ANY' && (
                <View style={styles.ruleItem}>
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color={COLORS.primary}
                  />
                  <Text style={styles.ruleText}>
                    Preferred: {listing.preferredGender.toLowerCase()}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Description */}
          {listing.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{listing.description}</Text>
            </View>
          )}

          {/* Owner */}
          {listing.owner && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Listed by</Text>
              <View style={styles.ownerCard}>
                <View style={styles.ownerAvatarContainer}>
                  {listing.owner.photos?.[0]?.url ? (
                    <Image
                      source={{ uri: listing.owner.photos[0].url }}
                      style={styles.ownerAvatar}
                    />
                  ) : (
                    <View style={styles.ownerAvatarPlaceholder}>
                      <Ionicons
                        name="person"
                        size={20}
                        color={COLORS.textLight}
                      />
                    </View>
                  )}
                </View>
                <Text style={styles.ownerName}>{listing.owner.name}</Text>
              </View>
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[
            styles.interestButton,
            interestSent && styles.interestButtonSent,
          ]}
          onPress={() => !interestSent && setShowInterestModal(true)}
          disabled={interestSent}
          activeOpacity={0.8}
        >
          <Ionicons
            name={interestSent ? 'checkmark-circle' : 'hand-right-outline'}
            size={20}
            color={COLORS.surface}
          />
          <Text style={styles.interestButtonText}>
            {interestSent ? 'Interest Sent' : 'Send Interest'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Interest Modal */}
      <Modal
        visible={showInterestModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInterestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Interest</Text>
              <TouchableOpacity
                onPress={() => setShowInterestModal(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Add an optional message to introduce yourself
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Hi! I'm interested in this listing..."
              placeholderTextColor={COLORS.textLight}
              value={interestMessage}
              onChangeText={setInterestMessage}
              multiline
              maxLength={500}
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[
                styles.modalButton,
                sendingInterest && styles.modalButtonDisabled,
              ]}
              onPress={handleSendInterest}
              disabled={sendingInterest}
              activeOpacity={0.8}
            >
              {sendingInterest ? (
                <ActivityIndicator color={COLORS.surface} />
              ) : (
                <Text style={styles.modalButtonText}>Send Interest</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  carouselContainer: {
    height: 280,
    backgroundColor: COLORS.border,
  },
  carouselImage: {
    width: SCREEN_WIDTH,
    height: 280,
    resizeMode: 'cover',
  },
  carouselPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    gap: 8,
  },
  carouselPlaceholderText: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  dotActive: {
    backgroundColor: COLORS.surface,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  titleSection: {
    gap: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  priceUnit: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.textSecondary,
  },
  metaRow: {
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  compatSection: {
    alignItems: 'flex-start',
  },
  compatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  compatText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.success,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    width: '46%',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primaryLight,
    padding: 14,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.primaryDark,
    fontWeight: '500',
  },
  rulesContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ruleText: {
    fontSize: 14,
    color: COLORS.text,
  },
  description: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  ownerAvatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  ownerAvatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  ownerAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  bottomSpacer: {
    height: 80,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  interestButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  interestButtonSent: {
    backgroundColor: COLORS.success,
  },
  interestButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  modalInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 100,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  modalButtonDisabled: {
    opacity: 0.7,
  },
  modalButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '700',
  },
});
