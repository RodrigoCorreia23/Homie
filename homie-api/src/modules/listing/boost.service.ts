import { prisma } from '../../config/database';
import { stripe } from '../../config/stripe';
import { AppError } from '../../shared/middleware/errorHandler';

// Boost tiers: duration in days + price in cents (EUR)
export const BOOST_TIERS = {
  '7': { days: 7, price: 499, label: '7 dias' },
  '14': { days: 14, price: 950, label: '14 dias' },
  '30': { days: 30, price: 1300, label: '30 dias' },
} as const;

export type BoostTier = keyof typeof BOOST_TIERS;

export async function getBoostTiers() {
  return Object.entries(BOOST_TIERS).map(([key, tier]) => ({
    id: key,
    ...tier,
    priceFormatted: `EUR ${(tier.price / 100).toFixed(2)}`,
  }));
}

export async function createBoostPayment(
  userId: string,
  listingId: string,
  tier: BoostTier,
) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
  });

  if (!listing) {
    throw new AppError('Listing not found', 404);
  }

  if (listing.ownerId !== userId) {
    throw new AppError('Not authorized to boost this listing', 403);
  }

  if (listing.status !== 'ACTIVE') {
    throw new AppError('Only active listings can be boosted', 400);
  }

  const boostTier = BOOST_TIERS[tier];
  if (!boostTier) {
    throw new AppError('Invalid boost tier', 400);
  }

  // Check if already boosted
  if (listing.boostedUntil && listing.boostedUntil > new Date()) {
    throw new AppError('Listing is already boosted', 400);
  }

  // Get or create Stripe customer
  let user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true, email: true, name: true },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customerId },
    });
  }

  // Create PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: boostTier.price,
    currency: 'eur',
    customer: customerId,
    metadata: {
      type: 'listing_boost',
      listingId,
      tier,
      days: boostTier.days.toString(),
    },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount: boostTier.price,
    tier: boostTier,
  };
}

export async function activateBoost(
  paymentIntentId: string,
) {
  // Verify payment succeeded
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== 'succeeded') {
    throw new AppError('Payment not completed', 400);
  }

  const { listingId, days } = paymentIntent.metadata;
  if (!listingId || !days) {
    throw new AppError('Invalid boost payment metadata', 400);
  }

  const boostDays = parseInt(days);
  const now = new Date();
  const boostedUntil = new Date(now.getTime() + boostDays * 24 * 60 * 60 * 1000);

  const listing = await prisma.listing.update({
    where: { id: listingId },
    data: {
      boostedUntil,
      boostStripePaymentId: paymentIntentId,
    },
  });

  return listing;
}

export async function confirmBoostFromWebhook(paymentIntentId: string) {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.metadata.type !== 'listing_boost') {
    return; // Not a boost payment
  }

  await activateBoost(paymentIntentId);
}
