interface HabitsData {
  schedule: 'DAY' | 'NIGHT';
  smoker: boolean;
  pets: boolean;
  cleanliness: number;
  noise: number;
  visitors: number;
  budgetMin: number;
  budgetMax: number;
}

interface ListingRules {
  smokersAllowed: boolean;
  petsAllowed: boolean;
  pricePerMonth: number;
}

export function calculateCompatibility(
  seekerHabits: HabitsData,
  ownerHabits: HabitsData,
  listingRules: ListingRules
): number {
  let score = 0;

  // 1. Schedule match (25%)
  if (seekerHabits.schedule === ownerHabits.schedule) {
    score += 25;
  }

  // 2. Smoker match (20%)
  if (!listingRules.smokersAllowed && seekerHabits.smoker) {
    score += 0;
  } else if (seekerHabits.smoker === ownerHabits.smoker) {
    score += 20;
  } else {
    score += 10;
  }

  // 3. Pets match (15%)
  if (!listingRules.petsAllowed && seekerHabits.pets) {
    score += 0;
  } else if (seekerHabits.pets === ownerHabits.pets) {
    score += 15;
  } else {
    score += 7;
  }

  // 4. Cleanliness match (15%)
  const cleanDiff = Math.abs(seekerHabits.cleanliness - ownerHabits.cleanliness);
  score += Math.max(0, 15 - cleanDiff * 3.75);

  // 5. Noise tolerance match (10%)
  const noiseDiff = Math.abs(seekerHabits.noise - ownerHabits.noise);
  score += Math.max(0, 10 - noiseDiff * 2.5);

  // 6. Budget fit (15%)
  const price = listingRules.pricePerMonth;
  if (price >= seekerHabits.budgetMin && price <= seekerHabits.budgetMax) {
    score += 15;
  } else {
    const range = seekerHabits.budgetMax - seekerHabits.budgetMin;
    const margin = Math.max(range * 0.2, 1);
    if (price < seekerHabits.budgetMin) {
      const diff = seekerHabits.budgetMin - price;
      score += Math.max(0, 15 * (1 - diff / margin));
    } else {
      const diff = price - seekerHabits.budgetMax;
      score += Math.max(0, 15 * (1 - diff / margin));
    }
  }

  return Math.round(score);
}
