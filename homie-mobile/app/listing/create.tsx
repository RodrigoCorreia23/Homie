import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { listingService } from '../../services/listing.service';
import { uploadImage } from '../../services/upload.service';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../utils/constants';
import { useT } from '../../utils/i18n';
import * as ImagePicker from 'expo-image-picker';

type ListingType = 'ROOM' | 'APARTMENT' | 'COLIVING';
type Gender = 'MALE' | 'FEMALE' | 'ANY';

const STEPS = ['basics', 'photos', 'location', 'details', 'rules', 'price'] as const;

export default function CreateListingScreen() {
  const t = useT();
  const { user } = useAuthStore();
  const houseRules = user?.houseRules;

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Basics
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ListingType | null>(null);

  // Step 2: Photos
  const [pendingPhotos, setPendingPhotos] = useState<string[]>([]); // base64 URIs
  const [photoUploading, setPhotoUploading] = useState(false);

  // Step 2: Location
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');

  // Step 3: Details
  const [bedrooms, setBedrooms] = useState('1');
  const [bathrooms, setBathrooms] = useState('1');
  const [furnished, setFurnished] = useState(false);
  const [billsIncluded, setBillsIncluded] = useState(false);
  const [availableFrom, setAvailableFrom] = useState('');

  // Step 4: Rules (pre-fill from house rules)
  const [smokersAllowed, setSmokersAllowed] = useState(
    houseRules?.smokingPolicy === 'ALLOWED' || houseRules?.smokingPolicy === 'OUTSIDE_ONLY'
  );
  const [petsAllowed, setPetsAllowed] = useState(
    houseRules?.petsPolicy === 'ALLOWED' || houseRules?.petsPolicy === 'SMALL_ONLY'
  );
  const [preferredGender, setPreferredGender] = useState<Gender>(
    houseRules?.preferredGender || 'ANY'
  );

  // Step 5: Price
  const [price, setPrice] = useState('');

  const totalSteps = STEPS.length;
  const currentStep = STEPS[step];

  const validate = (): boolean => {
    setError('');
    switch (currentStep) {
      case 'basics':
        if (!title.trim()) { setError(t('Introduz um título.')); return false; }
        if (!description.trim()) { setError(t('Introduz uma descrição.')); return false; }
        if (!type) { setError(t('Seleciona o tipo de propriedade.')); return false; }
        return true;
      case 'photos':
        return true;
      case 'location':
        if (!address.trim()) { setError(t('Introduz a morada.')); return false; }
        if (!city.trim()) { setError(t('Introduz a cidade.')); return false; }
        return true;
      case 'details':
        if (!bedrooms || parseInt(bedrooms) < 0) { setError(t('Quartos inválidos.')); return false; }
        if (!bathrooms || parseInt(bathrooms) < 0) { setError(t('Casas de banho inválidas.')); return false; }
        if (!availableFrom.trim()) { setError(t('Introduz a data de disponibilidade.')); return false; }
        return true;
      case 'rules':
        return true;
      case 'price':
        if (!price.trim() || parseFloat(price) <= 0) { setError(t('Introduz um preço válido.')); return false; }
        return true;
    }
  };

  const handleNext = () => {
    if (!validate()) return;
    if (step < totalSteps - 1) setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    if (step > 0) setStep(step - 1);
    else router.back();
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setLoading(true);
    setError('');

    try {
      // Geocode city for coordinates (with timeout fallback)
      let lat = 0;
      let lng = 0;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const geocodeRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address + ', ' + city)}&format=json&limit=1`,
          { headers: { 'User-Agent': 'Homie-App/1.0' }, signal: controller.signal }
        );
        clearTimeout(timeout);
        const geocodeData = await geocodeRes.json() as Array<{ lat: string; lon: string }>;
        if (geocodeData.length > 0) {
          lat = parseFloat(geocodeData[0].lat);
          lng = parseFloat(geocodeData[0].lon);
        }
      } catch {
        // Geocoding failed, use 0,0 — backend will still accept it
      }

      const priceCents = Math.round(parseFloat(price) * 100);

      const listing = await listingService.createListing({
        title: title.trim(),
        description: description.trim(),
        type: type!,
        pricePerMonth: priceCents,
        latitude: lat,
        longitude: lng,
        address: address.trim(),
        city: city.trim(),
        bedrooms: parseInt(bedrooms),
        bathrooms: parseInt(bathrooms),
        furnished,
        billsIncluded,
        availableFrom: new Date(availableFrom || new Date().toISOString().split('T')[0]).toISOString(),
        smokersAllowed,
        petsAllowed,
        preferredGender: preferredGender !== 'ANY' ? preferredGender : undefined,
      } as any);

      // Upload photos to Cloudinary and attach to listing
      for (let i = 0; i < pendingPhotos.length; i++) {
        try {
          const { url } = await uploadImage(pendingPhotos[i], 'listings');
          await listingService.addPhoto(listing.id, url, i);
        } catch {
          // Continue with remaining photos
        }
      }

      router.back();
    } catch (err: any) {
      setError(err?.response?.data?.message || t('Erro ao criar anúncio.'));
    } finally {
      setLoading(false);
    }
  };

  // ─── Shared components ─────────────────────────────────

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${((step + 1) / totalSteps) * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>{t('Passo')} {step + 1} {t('de')} {totalSteps}</Text>
    </View>
  );

  const renderError = () =>
    error ? (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    ) : null;

  const renderTypeCard = (value: ListingType, icon: keyof typeof Ionicons.glyphMap, label: string, desc: string) => {
    const active = type === value;
    return (
      <TouchableOpacity
        style={[styles.typeCard, active && styles.typeCardActive]}
        onPress={() => { setType(value); setError(''); }}
        activeOpacity={0.7}
      >
        <View style={[styles.typeIconWrap, active && styles.typeIconWrapActive]}>
          <Ionicons name={icon} size={24} color={active ? COLORS.surface : COLORS.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.typeCardTitle, active && styles.typeCardTitleActive]}>{label}</Text>
          <Text style={[styles.typeCardDesc, active && styles.typeCardDescActive]}>{desc}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderToggle = (label: string, value: boolean, onToggle: () => void, icon: keyof typeof Ionicons.glyphMap) => (
    <TouchableOpacity
      style={[styles.toggleRow, value && styles.toggleRowActive]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={20} color={value ? COLORS.primary : COLORS.textSecondary} />
      <Text style={[styles.toggleLabel, value && styles.toggleLabelActive]}>{label}</Text>
      <View style={[styles.toggleSwitch, value && styles.toggleSwitchActive]}>
        <View style={[styles.toggleDot, value && styles.toggleDotActive]} />
      </View>
    </TouchableOpacity>
  );

  const renderInput = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    placeholder: string,
    options?: { multiline?: boolean; keyboard?: 'default' | 'numeric' | 'numbers-and-punctuation'; maxLength?: number }
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, options?.multiline && styles.inputMultiline]}
        value={value}
        onChangeText={(t) => { onChange(t); setError(''); }}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textLight}
        multiline={options?.multiline}
        keyboardType={options?.keyboard || 'default'}
        maxLength={options?.maxLength}
      />
    </View>
  );

  const renderCounter = (label: string, value: string, onChange: (v: string) => void) => {
    const num = parseInt(value) || 0;
    return (
      <View style={styles.counterRow}>
        <Text style={styles.counterLabel}>{label}</Text>
        <View style={styles.counterControls}>
          <TouchableOpacity
            style={styles.counterBtn}
            onPress={() => onChange(Math.max(0, num - 1).toString())}
          >
            <Ionicons name="remove" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.counterValue}>{num}</Text>
          <TouchableOpacity
            style={styles.counterBtn}
            onPress={() => onChange((num + 1).toString())}
          >
            <Ionicons name="add" size={20} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ─── Steps ─────────────────────────────────────────────

  const renderBasics = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('Informações básicas')}</Text>
      <Text style={styles.stepDesc}>{t('Descreve a tua propriedade.')}</Text>
      {renderError()}
      {renderInput(t('Título'), title, setTitle, t('ex: Quarto luminoso no centro do Porto'), { maxLength: 200 })}
      {renderInput(t('Descrição'), description, setDescription, t('Descreve o espaço, o bairro, transportes próximos...'), { multiline: true, maxLength: 2000 })}
      <Text style={styles.sectionLabel}>{t('Tipo de propriedade')}</Text>
      <View style={styles.typeCards}>
        {renderTypeCard('ROOM', 'bed-outline', t('Quarto'), t('Quarto num apartamento partilhado'))}
        {renderTypeCard('APARTMENT', 'home-outline', t('Apartamento'), t('Apartamento inteiro'))}
        {renderTypeCard('COLIVING', 'people-outline', 'Coliving', t('Espaço de coliving'))}
      </View>
    </View>
  );

  const renderLocation = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('Localização')}</Text>
      <Text style={styles.stepDesc}>{t('Onde fica a tua propriedade?')}</Text>
      {renderError()}
      {renderInput(t('Morada'), address, setAddress, t('ex: Rua de Santa Catarina, 123'))}
      {renderInput(t('Cidade'), city, setCity, t('ex: Porto'))}
    </View>
  );

  const renderDetails = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('Detalhes')}</Text>
      <Text style={styles.stepDesc}>{t('Características do espaço.')}</Text>
      {renderError()}
      {renderCounter(t('Quartos'), bedrooms, setBedrooms)}
      {renderCounter(t('Casas de banho'), bathrooms, setBathrooms)}
      <View style={styles.togglesSection}>
        {renderToggle(t('Mobilado'), furnished, () => setFurnished(!furnished), 'cube-outline')}
        {renderToggle(t('Contas incluídas'), billsIncluded, () => setBillsIncluded(!billsIncluded), 'receipt-outline')}
      </View>
      {renderInput(t('Disponível a partir de'), availableFrom, setAvailableFrom, 'AAAA-MM-DD', { keyboard: 'numbers-and-punctuation' })}
    </View>
  );

  const renderRules = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('Regras da casa')}</Text>
      <Text style={styles.stepDesc}>
        {houseRules ? t('Pré-preenchido com as tuas preferências.') : t('Define as regras para esta propriedade.')}
      </Text>
      {renderError()}
      <View style={styles.togglesSection}>
        {renderToggle(t('Permitido fumar'), smokersAllowed, () => setSmokersAllowed(!smokersAllowed), 'bonfire-outline')}
        {renderToggle(t('Permitido animais'), petsAllowed, () => setPetsAllowed(!petsAllowed), 'paw-outline')}
      </View>
      <Text style={styles.sectionLabel}>{t('Preferência de género')}</Text>
      <View style={styles.genderRow}>
        {(['ANY', 'MALE', 'FEMALE'] as Gender[]).map((g) => {
          const active = preferredGender === g;
          const labels: Record<Gender, string> = { ANY: t('Indiferente'), MALE: t('Masculino'), FEMALE: t('Feminino') };
          return (
            <TouchableOpacity
              key={g}
              style={[styles.genderChip, active && styles.genderChipActive]}
              onPress={() => setPreferredGender(g)}
            >
              <Text style={[styles.genderChipText, active && styles.genderChipTextActive]}>{labels[g]}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderPrice = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('Preço')}</Text>
      <Text style={styles.stepDesc}>{t('Quanto custa a renda mensal?')}</Text>
      {renderError()}
      <View style={styles.priceInputWrapper}>
        <Text style={styles.priceCurrency}>EUR</Text>
        <TextInput
          style={styles.priceInput}
          value={price}
          onChangeText={(t) => { setPrice(t); setError(''); }}
          placeholder="450"
          placeholderTextColor={COLORS.textLight}
          keyboardType="numeric"
        />
        <Text style={styles.priceUnit}>{t('/mês')}</Text>
      </View>
      {price && parseFloat(price) > 0 && (
        <View style={styles.priceSummary}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.priceSummaryText}>
            {t('Os inquilinos pagam')} EUR {parseFloat(price).toFixed(2)} · {t('Homie retém')} 2% (EUR {(parseFloat(price) * 0.02).toFixed(2)}) · {t('Recebes')} EUR {(parseFloat(price) * 0.98).toFixed(2)}
          </Text>
        </View>
      )}
    </View>
  );

  const addPhoto = async () => {
    if (pendingPhotos.length >= 10) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setError(t('Precisamos de acesso à galeria.'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setPendingPhotos([...pendingPhotos, `data:image/jpeg;base64,${result.assets[0].base64}`]);
    }
  };

  const removePhoto = (index: number) => {
    setPendingPhotos(pendingPhotos.filter((_, i) => i !== index));
  };

  const renderPhotos = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('Fotos')}</Text>
      <Text style={styles.stepDesc}>{t('Adiciona até 10 fotos da propriedade. A primeira será a foto principal.')}</Text>
      {renderError()}
      <View style={styles.photoGrid}>
        {pendingPhotos.map((uri, i) => (
          <View key={i} style={[styles.photoCell, i === 0 && styles.photoCellMain]}>
            <Image source={{ uri }} style={styles.photoCellImage} />
            <TouchableOpacity style={styles.photoRemoveBtn} onPress={() => removePhoto(i)}>
              <Ionicons name="close-circle" size={24} color="#EF4444" />
            </TouchableOpacity>
            {i === 0 && (
              <View style={styles.photoMainBadge}>
                <Text style={styles.photoMainBadgeText}>{t('Principal')}</Text>
              </View>
            )}
          </View>
        ))}
        {pendingPhotos.length < 10 && (
          <TouchableOpacity
            style={[styles.photoAddCell, pendingPhotos.length === 0 && styles.photoCellMain]}
            onPress={addPhoto}
            activeOpacity={0.7}
          >
            <Ionicons name="camera-outline" size={28} color={COLORS.primary} />
            <Text style={styles.photoAddText}>{t('Adicionar')}</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.photoHint}>{pendingPhotos.length}/10 {t('fotos')}</Text>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'basics': return renderBasics();
      case 'photos': return renderPhotos();
      case 'location': return renderLocation();
      case 'details': return renderDetails();
      case 'rules': return renderRules();
      case 'price': return renderPrice();
    }
  };

  const isLast = step === totalSteps - 1;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('Novo anúncio')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {renderProgressBar()}

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {renderCurrentStep()}
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 ? (
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
            <Text style={styles.backButtonText}>{t('Voltar')}</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}

        {!isLast ? (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.8}>
            <Text style={styles.nextButtonText}>{t('Seguinte')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextButton, styles.createButton, loading && styles.buttonDisabled]}
            onPress={handleCreate}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.surface} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.surface} />
                <Text style={styles.nextButtonText}>{t('Publicar')}</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
  },
  progressTrack: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 32,
  },
  stepContent: {
    gap: 18,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  stepDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginTop: -8,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
  },
  // Input
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 4,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  // Type cards
  typeCards: {
    gap: 10,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  typeCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  typeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeIconWrapActive: {
    backgroundColor: COLORS.primary,
  },
  typeCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  typeCardTitleActive: {
    color: COLORS.primaryDark,
  },
  typeCardDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  typeCardDescActive: {
    color: COLORS.primaryDark,
  },
  // Counter
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  counterLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  counterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    minWidth: 24,
    textAlign: 'center',
  },
  // Toggles
  togglesSection: {
    gap: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toggleRowActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  toggleLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  toggleLabelActive: {
    color: COLORS.primaryDark,
  },
  toggleSwitch: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleSwitchActive: {
    backgroundColor: COLORS.primary,
    alignItems: 'flex-end',
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
  },
  toggleDotActive: {
    backgroundColor: COLORS.surface,
  },
  // Gender
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  genderChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  genderChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  genderChipTextActive: {
    color: COLORS.surface,
  },
  // Price
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.primary,
    overflow: 'hidden',
  },
  priceCurrency: {
    paddingLeft: 16,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  priceInput: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 18,
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  priceUnit: {
    paddingRight: 16,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  priceSummary: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  priceSummaryText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  // Photos
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoCell: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoCellMain: {
    width: '48%',
    aspectRatio: 4 / 3,
  },
  photoCellImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
  },
  photoMainBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  photoMainBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  photoAddCell: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    gap: 4,
  },
  photoAddText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  photoHint: {
    fontSize: 12,
    color: COLORS.textLight,
    marginLeft: 4,
  },
  // Error
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: 'center',
  },
  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.surface,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
