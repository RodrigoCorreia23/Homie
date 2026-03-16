import { Router } from 'express';
import express from 'express';
import { authenticate } from '../auth/auth.middleware';
import { validateRequest } from '../../shared/middleware/validateRequest';
import { createTenancySchema, payRentSchema } from './payment.validation';
import * as paymentController from './payment.controller';
import { handleStripeWebhook } from './payment.webhook';

// Webhook route — needs raw body, mounted BEFORE express.json() in app.ts
export const stripeWebhookRoute = Router();
stripeWebhookRoute.post('/', express.raw({ type: 'application/json' }), handleStripeWebhook);

// Main payment routes — all require authentication
const router = Router();
router.use(authenticate);

// Stripe Connect onboarding
router.post('/connect/onboard', paymentController.onboard);
router.get('/connect/status', paymentController.connectStatus);

// Tenancies
router.post('/tenancies', validateRequest(createTenancySchema), paymentController.createTenancy);
router.get('/tenancies', paymentController.getTenancies);
router.get('/tenancies/:id', paymentController.getTenancy);
router.patch('/tenancies/:id/end', paymentController.endTenancy);
router.post('/tenancies/:id/pay', validateRequest(payRentSchema), paymentController.payRent);
router.patch('/tenancies/:id/mark-overdue', paymentController.markOverdue);

// Payment history & details
router.get('/history', paymentController.getHistory);
router.get('/:id', paymentController.getPayment);
router.get('/:id/receipt', paymentController.getReceipt);

export const paymentRoutes = router;
