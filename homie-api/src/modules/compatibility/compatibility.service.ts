import { prisma } from '../../config/database';
import { calculateCompatibility } from '../../shared/utils/scoring';

export async function getCompatibilityScore(
  seekerUserId: string,
  listingId: string
): Promise<number | null> {
  const [seekerHabits, listing] = await Promise.all([
    prisma.habits.findUnique({ where: { userId: seekerUserId } }),
    prisma.listing.findUnique({
      where: { id: listingId },
      include: { owner: { include: { habits: true } } },
    }),
  ]);

  if (!seekerHabits || !listing || !listing.owner.habits) return null;

  return calculateCompatibility(
    seekerHabits,
    listing.owner.habits,
    {
      smokersAllowed: listing.smokersAllowed,
      petsAllowed: listing.petsAllowed,
      pricePerMonth: listing.pricePerMonth,
    }
  );
}
