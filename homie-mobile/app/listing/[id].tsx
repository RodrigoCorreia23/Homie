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
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from 'react-native';
import { listingService } from '../../services/listing.service';
import { interestService } from '../../services/interest.service';
import { useListingStore } from '../../store/listingStore';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../utils/constants';
import { useT } from '../../utils/i18n';
import type { Listing } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ListingDetailScreen() {
  const t = useT();
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
  const { user } = useAuthStore();

  const isFavorited = favorites.some((f) => f.listingId === id);
  const isOwner = listing?.ownerId === user?.id;

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

  const handleToggleStatus = () => {
    if (!listing) return;
    const newStatus = listing.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    const label = newStatus === 'ACTIVE' ? t('ativar') : t('pausar');
    Alert.alert(`${label.charAt(0).toUpperCase() + label.slice(1)} ${t('anúncio')}`, `${t('Queres')} ${label} ${t('este anúncio?')}`, [
      { text: t('Cancelar'), style: 'cancel' },
      {
        text: t('Confirmar'),
        onPress: async () => {
          try {
            const updated = await listingService.updateStatus(id!, newStatus);
            setListing(updated);
          } catch { /* ignore */ }
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert(t('Apagar anúncio'), t('Esta ação é irreversível. Tens a certeza?'), [
      { text: t('Cancelar'), style: 'cancel' },
      {
        text: t('Apagar'),
        style: 'destructive',
        onPress: async () => {
          try {
            await listingService.deleteListing(id!);
            router.back();
          } catch { /* ignore */ }
        },
      },
    ]);
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
    return date.toLocaleDateString('pt-PT', {
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
            headerBackTitle: t('Voltar'),
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
            headerBackTitle: t('Voltar'),
            headerTintColor: COLORS.primary,
            headerStyle: { backgroundColor: COLORS.surface },
          }}
        />
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.textLight} />
          <Text style={styles.errorText}>{t('Anúncio não encontrado')}</Text>
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
          headerBackTitle: t('Voltar'),
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
              <Text style={styles.carouselPlaceholderText}>{t('Sem fotos')}</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* Title & Price */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{listing.title}</Text>
            <Text style={styles.price}>
              EUR {formatPrice(listing.pricePerMonth)}
              <Text style={styles.priceUnit}>{t('/mês')}</Text>
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
                  {listing.compatibility}% {t('compatibilidade')}
                </Text>
              </View>
            </View>
          )}

          {/* Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('Detalhes')}</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Ionicons name="bed-outline" size={20} color={COLORS.primary} />
                <Text style={styles.detailValue}>
                  {listing.bedrooms}
                </Text>
                <Text style={styles.detailLabel}>{t('Quartos')}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="water-outline" size={20} color={COLORS.primary} />
                <Text style={styles.detailValue}>
                  {listing.bathrooms}
                </Text>
                <Text style={styles.detailLabel}>{t('Casas de banho')}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons
                  name={listing.furnished ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={listing.furnished ? COLORS.success : COLORS.textLight}
                />
                <Text style={styles.detailValue}>
                  {listing.furnished ? t('Sim') : t('Não')}
                </Text>
                <Text style={styles.detailLabel}>{t('Mobilado')}</Text>
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
                  {listing.billsIncluded ? t('Sim') : t('Não')}
                </Text>
                <Text style={styles.detailLabel}>{t('Contas incl.')}</Text>
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
              {t('Disponível a partir de')} {formatDate(listing.availableFrom)}
            </Text>
          </View>

          {/* House Rules */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('Regras da casa')}</Text>
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
                    ? t('Permitido fumar')
                    : t('Proibido fumar')}
                </Text>
              </View>
              <View style={styles.ruleItem}>
                <Ionicons
                  name={listing.petsAllowed ? 'checkmark' : 'close'}
                  size={18}
                  color={listing.petsAllowed ? COLORS.success : COLORS.error}
                />
                <Text style={styles.ruleText}>
                  {listing.petsAllowed ? t('Animais permitidos') : t('Sem animais')}
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
                    {t('Preferência:')} {listing.preferredGender === 'MALE' ? t('masculino') : t('feminino')}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Description */}
          {listing.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('Descrição')}</Text>
              <Text style={styles.description}>{listing.description}</Text>
            </View>
          )}

          {/* Owner */}
          {listing.owner && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('Publicado por')}</Text>
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
        {isOwner ? (
          <View style={styles.ownerActions}>
            <TouchableOpacity
              style={[styles.ownerBtn, styles.ownerBtnPause]}
              onPress={handleToggleStatus}
              activeOpacity={0.7}
            >
              <Ionicons
                name={listing.status === 'ACTIVE' ? 'pause-circle-outline' : 'play-circle-outline'}
                size={20}
                color={listing.status === 'ACTIVE' ? '#D97706' : COLORS.success}
              />
              <Text style={[styles.ownerBtnText, { color: listing.status === 'ACTIVE' ? '#D97706' : COLORS.success }]}>
                {listing.status === 'ACTIVE' ? t('Pausar') : t('Ativar')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ownerBtn, styles.ownerBtnDelete]}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={20} color={COLORS.error} />
              <Text style={[styles.ownerBtnText, { color: COLORS.error }]}>{t('Apagar')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.interestButton, interestSent && styles.interestButtonSent]}
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
              {interestSent ? t('Interesse enviado') : t('Enviar interesse')}
            </Text>
          </TouchableOpacity>
        )}
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
              <Text style={styles.modalTitle}>{t('Enviar interesse')}</Text>
              <TouchableOpacity
                onPress={() => setShowInterestModal(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              {t('Adiciona uma mensagem opcional para te apresentares')}
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder={t("Olá! Estou interessado neste anúncio...")}
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
                <Text style={styles.modalButtonText}>{t('Enviar interesse')}</Text>
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
  ownerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  ownerBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  ownerBtnPause: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
  },
  ownerBtnDelete: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  ownerBtnText: {
    fontSize: 15,
    fontWeight: '700',
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
