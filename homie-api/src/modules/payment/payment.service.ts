import { prisma } from '../../config/database';
import { stripe } from '../../config/stripe';
import { env } from '../../config/env';
import { AppError } from '../../shared/middleware/errorHandler';
import { getIO } from '../../socket';
import Stripe from 'stripe';

// ─── STRIPE CONNECT ──────────────────────────────────────

export async function createConnectAccount(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  if (user.stripeAccountId) {
    // Account already exists, return a new onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: user.stripeAccountId,
      refresh_url: `${env.FRONTEND_URL}/payments/connect/refresh`,
      return_url: `${env.FRONTEND_URL}/payments/connect/complete`,
      type: 'account_onboarding',
    });
    return { url: accountLink.url };
  }

  const account = await stripe.accounts.create({
    type: 'express',
    email: user.email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: { userId },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeAccountId: account.id },
  });

  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${env.FRONTEND_URL}/payments/connect/refresh`,
    return_url: `${env.FRONTEND_URL}/payments/connect/complete`,
    type: 'account_onboarding',
  });

  return { url: accountLink.url };
}

export async function getConnectStatus(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  if (!user.stripeAccountId) {
    return { connected: false, ready: false };
  }

  if (user.stripeAccountReady) {
    return { connected: true, ready: true };
  }

  // Check with Stripe if onboarding is complete
  const account = await stripe.accounts.retrieve(user.stripeAccountId);
  const ready = account.charges_enabled && account.payouts_enabled;

  if (ready) {
    await prisma.user.update({
      where: { id: userId },
      data: { stripeAccountReady: true },
    });
  }

  return { connected: true, ready: !!ready };
}

// ─── TENANCIES ───────────────────────────────────────────

export async function createTenancy(
  landlordId: string,
  data: { listingId: string; tenantId: string; rentAmount: number; startDate: string },
) {
  // Verify landlord owns the listing
  const listing = await prisma.listing.findUnique({
    where: { id: data.listingId },
  });

  if (!listing) throw new AppError('Listing not found', 404);
  if (listing.ownerId !== landlordId) {
    throw new AppError('Not authorized — you do not own this listing', 403);
  }

  // Verify tenant exists
  const tenant = await prisma.user.findUnique({
    where: { id: data.tenantId },
  });
  if (!tenant) throw new AppError('Tenant not found', 404);

  const tenancy = await prisma.tenancy.create({
    data: {
      listingId: data.listingId,
      tenantId: data.tenantId,
      landlordId,
      rentAmount: data.rentAmount,
      startDate: new Date(data.startDate),
    },
    include: {
      listing: { select: { id: true, title: true, address: true } },
      tenant: { select: { id: true, name: true, email: true } },
      landlord: { select: { id: true, name: true, email: true } },
    },
  });

  return tenancy;
}

export async function getTenancies(userId: string) {
  const tenancies = await prisma.tenancy.findMany({
    where: {
      OR: [{ tenantId: userId }, { landlordId: userId }],
    },
    orderBy: { createdAt: 'desc' },
    include: {
      listing: { select: { id: true, title: true, address: true, city: true } },
      tenant: { select: { id: true, name: true, email: true } },
      landlord: { select: { id: true, name: true, email: true } },
    },
  });

  return tenancies;
}

export async function getTenancy(tenancyId: string, userId: string) {
  const tenancy = await prisma.tenancy.findUnique({
    where: { id: tenancyId },
    include: {
      listing: { select: { id: true, title: true, address: true, city: true } },
      tenant: { select: { id: true, name: true, email: true } },
      landlord: { select: { id: true, name: true, email: true } },
      payments: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });

  if (!tenancy) throw new AppError('Tenancy not found', 404);
  if (tenancy.tenantId !== userId && tenancy.landlordId !== userId) {
    throw new AppError('Not authorized to view this tenancy', 403);
  }

  return tenancy;
}

export async function endTenancy(tenancyId: string, landlordId: string) {
  const tenancy = await prisma.tenancy.findUnique({
    where: { id: tenancyId },
  });

  if (!tenancy) throw new AppError('Tenancy not found', 404);
  if (tenancy.landlordId !== landlordId) {
    throw new AppError('Not authorized to end this tenancy', 403);
  }
  if (tenancy.status === 'ENDED') {
    throw new AppError('Tenancy is already ended', 400);
  }

  const updated = await prisma.tenancy.update({
    where: { id: tenancyId },
    data: {
      status: 'ENDED',
      endDate: new Date(),
    },
    include: {
      listing: { select: { id: true, title: true } },
      tenant: { select: { id: true, name: true } },
      landlord: { select: { id: true, name: true } },
    },
  });

  return updated;
}

// ─── PAYMENTS ────────────────────────────────────────────

export async function initiateRentPayment(
  tenancyId: string,
  tenantId: string,
  paymentMethodId: string,
) {
  const tenancy = await prisma.tenancy.findUnique({
    where: { id: tenancyId },
    include: {
      landlord: { select: { id: true, stripeAccountId: true, stripeAccountReady: true } },
      listing: { select: { id: true, title: true } },
    },
  });

  if (!tenancy) throw new AppError('Tenancy not found', 404);
  if (tenancy.tenantId !== tenantId) {
    throw new AppError('Not authorized — you are not the tenant', 403);
  }
  if (tenancy.status !== 'ACTIVE') {
    throw new AppError('Tenancy is not active', 400);
  }

  if (!tenancy.landlord.stripeAccountId || !tenancy.landlord.stripeAccountReady) {
    throw new AppError('Landlord has not completed Stripe onboarding', 400);
  }

  // Calculate amounts
  const amount = tenancy.rentAmount;
  const commission = Math.round(amount * 0.02);
  const netAmount = amount - commission;

  // Period for this payment
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const dueDate = new Date(now.getFullYear(), now.getMonth(), 5);

  // Create payment record
  const payment = await prisma.payment.create({
    data: {
      tenancyId,
      tenantId,
      landlordId: tenancy.landlordId,
      amount,
      commissionAmount: commission,
      netAmount,
      status: 'PROCESSING',
      periodStart,
      periodEnd,
      dueDate,
    },
  });

  // Ensure tenant has a Stripe customer
  let tenant = await prisma.user.findUnique({ where: { id: tenantId } });
  if (!tenant!.stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: tenant!.email,
      metadata: { userId: tenantId },
    });
    await prisma.user.update({
      where: { id: tenantId },
      data: { stripeCustomerId: customer.id },
    });
    tenant = await prisma.user.findUnique({ where: { id: tenantId } });
  }

  // Create Stripe PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'eur',
    customer: tenant!.stripeCustomerId!,
    payment_method: paymentMethodId,
    confirm: true,
    application_fee_amount: commission,
    transfer_data: {
      destination: tenancy.landlord.stripeAccountId!,
    },
    metadata: {
      paymentId: payment.id,
      tenancyId,
      tenantId,
      landlordId: tenancy.landlordId,
    },
    return_url: `${env.FRONTEND_URL}/payments/complete`,
  });

  // Update payment with Stripe ID
  await prisma.payment.update({
    where: { id: payment.id },
    data: { stripePaymentIntentId: paymentIntent.id },
  });

  // If requires additional action (3D Secure)
  if (paymentIntent.status === 'requires_action') {
    return {
      payment: { id: payment.id, status: 'PROCESSING', amount, commission, netAmount },
      requiresAction: true,
      clientSecret: paymentIntent.client_secret,
    };
  }

  return {
    payment: { id: payment.id, status: 'PROCESSING', amount, commission, netAmount },
    requiresAction: false,
  };
}

export async function getPaymentHistory(userId: string, role?: 'tenant' | 'landlord') {
  const where: any = {};

  if (role === 'tenant') {
    where.tenantId = userId;
  } else if (role === 'landlord') {
    where.landlordId = userId;
  } else {
    where.OR = [{ tenantId: userId }, { landlordId: userId }];
  }

  const payments = await prisma.payment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      tenancy: {
        include: {
          listing: { select: { id: true, title: true, address: true } },
        },
      },
      tenant: { select: { id: true, name: true } },
      landlord: { select: { id: true, name: true } },
    },
  });

  return payments;
}

export async function getPayment(paymentId: string, userId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      tenancy: {
        include: {
          listing: { select: { id: true, title: true, address: true } },
        },
      },
      tenant: { select: { id: true, name: true, email: true } },
      landlord: { select: { id: true, name: true, email: true } },
    },
  });

  if (!payment) throw new AppError('Payment not found', 404);
  if (payment.tenantId !== userId && payment.landlordId !== userId) {
    throw new AppError('Not authorized to view this payment', 403);
  }

  return payment;
}

export async function getReceipt(paymentId: string, userId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) throw new AppError('Payment not found', 404);
  if (payment.tenantId !== userId && payment.landlordId !== userId) {
    throw new AppError('Not authorized to view this receipt', 403);
  }
  if (!payment.receiptUrl) {
    throw new AppError('Receipt not available yet', 404);
  }

  return { receiptUrl: payment.receiptUrl };
}

export async function markOverdue(tenancyId: string, landlordId: string) {
  const tenancy = await prisma.tenancy.findUnique({
    where: { id: tenancyId },
  });

  if (!tenancy) throw new AppError('Tenancy not found', 404);
  if (tenancy.landlordId !== landlordId) {
    throw new AppError('Not authorized to mark payments overdue', 403);
  }

  const latestPending = await prisma.payment.findFirst({
    where: {
      tenancyId,
      status: 'PENDING',
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!latestPending) {
    throw new AppError('No pending payment found', 404);
  }

  const updated = await prisma.payment.update({
    where: { id: latestPending.id },
    data: { status: 'OVERDUE' },
  });

  return updated;
}

// ─── WEBHOOK HANDLER ─────────────────────────────────────

export async function handleWebhookEvent(event: Stripe.Event) {
  const io = getIO();

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const paymentId = paymentIntent.metadata.paymentId;
      if (!paymentId) break;

      const receiptUrl = paymentIntent.latest_charge
        ? (
            await stripe.charges.retrieve(paymentIntent.latest_charge as string)
          ).receipt_url ?? undefined
        : undefined;

      const payment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'COMPLETED',
          paidAt: new Date(),
          receiptUrl: receiptUrl ?? null,
        },
        include: {
          tenancy: {
            include: { listing: { select: { title: true } } },
          },
        },
      });

      // Notify tenant — payment confirmed
      await prisma.notification.create({
        data: {
          userId: payment.tenantId,
          type: 'PAYMENT_CONFIRMED',
          title: 'Payment confirmed',
          body: `Your rent payment of €${(payment.amount / 100).toFixed(2)} for ${payment.tenancy.listing.title} has been confirmed.`,
          data: { paymentId: payment.id, tenancyId: payment.tenancyId },
        },
      });

      // Notify landlord — payment received
      await prisma.notification.create({
        data: {
          userId: payment.landlordId,
          type: 'PAYMENT_RECEIVED',
          title: 'Rent payment received',
          body: `You received a rent payment of €${(payment.netAmount / 100).toFixed(2)} for ${payment.tenancy.listing.title}.`,
          data: { paymentId: payment.id, tenancyId: payment.tenancyId },
        },
      });

      io.to(`user:${payment.tenantId}`).emit('payment:confirmed', {
        paymentId: payment.id,
        status: 'COMPLETED',
      });

      io.to(`user:${payment.landlordId}`).emit('payment:received', {
        paymentId: payment.id,
        amount: payment.netAmount,
        status: 'COMPLETED',
      });

      break;
    }

    case 'account.updated': {
      const account = event.data.object as Stripe.Account;
      const ready = account.charges_enabled && account.payouts_enabled;

      if (ready && account.metadata?.userId) {
        await prisma.user.update({
          where: { id: account.metadata.userId },
          data: { stripeAccountReady: true },
        });
      }

      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const paymentId = paymentIntent.metadata.paymentId;
      if (!paymentId) break;

      const payment = await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'FAILED' },
        include: {
          tenancy: {
            include: { listing: { select: { title: true } } },
          },
        },
      });

      // Notify tenant of failure
      await prisma.notification.create({
        data: {
          userId: payment.tenantId,
          type: 'RENT_DUE',
          title: 'Payment failed',
          body: `Your rent payment for ${payment.tenancy.listing.title} has failed. Please try again.`,
          data: { paymentId: payment.id, tenancyId: payment.tenancyId },
        },
      });

      io.to(`user:${payment.tenantId}`).emit('payment:failed', {
        paymentId: payment.id,
        status: 'FAILED',
      });

      break;
    }
  }
}
