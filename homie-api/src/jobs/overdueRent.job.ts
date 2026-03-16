import { prisma } from '../config/database';
import { createNotification } from '../modules/notification/notification.service';
import { sendPushNotification } from '../shared/utils/pushNotifications';

export async function checkOverduePayments(): Promise<void> {
  try {
    const overduePayments = await prisma.payment.findMany({
      where: {
        status: 'PENDING',
        dueDate: { lt: new Date() },
      },
      include: { tenancy: { include: { listing: true } } },
    });

    for (const payment of overduePayments) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'OVERDUE' },
      });

      await createNotification(
        payment.tenantId,
        'RENT_OVERDUE',
        'Rent overdue',
        `Your rent for ${payment.tenancy.listing.title} is overdue.`,
        { paymentId: payment.id, tenancyId: payment.tenancyId }
      );

      // Send push notification to tenant
      await sendPushNotification(
        payment.tenantId,
        'Rent overdue',
        `Your rent for ${payment.tenancy.listing.title} is overdue.`,
        { paymentId: payment.id, tenancyId: payment.tenancyId }
      );
    }

    if (overduePayments.length > 0) {
      console.log(`[CRON] Marked ${overduePayments.length} payments as overdue`);
    }
  } catch (error) {
    console.error('[CRON] Error checking overdue payments:', error);
  }
}
