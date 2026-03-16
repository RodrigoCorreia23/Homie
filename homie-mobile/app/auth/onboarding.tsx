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
import type { Habits } from '../../types';

type Schedule = 'DAY' | 'NIGHT';
type Role = 'SEEKER' | 'LANDLORD' | 'BOTH';

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const totalSteps = 5;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Role Selection
  const [role, setRole] = useState<Role | null>(null);
  const [preferredCity, setPreferredCity] = useState('');

  // Step 2: Schedule
  const [schedule, setSchedule] = useState<Schedule>('DAY');

  // Step 3: Lifestyle
  const [smoker, setSmoker] = useState(false);
  const [pets, setPets] = useState(false);

  // Step 4: Preferences
  const [cleanliness, setCleanliness] = useState(3);
  const [noise, setNoise] = useState(3);
  const [visitors, setVisitors] = useState(3);

  // Step 5: Budget
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');

  const handleNext = () => {
    if (step === 1 && !role) {
      setError('Please select what you are looking for.');
      return;
    }
    if (step === 1 && (role === 'SEEKER' || role === 'BOTH') && !preferredCity.trim()) {
      setError('Please enter your preferred city.');
      return;
    }
    setError('');
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setError('');
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    setError('');
    const minCents = Math.round(parseFloat(budgetMin || '0') * 100);
    const maxCents = Math.round(parseFloat(budgetMax || '0') * 100);

    if (maxCents > 0 && minCents > maxCents) {
      setError('Minimum budget cannot exceed maximum budget.');
      return;
    }

    setLoading(true);
    try {
      const habits: Partial<Habits> = {
        schedule,
        smoker,
        pets,
        cleanliness: cleanliness as Habits['cleanliness'],
        noise: noise as Habits['noise'],
        visitors: visitors as Habits['visitors'],
        budgetMin: minCents,
        budgetMax: maxCents,
      };
      await userService.completeOnboarding({
        role: role!,
        preferredCity: (role === 'SEEKER' || role === 'BOTH') ? preferredCity.trim() : undefined,
        habits,
      });
      router.replace('/(tabs)');
    } catch (err: any) {
      const message =
        err?.response?.data?.message || 'Failed to save preferences.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${(step / totalSteps) * 100}%` },
          ]}
        />
      </View>
      <Text style={styles.progressText}>
        Step {step} of {totalSteps}
      </Text>
    </View>
  );

  const renderToggleCard = (
    label: string,
    description: string,
    isActive: boolean,
    onPress: () => void
  ) => (
    <TouchableOpacity
      style={[styles.toggleCard, isActive && styles.toggleCardActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
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
        <Text style={[styles.roleCardTitle, isActive && styles.roleCardTitleActive]}>
          {title}
        </Text>
        <Text style={[styles.roleCardDescription, isActive && styles.roleCardDescriptionActive]}>
          {description}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>What are you looking for?</Text>
      <Text style={styles.stepDescription}>
        Choose your role to get started.
      </Text>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.roleCardsContainer}>
        {renderRoleCard('SEEKER', 'search', 'Find a place to live', 'Browse listings and find your ideal home')}
        {renderRoleCard('LANDLORD', 'key-outline', 'List my property', 'Post your property and find tenants')}
        {renderRoleCard('BOTH', 'swap-horizontal', 'Both', 'Search for a place and list your property')}
      </View>

      {(role === 'SEEKER' || role === 'BOTH') && (
        <View style={styles.cityInputSection}>
          <Text style={styles.cityInputLabel}>Where do you want to live?</Text>
          <View style={styles.cityInputWrapper}>
            <Ionicons name="location-outline" size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.cityInput}
              placeholder="e.g. Lisbon, Porto, Barcelona..."
              placeholderTextColor={COLORS.textLight}
              value={preferredCity}
              onChangeText={(text) => {
                setPreferredCity(text);
                setError('');
              }}
            />
          </View>
        </View>
      )}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Your Schedule</Text>
      <Text style={styles.stepDescription}>
        Are you a morning person or a night owl?
      </Text>
      <View style={styles.toggleRow}>
        {renderToggleCard(
          'Day Person',
          'Early riser, active during the day',
          schedule === 'DAY',
          () => setSchedule('DAY')
        )}
        {renderToggleCard(
          'Night Owl',
          'Late nights, sleep in mornings',
          schedule === 'NIGHT',
          () => setSchedule('NIGHT')
        )}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Lifestyle</Text>
      <Text style={styles.stepDescription}>
        Tell us about your lifestyle preferences.
      </Text>
      <View style={styles.lifestyleSection}>
        <Text style={styles.lifestyleQuestion}>Do you smoke?</Text>
        <View style={styles.toggleRow}>
          {renderToggleCard('Yes', 'I smoke', smoker, () => setSmoker(true))}
          {renderToggleCard("No", "I don't smoke", !smoker, () =>
            setSmoker(false)
          )}
        </View>
      </View>
      <View style={styles.lifestyleSection}>
        <Text style={styles.lifestyleQuestion}>Do you have pets?</Text>
        <View style={styles.toggleRow}>
          {renderToggleCard('Yes', 'I have pets', pets, () => setPets(true))}
          {renderToggleCard("No", "No pets", !pets, () => setPets(false))}
        </View>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Preferences</Text>
      <Text style={styles.stepDescription}>
        Rate your preferences on a scale of 1 to 5.
      </Text>
      {renderSlider('Cleanliness', cleanliness, setCleanliness, 'Relaxed', 'Very tidy')}
      {renderSlider('Noise Tolerance', noise, setNoise, 'Quiet', 'Lively')}
      {renderSlider('Visitors', visitors, setVisitors, 'Rarely', 'Often')}
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Budget</Text>
      <Text style={styles.stepDescription}>
        What is your monthly budget range? (in euros)
      </Text>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.budgetRow}>
        <View style={styles.budgetInput}>
          <Text style={styles.budgetLabel}>Minimum</Text>
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
          <Text style={styles.budgetLabel}>Maximum</Text>
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

  return (
    <View style={styles.container}>
      {renderProgressBar()}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
      </ScrollView>

      <View style={styles.footer}>
        {step > 1 ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}

        {step < totalSteps ? (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>Next</Text>
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
              <Text style={styles.nextButtonText}>Complete</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

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
  // Role selection cards
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
    flex: 1,
  },
  roleCardTitleActive: {
    color: COLORS.primaryDark,
  },
  roleCardDescription: {
    display: 'none',
  },
  roleCardDescriptionActive: {
    display: 'none',
  },
  cityInputSection: {
    gap: 8,
    marginTop: 4,
  },
  cityInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
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
  // Toggle cards
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
  lifestyleSection: {
    gap: 12,
  },
  lifestyleQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
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
