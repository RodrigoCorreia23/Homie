import cron from 'node-cron';
import { checkOverduePayments } from './overdueRent.job';
import { sendRentReminders } from './rentReminder.job';
import { expireOldListings } from './listingExpiry.job';

export function startScheduler(): void {
  // Every day at 9:00 AM — check for overdue payments
  cron.schedule('0 9 * * *', async () => {
    console.log('[CRON] Checking overdue payments...');
    await checkOverduePayments();
  });

  // Every day at 10:00 AM — send rent reminders (3 days before due)
  cron.schedule('0 10 * * *', async () => {
    console.log('[CRON] Sending rent reminders...');
    await sendRentReminders();
  });

  // Every day at midnight — expire old listings (90+ days)
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Expiring old listings...');
    await expireOldListings();
  });

  console.log('Cron jobs scheduled');
}
