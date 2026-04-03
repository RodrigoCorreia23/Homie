import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { userService } from '../../services/user.service';
import { COLORS } from '../../utils/constants';
import { useT } from '../../utils/i18n';
import type {
  Habits,
  HouseRules,
  UserGender,
  SmokingPolicy,
  PetsPolicy,
  PartiesPolicy,
  OvernightGuestsPolicy,
} from '../../types';

type Schedule = 'DAY' | 'NIGHT';
type Role = 'SEEKER' | 'LANDLORD' | 'BOTH';

// ─── Step definitions per role ───────────────────────────
const SEEKER_STEPS = ['role', 'gender', 'schedule', 'lifestyle', 'preferences', 'budget'] as const;
const LANDLORD_STEPS = ['role', 'smoking', 'parties', 'guests', 'cleanliness', 'genderPref'] as const;

function getSteps(role: Role | null) {
  if (role === 'LANDLORD') return LANDLORD_STEPS;
  if (role === 'BOTH') return [...SEEKER_STEPS, ...LANDLORD_STEPS.slice(1)] as const;
  return SEEKER_STEPS; // default / SEEKER
}

export default function OnboardingScreen() {
  const t = useT();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step: Role
  const [role, setRole] = useState<Role | null>(null);
  const [preferredCities, setPreferredCities] = useState<string[]>([]);
  const [cityInput, setCityInput] = useState('');

  // Seeker fields
  const [gender, setGender] = useState<UserGender | null>(null);
  const [schedule, setSchedule] = useState<Schedule>('DAY');
  const [smoker, setSmoker] = useState(false);
  const [pets, setPets] = useState(false);
  const [cleanliness, setCleanliness] = useState(3);
  const [noise, setNoise] = useState(3);
  const [visitors, setVisitors] = useState(3);
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');

  // Landlord fields
  const [smokingPolicy, setSmokingPolicy] = useState<SmokingPolicy>('NOT_ALLOWED');
  const [petsPolicy, setPetsPolicy] = useState<PetsPolicy>('NOT_ALLOWED');
  const [partiesPolicy, setPartiesPolicy] = useState<PartiesPolicy>('NOT_ALLOWED');
  const [overnightGuests, setOvernightGuests] = useState<OvernightGuestsPolicy>('WITH_NOTICE');
  const [quietHoursStart, setQuietHoursStart] = useState('23:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('08:00');
  const [cleanlinessLevel, setCleanlinessLevel] = useState(3);
  const [preferredGender, setPreferredGender] = useState<'MALE' | 'FEMALE' | 'ANY'>('ANY');

  const steps = getSteps(role);
  const totalSteps = steps.length;
  const currentStepName = steps[step] || 'role';

  // ─── Validation ─────────────────────────────────────────
  const validateStep = (): boolean => {
    if (currentStepName === 'role') {
      if (!role) {
        setError(t('Seleciona o que procuras.'));
        return false;
      }
      if ((role === 'SEEKER' || role === 'BOTH') && preferredCities.length === 0) {
        setError(t('Adiciona pelo menos uma cidade.'));
        return false;
      }
    }
    if (currentStepName === 'gender' && !gender) {
      setError(t('Seleciona o teu sexo.'));
      return false;
    }
    if (currentStepName === 'budget') {
      const min = parseFloat(budgetMin || '0');
      const max = parseFloat(budgetMax || '0');
      if (max > 0 && min > max) {
        setError(t('O orçamento mínimo não pode ser maior que o máximo.'));
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (!validateStep()) return;

    // After role step, we now know the steps — recalculate
    if (currentStepName === 'role') {
      setStep(1);
      return;
    }

    if (step < totalSteps - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setError('');
    if (step > 0) {
      // If going back to role step, reset step index
      if (step === 1 && currentStepName !== 'role') {
        setStep(0);
        return;
      }
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    setError('');
    if (!validateStep()) return;

    setLoading(true);
    try {
      const payload: any = { role: role! };

      // Seeker data
      if (role === 'SEEKER' || role === 'BOTH') {
        payload.gender = gender;
        payload.preferredCities = preferredCities;
        const minCents = Math.round(parseFloat(budgetMin || '0') * 100);
        const maxCents = Math.round(parseFloat(budgetMax || '0') * 100);
        payload.habits = {
          schedule,
          smoker,
          pets,
          cleanliness,
          noise,
          visitors,
          budgetMin: minCents,
          budgetMax: maxCents,
        };
      }

      // Landlord data
      if (role === 'LANDLORD' || role === 'BOTH') {
        payload.houseRules = {
          smokingPolicy,
          petsPolicy,
          partiesPolicy,
          overnightGuests,
          quietHoursStart: partiesPolicy !== 'ALLOWED' ? quietHoursStart : undefined,
          quietHoursEnd: partiesPolicy !== 'ALLOWED' ? quietHoursEnd : undefined,
          cleanlinessLevel,
          preferredGender,
        };
      }

      await userService.completeOnboarding(payload);
      router.replace('/(tabs)');
    } catch (err: any) {
      const message =
        err?.response?.data?.message || t('Erro ao guardar preferências.');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Shared UI Components ──────────────────────────────

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${((step + 1) / totalSteps) * 100}%` },
          ]}
        />
      </View>
      <Text style={styles.progressText}>
        {t('Passo')} {step + 1} {t('de')} {totalSteps}
      </Text>
    </View>
  );

  const renderToggleCard = (
    label: string,
    description: string,
    isActive: boolean,
    onPress: () => void,
    icon?: keyof typeof Ionicons.glyphMap
  ) => (
    <TouchableOpacity
      style={[styles.toggleCard, isActive && styles.toggleCardActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={20}
          color={isActive ? COLORS.primaryDark : COLORS.textSecondary}
          style={{ marginBottom: 4 }}
        />
      )}
      <Text
        style={[styles.toggleCardTitle, isActive && styles.toggleCardTitleActive]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.toggleCardDescription,
          isActive && styles.toggleCardDescriptionActive,
        ]}
      >
        {description}
      </Text>
    </TouchableOpacity>
  );

  const renderOptionCard = (
    label: string,
    description: string,
    isActive: boolean,
    onPress: () => void,
    icon?: keyof typeof Ionicons.glyphMap
  ) => (
    <TouchableOpacity
      style={[styles.optionCard, isActive && styles.optionCardActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && (
        <View style={[styles.optionIconContainer, isActive && styles.optionIconContainerActive]}>
          <Ionicons
            name={icon}
            size={22}
            color={isActive ? COLORS.surface : COLORS.primary}
          />
        </View>
      )}
      <View style={styles.optionTextContainer}>
        <Text style={[styles.optionCardTitle, isActive && styles.optionCardTitleActive]}>
          {label}
        </Text>
        <Text style={[styles.optionCardDescription, isActive && styles.optionCardDescriptionActive]}>
          {description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderSlider = (
    label: string,
    value: number,
    onChange: (val: number) => void,
    lowLabel: string,
    highLabel: string
  ) => (
    <View style={styles.sliderContainer}>
      <Text style={styles.sliderLabel}>
        {label}: <Text style={styles.sliderValue}>{value}/5</Text>
      </Text>
      <View style={styles.sliderTrack}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity
            key={n}
            style={[
              styles.sliderDot,
              n <= value && styles.sliderDotActive,
            ]}
            onPress={() => onChange(n)}
          >
            <Text
              style={[
                styles.sliderDotText,
                n <= value && styles.sliderDotTextActive,
              ]}
            >
              {n}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderEndLabel}>{lowLabel}</Text>
        <Text style={styles.sliderEndLabel}>{highLabel}</Text>
      </View>
    </View>
  );

  const renderError = () =>
    error ? (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    ) : null;

  // ─── STEP: Role Selection ──────────────────────────────
  const renderRoleStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('O que procuras?')}</Text>
      <Text style={styles.stepDescription}>
        {t('Escolhe o teu objetivo para começar.')}
      </Text>

      {renderError()}

      <View style={styles.roleCardsContainer}>
        {renderRoleCard('SEEKER', 'search', t('Procuro casa'), t('Explorar anúncios e encontrar o lar ideal'))}
        {renderRoleCard('LANDLORD', 'key-outline', t('Tenho casa'), t('Publicar o meu espaço e encontrar inquilinos'))}
        {renderRoleCard('BOTH', 'swap-horizontal', t('Ambos'), t('Procurar casa e publicar o meu espaço'))}
      </View>

      {(role === 'SEEKER' || role === 'BOTH') && (
        <View style={styles.cityInputSection}>
          <Text style={styles.cityInputLabel}>{t('Onde queres viver?')}</Text>
          {preferredCities.length > 0 && (
            <View style={styles.cityTagsContainer}>
              {preferredCities.map((c, i) => (
                <View key={i} style={styles.cityTag}>
                  <Ionicons name="location" size={14} color={COLORS.primary} />
                  <Text style={styles.cityTagText}>{c}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setPreferredCities(preferredCities.filter((_, j) => j !== i));
                      setError('');
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          {preferredCities.length < 5 && (
            <View style={styles.cityInputWrapper}>
              <Ionicons name="location-outline" size={20} color={COLORS.textSecondary} />
              <TextInput
                style={styles.cityInput}
                placeholder={preferredCities.length === 0 ? t('ex: Porto') : t('Adicionar outra cidade...')}
                placeholderTextColor={COLORS.textLight}
                value={cityInput}
                onChangeText={(text) => {
                  setCityInput(text);
                  setError('');
                }}
                onSubmitEditing={() => {
                  const trimmed = cityInput.trim();
                  if (trimmed && !preferredCities.includes(trimmed)) {
                    setPreferredCities([...preferredCities, trimmed]);
                    setCityInput('');
                  }
                }}
                returnKeyType="done"
              />
              {cityInput.trim() && (
                <TouchableOpacity
                  onPress={() => {
                    const trimmed = cityInput.trim();
                    if (trimmed && !preferredCities.includes(trimmed)) {
                      setPreferredCities([...preferredCities, trimmed]);
                      setCityInput('');
                    }
                  }}
                  style={styles.addCityButton}
                >
                  <Ionicons name="add-circle" size={28} color={COLORS.primary} />
                </TouchableOpacity>
              )}
            </View>
          )}
          <Text style={styles.cityHint}>
            {t('Podes adicionar até 5 cidades (máx.')} {5 - preferredCities.length} {t('restantes)')}
          </Text>
        </View>
      )}
    </View>
  );

  const renderRoleCard = (
    roleValue: Role,
    icon: keyof typeof Ionicons.glyphMap,
    title: string,
    description: string
  ) => {
    const isActive = role === roleValue;
    return (
      <TouchableOpacity
        style={[styles.roleCard, isActive && styles.roleCardActive]}
        onPress={() => {
          setRole(roleValue);
          setStep(0); // reset to recalculate steps
          setError('');
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.roleIconContainer, isActive && styles.roleIconContainerActive]}>
          <Ionicons
            name={icon}
            size={28}
            color={isActive ? COLORS.surface : COLORS.primary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.roleCardTitle, isActive && styles.roleCardTitleActive]}>
            {title}
          </Text>
          <Text style={[styles.roleCardDesc, isActive && styles.roleCardDescActive]}>
            {description}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // ─── STEP: Gender (Seeker) ─────────────────────────────
  const renderGenderStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('Qual é o teu sexo?')}</Text>
      <Text style={styles.stepDescription}>
        {t('Alguns proprietários têm preferência de género.')}
      </Text>

      {renderError()}

      <View style={styles.optionCardsContainer}>
        {renderOptionCard(t('Masculino'), '', gender === 'MALE', () => { setGender('MALE'); setError(''); }, 'male')}
        {renderOptionCard(t('Feminino'), '', gender === 'FEMALE', () => { setGender('FEMALE'); setError(''); }, 'female')}
        {renderOptionCard(t('Outro'), '', gender === 'OTHER', () => { setGender('OTHER'); setError(''); }, 'person')}
      </View>
    </View>
  );

  // ─── STEP: Schedule (Seeker) ───────────────────────────
  const renderScheduleStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('O teu horário')}</Text>
      <Text style={styles.stepDescription}>
        {t('És mais de manhãs ou de noites?')}
      </Text>
      <View style={styles.toggleRow}>
        {renderToggleCard(
          t('Diurno'),
          t('Acordo cedo, ativo durante o dia'),
          schedule === 'DAY',
          () => setSchedule('DAY'),
          'sunny-outline'
        )}
        {renderToggleCard(
          t('Noturno'),
          t('Noites longas, durmo de manhã'),
          schedule === 'NIGHT',
          () => setSchedule('NIGHT'),
          'moon-outline'
        )}
      </View>
    </View>
  );

  // ─── STEP: Lifestyle (Seeker) ──────────────────────────
  const renderLifestyleStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('Estilo de vida')}</Text>
      <Text style={styles.stepDescription}>
        {t('Conta-nos sobre os teus hábitos.')}
      </Text>
      <View style={styles.lifestyleSection}>
        <Text style={styles.lifestyleQuestion}>{t('Fumas?')}</Text>
        <View style={styles.toggleRow}>
          {renderToggleCard(t('Sim'), t('Sou fumador'), smoker, () => setSmoker(true))}
          {renderToggleCard(t('Não'), t('Não fumo'), !smoker, () => setSmoker(false))}
        </View>
      </View>
      <View style={styles.lifestyleSection}>
        <Text style={styles.lifestyleQuestion}>{t('Tens animais?')}</Text>
        <View style={styles.toggleRow}>
          {renderToggleCard(t('Sim'), t('Tenho animais'), pets, () => setPets(true))}
          {renderToggleCard(t('Não'), t('Sem animais'), !pets, () => setPets(false))}
        </View>
      </View>
    </View>
  );

  // ─── STEP: Preferences (Seeker) ────────────────────────
  const renderPreferencesStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('Preferências')}</Text>
      <Text style={styles.stepDescription}>
        {t('Avalia de 1 a 5 as tuas preferências.')}
      </Text>
      {renderSlider(t('Limpeza'), cleanliness, setCleanliness, t('Relaxado'), t('Muito arrumado'))}
      {renderSlider(t('Tolerância a barulho'), noise, setNoise, t('Silêncio'), t('Animado'))}
      {renderSlider(t('Visitas'), visitors, setVisitors, t('Raramente'), t('Frequentemente'))}
    </View>
  );

  // ─── STEP: Budget (Seeker) ─────────────────────────────
  const renderBudgetStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('Orçamento')}</Text>
      <Text style={styles.stepDescription}>
        {t('Qual é o teu intervalo de renda mensal? (em euros)')}
      </Text>

      {renderError()}

      <View style={styles.budgetRow}>
        <View style={styles.budgetInput}>
          <Text style={styles.budgetLabel}>{t('Mínimo')}</Text>
          <View style={styles.budgetInputWrapper}>
            <Text style={styles.currencySymbol}>EUR</Text>
            <TextInput
              style={styles.input}
              placeholder="200"
              placeholderTextColor={COLORS.textLight}
              value={budgetMin}
              onChangeText={setBudgetMin}
              keyboardType="numeric"
            />
          </View>
        </View>
        <View style={styles.budgetInput}>
          <Text style={styles.budgetLabel}>{t('Máximo')}</Text>
          <View style={styles.budgetInputWrapper}>
            <Text style={styles.currencySymbol}>EUR</Text>
            <TextInput
              style={styles.input}
              placeholder="800"
              placeholderTextColor={COLORS.textLight}
              value={budgetMax}
              onChangeText={setBudgetMax}
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>
    </View>
  );

  // ─── STEP: Smoking Policy (Landlord) ───────────────────
  const renderSmokingStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('Política de fumo')}</Text>
      <Text style={styles.stepDescription}>
        {t('Define as regras sobre fumar na tua propriedade.')}
      </Text>
      <View style={styles.optionCardsContainer}>
        {renderOptionCard(
          t('Proibido'),
          t('Não é permitido fumar em lado nenhum'),
          smokingPolicy === 'NOT_ALLOWED',
          () => setSmokingPolicy('NOT_ALLOWED'),
          'close-circle-outline'
        )}
        {renderOptionCard(
          t('Só no exterior'),
          t('Permitido na varanda, terraço ou jardim'),
          smokingPolicy === 'OUTSIDE_ONLY',
          () => setSmokingPolicy('OUTSIDE_ONLY'),
          'leaf-outline'
        )}
        {renderOptionCard(
          t('Permitido'),
          t('Pode fumar livremente na casa'),
          smokingPolicy === 'ALLOWED',
          () => setSmokingPolicy('ALLOWED'),
          'checkmark-circle-outline'
        )}
      </View>
    </View>
  );

  // ─── STEP: Parties & Quiet Hours (Landlord) ────────────
  const renderPartiesStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('Festas e barulho')}</Text>
      <Text style={styles.stepDescription}>
        {t('Define as regras sobre festas e horários de silêncio.')}
      </Text>
      <View style={styles.optionCardsContainer}>
        {renderOptionCard(
          t('Proibido'),
          t('Sem festas, ambiente calmo'),
          partiesPolicy === 'NOT_ALLOWED',
          () => setPartiesPolicy('NOT_ALLOWED'),
          'volume-mute-outline'
        )}
        {renderOptionCard(
          t('Ocasional'),
          t('Festas com aviso prévio, pontualmente'),
          partiesPolicy === 'OCCASIONAL',
          () => setPartiesPolicy('OCCASIONAL'),
          'musical-notes-outline'
        )}
        {renderOptionCard(
          t('Livre'),
          t('Sem restrições de festas'),
          partiesPolicy === 'ALLOWED',
          () => setPartiesPolicy('ALLOWED'),
          'happy-outline'
        )}
      </View>

      {partiesPolicy !== 'ALLOWED' && (
        <View style={styles.quietHoursSection}>
          <Text style={styles.sectionSubtitle}>{t('Horário de silêncio')}</Text>
          <Text style={styles.sectionSubDescription}>
            {t('Período em que se deve manter o silêncio.')}
          </Text>
          <View style={styles.timeRow}>
            <View style={styles.timeInput}>
              <Text style={styles.timeLabel}>{t('Das')}</Text>
              <View style={styles.timeInputWrapper}>
                <Ionicons name="moon-outline" size={18} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.timeField}
                  value={quietHoursStart}
                  onChangeText={setQuietHoursStart}
                  placeholder="23:00"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>
            </View>
            <View style={styles.timeInput}>
              <Text style={styles.timeLabel}>{t('Às')}</Text>
              <View style={styles.timeInputWrapper}>
                <Ionicons name="sunny-outline" size={18} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.timeField}
                  value={quietHoursEnd}
                  onChangeText={setQuietHoursEnd}
                  placeholder="08:00"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  // ─── STEP: Guests & Pets (Landlord) ────────────────────
  const renderGuestsStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('Visitas e animais')}</Text>
      <Text style={styles.stepDescription}>
        {t('Define as regras sobre hóspedes e animais de estimação.')}
      </Text>

      <Text style={styles.sectionSubtitle}>{t('Hóspedes overnight')}</Text>
      <View style={styles.optionCardsContainer}>
        {renderOptionCard(
          t('Não permitido'),
          t('Sem hóspedes a dormir'),
          overnightGuests === 'NOT_ALLOWED',
          () => setOvernightGuests('NOT_ALLOWED'),
          'close-circle-outline'
        )}
        {renderOptionCard(
          t('Com aviso'),
          t('Permitido com aviso prévio'),
          overnightGuests === 'WITH_NOTICE',
          () => setOvernightGuests('WITH_NOTICE'),
          'chatbubble-outline'
        )}
        {renderOptionCard(
          t('Livre'),
          t('Sem restrições de hóspedes'),
          overnightGuests === 'ALLOWED',
          () => setOvernightGuests('ALLOWED'),
          'checkmark-circle-outline'
        )}
      </View>

      <Text style={[styles.sectionSubtitle, { marginTop: 24 }]}>{t('Animais de estimação')}</Text>
      <View style={styles.optionCardsContainer}>
        {renderOptionCard(
          t('Não permitido'),
          t('Sem animais na casa'),
          petsPolicy === 'NOT_ALLOWED',
          () => setPetsPolicy('NOT_ALLOWED'),
          'close-circle-outline'
        )}
        {renderOptionCard(
          t('Pequeno porte'),
          t('Gatos, peixes, hamsters, etc.'),
          petsPolicy === 'SMALL_ONLY',
          () => setPetsPolicy('SMALL_ONLY'),
          'paw-outline'
        )}
        {renderOptionCard(
          t('Todos permitidos'),
          t('Qualquer tipo de animal'),
          petsPolicy === 'ALLOWED',
          () => setPetsPolicy('ALLOWED'),
          'heart-outline'
        )}
      </View>
    </View>
  );

  // ─── STEP: Cleanliness Expectation (Landlord) ──────────
  const renderCleanlinessStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('Limpeza')}</Text>
      <Text style={styles.stepDescription}>
        {t('Qual o nível de limpeza que esperas nos espaços comuns?')}
      </Text>
      {renderSlider(
        t('Expectativa de limpeza'),
        cleanlinessLevel,
        setCleanlinessLevel,
        t('Relaxado'),
        t('Impecável')
      )}
    </View>
  );

  // ─── STEP: Gender Preference (Landlord) ────────────────
  const renderGenderPrefStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('Preferência de inquilino')}</Text>
      <Text style={styles.stepDescription}>
        {t('Tens preferência de género para quem vive no teu espaço?')}
      </Text>
      <View style={styles.optionCardsContainer}>
        {renderOptionCard(
          t('Indiferente'),
          t('Aceito qualquer pessoa'),
          preferredGender === 'ANY',
          () => setPreferredGender('ANY'),
          'people-outline'
        )}
        {renderOptionCard(
          t('Masculino'),
          t('Prefiro inquilinos homens'),
          preferredGender === 'MALE',
          () => setPreferredGender('MALE'),
          'male'
        )}
        {renderOptionCard(
          t('Feminino'),
          t('Prefiro inquilinas mulheres'),
          preferredGender === 'FEMALE',
          () => setPreferredGender('FEMALE'),
          'female'
        )}
      </View>
    </View>
  );

  // ─── Step Router ───────────────────────────────────────
  const renderCurrentStep = () => {
    switch (currentStepName) {
      case 'role': return renderRoleStep();
      case 'gender': return renderGenderStep();
      case 'schedule': return renderScheduleStep();
      case 'lifestyle': return renderLifestyleStep();
      case 'preferences': return renderPreferencesStep();
      case 'budget': return renderBudgetStep();
      case 'smoking': return renderSmokingStep();
      case 'parties': return renderPartiesStep();
      case 'guests': return renderGuestsStep();
      case 'cleanliness': return renderCleanlinessStep();
      case 'genderPref': return renderGenderPrefStep();
      default: return renderRoleStep();
    }
  };

  const isLastStep = step === totalSteps - 1;

  return (
    <View style={styles.container}>
      {renderProgressBar()}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {renderCurrentStep()}
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>{t('Voltar')}</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}

        {!isLastStep ? (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>{t('Seguinte')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextButton, loading && styles.buttonDisabled]}
            onPress={handleComplete}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.surface} />
            ) : (
              <Text style={styles.nextButtonText}>{t('Concluir')}</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 60,
  },
  progressContainer: {
    paddingHorizontal: 24,
    marginBottom: 8,
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
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  stepContent: {
    gap: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  stepDescription: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  // Role cards
  roleCardsContainer: {
    gap: 12,
  },
  roleCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  roleCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  roleIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleIconContainerActive: {
    backgroundColor: COLORS.primary,
  },
  roleCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  roleCardTitleActive: {
    color: COLORS.primaryDark,
  },
  roleCardDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  roleCardDescActive: {
    color: COLORS.primaryDark,
  },
  cityInputSection: {
    gap: 10,
    marginTop: 4,
  },
  cityInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  cityTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  cityTagText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  cityInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  cityInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  addCityButton: {
    padding: 2,
  },
  cityHint: {
    fontSize: 12,
    color: COLORS.textLight,
    marginLeft: 4,
  },
  // Option cards (vertical list)
  optionCardsContainer: {
    gap: 12,
  },
  optionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  optionCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  optionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionIconContainerActive: {
    backgroundColor: COLORS.primary,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  optionCardTitleActive: {
    color: COLORS.primaryDark,
  },
  optionCardDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  optionCardDescriptionActive: {
    color: COLORS.primaryDark,
  },
  // Toggle cards (horizontal row)
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    gap: 6,
  },
  toggleCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  toggleCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  toggleCardTitleActive: {
    color: COLORS.primaryDark,
  },
  toggleCardDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  toggleCardDescriptionActive: {
    color: COLORS.primaryDark,
  },
  // Lifestyle
  lifestyleSection: {
    gap: 12,
  },
  lifestyleQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  // Slider
  sliderContainer: {
    gap: 12,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  sliderValue: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  sliderTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  sliderDot: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderDotActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sliderDotText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  sliderDotTextActive: {
    color: COLORS.surface,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderEndLabel: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  // Section sub
  sectionSubtitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionSubDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: -12,
  },
  // Quiet hours
  quietHoursSection: {
    gap: 12,
    marginTop: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInput: {
    flex: 1,
    gap: 6,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 4,
  },
  timeInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  timeField: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  // Budget
  budgetRow: {
    flexDirection: 'row',
    gap: 12,
  },
  budgetInput: {
    flex: 1,
    gap: 6,
  },
  budgetLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 4,
  },
  budgetInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  currencySymbol: {
    paddingLeft: 14,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  input: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
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
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
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
