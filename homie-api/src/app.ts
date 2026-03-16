import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './shared/middleware/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import listingRoutes from './modules/listing/listing.routes';
import interestRoutes from './modules/interest/interest.routes';
import chatRoutes from './modules/chat/chat.routes';
import favoriteRoutes from './modules/favorite/favorite.routes';
import notificationRoutes from './modules/notification/notification.routes';
import { paymentRoutes, stripeWebhookRoute } from './modules/payment/payment.routes';

const app = express();

// Stripe webhook needs raw body — must be before express.json()
app.use('/api/payments/webhook', stripeWebhookRoute);

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/interests', interestRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);

// Error handler
app.use(errorHandler);

export default app;
