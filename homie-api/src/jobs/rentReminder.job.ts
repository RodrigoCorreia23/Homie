import { prisma } from '../config/database';
import { createNotification } from '../modules/notification/notification.service';
import { sendPushNotification } from '../shared/utils/pushNotifications';

export async function sendRentReminders(): Promise<void> {
  try {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find active tenancies
    const activeTenancies = await prisma.tenancy.findMany({
      where: { status: 'ACTIVE' },
      include: { listing: true },
    });

    for (const tenancy of activeTenancies) {
      // Check if there's already a payment for this month
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const existingPayment = await prisma.payment.findFirst({
        where: {
          tenancyId: tenancy.id,
          periodStart: { gte: startOfMonth },
          periodEnd: { lte: endOfMonth },
        },
      });

      if (!existingPayment) {
        // Create pending payment for the month
        const dueDate = new Date(today.getFullYear(), today.getMonth(), 1);
        if (dueDate < today) {
          dueDate.setMonth(dueDate.getMonth() + 1);
        }

        const commission = Math.round(tenancy.rentAmount * 0.02);

        await prisma.payment.create({
          data: {
            tenancyId: tenancy.id,
            tenantId: tenancy.tenantId,
            landlordId: tenancy.landlordId,
            amount: tenancy.rentAmount,
            commissionAmount: commission,
            netAmount: tenancy.rentAmount - commission,
            periodStart: startOfMonth,
            periodEnd: endOfMonth,
            dueDate,
            status: 'PENDING',
          },
        });
      }

      // Send reminder if due within 3 days
      const pendingPayment = await prisma.payment.findFirst({
        where: {
          tenancyId: tenancy.id,
          status: 'PENDING',
          dueDate: { lte: threeDaysFromNow, gte: today },
        },
      });

      if (pendingPayment) {
        await createNotification(
          tenancy.tenantId,
          'RENT_DUE',
          'Rent due soon',
          `Your rent for ${tenancy.listing.title} is due in 3 days.`,
          { paymentId: pendingPayment.id, tenancyId: tenancy.id }
        );

        // Send push notification to tenant
        await sendPushNotification(
          tenancy.tenantId,
          'Rent due soon',
          `Your rent for ${tenancy.listing.title} is due in 3 days.`,
          { paymentId: pendingPayment.id, tenancyId: tenancy.id }
        );
      }
    }
  } catch (error) {
    console.error('[CRON] Error sending rent reminders:', error);
  }
}
