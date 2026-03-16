import { prisma } from '../config/database';
import { createNotification } from '../modules/notification/notification.service';

export async function expireOldListings(): Promise<void> {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const expiredListings = await prisma.listing.findMany({
      where: {
        status: 'ACTIVE',
        createdAt: { lt: ninetyDaysAgo },
      },
    });

    for (const listing of expiredListings) {
      await prisma.listing.update({
        where: { id: listing.id },
        data: { status: 'EXPIRED' },
      });

      await createNotification(
        listing.ownerId,
        'NEW_MATCHING_LISTING',
        'Listing expired',
        `Your listing "${listing.title}" has expired after 90 days. Reactivate it anytime.`,
        { listingId: listing.id }
      );
    }

    if (expiredListings.length > 0) {
      console.log(`[CRON] Expired ${expiredListings.length} listings`);
    }
  } catch (error) {
    console.error('[CRON] Error expiring listings:', error);
  }
}
