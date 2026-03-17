import { useEffect, useState } from 'react';
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
} from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { listingService } from '../../services/listing.service';
import { useT } from '../../utils/i18n';
import { COLORS } from '../../utils/constants';

type ListingType = 'ROOM' | 'APARTMENT' | 'COLIVING';
type Gender = 'MALE' | 'FEMALE' | 'ANY';

export default function EditListingScreen() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ListingType>('ROOM');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [bedrooms, setBedrooms] = useState('1');
  const [bathrooms, setBathrooms] = useState('1');
  const [furnished, setFurnished] = useState(false);
  const [billsIncluded, setBillsIncluded] = useState(false);
  const [smokersAllowed, setSmokersAllowed] = useState(false);
  const [petsAllowed, setPetsAllowed] = useState(false);
  const [preferredGender, setPreferredGender] = useState<Gender>('ANY');
  const [price, setPrice] = useState('');

  useEffect(() => {
    if (id) loadListing();
  }, [id]);

  const loadListing = async () => {
    try {
      const listing = await listingService.getListingById(id!);
      setTitle(listing.title);
      setDescription(listing.description);
      setType(listing.type as ListingType);
      setAddress(listing.address);
      setCity(listing.city);
      setBedrooms(listing.bedrooms.toString());
      setBathrooms(listing.bathrooms.toString());
      setFurnished(listing.furnished);
      setBillsIncluded(listing.billsIncluded);
      setSmokersAllowed(listing.smokersAllowed);
      setPetsAllowed(listing.petsAllowed);
      setPreferredGender((listing.preferredGender as Gender) || 'ANY');
      setPrice((listing.pricePerMonth / 100).toString());
    } catch {
      setError(t('Anúncio não encontrado'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError('');
    if (!title.trim()) { setError(t('Introduz um título.')); return; }
    if (!price.trim() || parseFloat(price) <= 0) { setError(t('Introduz um preço válido.')); return; }

    setSaving(true);
    try {
      await listingService.updateListing(id!, {
        title: title.trim(),
        description: description.trim(),
        type,
        address: address.trim(),
        city: city.trim(),
        bedrooms: parseInt(bedrooms),
        bathrooms: parseInt(bathrooms),
        furnished,
        billsIncluded,
        smokersAllowed,
        petsAllowed,
        preferredGender: preferredGender !== 'ANY' ? preferredGender : undefined,
        pricePerMonth: Math.round(parseFloat(price) * 100),
      } as any);
      router.back();
    } catch (err: any) {
      setError(err?.response?.data?.message || t('Erro ao guardar anúncio.'));
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (label: string, value: string, onChange: (v: string) => void, placeholder: string, options?: { multiline?: boolean; keyboard?: any }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, options?.multiline && styles.inputMultiline]}
        value={value}
        onChangeText={(v) => { onChange(v); setError(''); }}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textLight}
        multiline={options?.multiline}
        keyboardType={options?.keyboard}
      />
    </View>
  );

  const renderToggle = (label: string, value: boolean, onToggle: () => void) => (
    <TouchableOpacity
      style={[styles.toggleRow, value && styles.toggleRowActive]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <Text style={[styles.toggleLabel, value && styles.toggleLabelActive]}>{label}</Text>
      <View style={[styles.toggleSwitch, value && styles.toggleSwitchActive]}>
        <View style={styles.toggleDot} />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, headerTitle: t('Editar anúncio'), headerBackTitle: t('Voltar'), headerTintColor: COLORS.primary, headerStyle: { backgroundColor: COLORS.surface } }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: t('Editar anúncio'),
          headerBackTitle: t('Voltar'),
          headerTintColor: COLORS.primary,
          headerStyle: { backgroundColor: COLORS.surface },
        }}
      />
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {renderInput(t('Título'), title, setTitle, '')}
          {renderInput(t('Descrição'), description, setDescription, '', { multiline: true })}

          <Text style={styles.sectionLabel}>{t('Tipo de propriedade')}</Text>
          <View style={styles.typeRow}>
            {(['ROOM', 'APARTMENT', 'COLIVING'] as ListingType[]).map((t_) => (
              <TouchableOpacity
                key={t_}
                style={[styles.typeChip, type === t_ && styles.typeChipActive]}
                onPress={() => setType(t_)}
              >
                <Text style={[styles.typeChipText, type === t_ && styles.typeChipTextActive]}>
                  {t_ === 'ROOM' ? t('Quarto') : t_ === 'APARTMENT' ? t('Apartamento') : 'Coliving'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {renderInput(t('Morada'), address, setAddress, '')}
          {renderInput(t('Cidade'), city, setCity, '')}
          {renderInput(t('Quartos'), bedrooms, setBedrooms, '', { keyboard: 'numeric' })}
          {renderInput(t('Casas de banho'), bathrooms, setBathrooms, '', { keyboard: 'numeric' })}

          <View style={styles.togglesSection}>
            {renderToggle(t('Mobilado'), furnished, () => setFurnished(!furnished))}
            {renderToggle(t('Contas incluídas'), billsIncluded, () => setBillsIncluded(!billsIncluded))}
            {renderToggle(t('Permitido fumar'), smokersAllowed, () => setSmokersAllowed(!smokersAllowed))}
            {renderToggle(t('Permitido animais'), petsAllowed, () => setPetsAllowed(!petsAllowed))}
          </View>

          <Text style={styles.sectionLabel}>{t('Preferência de género')}</Text>
          <View style={styles.typeRow}>
            {(['ANY', 'MALE', 'FEMALE'] as Gender[]).map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.typeChip, preferredGender === g && styles.typeChipActive]}
                onPress={() => setPreferredGender(g)}
              >
                <Text style={[styles.typeChipText, preferredGender === g && styles.typeChipTextActive]}>
                  {g === 'ANY' ? t('Indiferente') : g === 'MALE' ? t('Masculino') : t('Feminino')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('Preço')} (EUR/{t('/mês')})</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={(v) => { setPrice(v); setError(''); }}
              keyboardType="numeric"
              placeholder="450"
              placeholderTextColor={COLORS.textLight}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.surface} />
            ) : (
              <Text style={styles.saveBtnText}>{t('Guardar')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  scrollContent: { padding: 24, gap: 16, paddingBottom: 32 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginLeft: 4 },
  input: {
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: COLORS.text,
  },
  inputMultiline: { minHeight: 100, textAlignVertical: 'top' },
  sectionLabel: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginTop: 4 },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeChip: {
    flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: COLORS.surface,
    borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center',
  },
  typeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeChipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  typeChipTextActive: { color: COLORS.surface },
  togglesSection: { gap: 10 },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  toggleRowActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  toggleLabelActive: { color: COLORS.primaryDark },
  toggleSwitch: {
    width: 44, height: 26, borderRadius: 13, backgroundColor: COLORS.border,
    justifyContent: 'center', paddingHorizontal: 3,
  },
  toggleSwitchActive: { backgroundColor: COLORS.primary, alignItems: 'flex-end' },
  toggleDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.surface },
  errorContainer: { backgroundColor: '#FEE2E2', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#FECACA' },
  errorText: { color: COLORS.error, fontSize: 14, textAlign: 'center' },
  footer: {
    paddingHorizontal: 24, paddingVertical: 16, borderTopWidth: 1,
    borderTopColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.surface },
});
