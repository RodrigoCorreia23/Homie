import { Request, Response, NextFunction } from 'express';
import { stripe } from '../../config/stripe';
import { env } from '../../config/env';
import * as paymentService from './payment.service';

export async function handleStripeWebhook(req: Request, res: Response, next: NextFunction) {
  const sig = req.headers['stripe-signature'] as string;

  if (!sig) {
    res.status(400).json({ error: 'Missing stripe-signature header' });
    return;
  }

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
    await paymentService.handleWebhookEvent(event);
    res.json({ received: true });
  } catch (err: any) {
    console.error('Webhook error:', err.message);
    res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }
}
