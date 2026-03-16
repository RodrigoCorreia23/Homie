import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../shared/middleware/errorHandler';
import { getIO } from '../../socket';

export async function createNotification(
  userId: string,
  type: 'NEW_INTEREST' | 'INTEREST_ACCEPTED' | 'NEW_MESSAGE' | 'NEW_MATCHING_LISTING' | 'RENT_DUE' | 'RENT_OVERDUE' | 'PAYMENT_RECEIVED' | 'PAYMENT_CONFIRMED',
  title: string,
  body?: string,
  data?: Record<string, unknown>
) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      data: (data as Prisma.InputJsonObject) ?? undefined,
    },
  });

  const io = getIO();

  // Emit the new notification
  io.to(`user:${userId}`).emit('notification:new', notification);

  // Emit updated unread count
  const unreadCount = await prisma.notification.count({
    where: { userId, read: false },
  });
  io.to(`user:${userId}`).emit('notification:count', { unreadCount });

  return notification;
}

export async function getNotifications(userId: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { userId } }),
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function markAsRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  if (notification.userId !== userId) {
    throw new AppError('You do not own this notification', 403);
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });

  return updated;
}

export async function markAllAsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });

  return { success: true };
}

export async function getUnreadCount(userId: string) {
  const count = await prisma.notification.count({
    where: { userId, read: false },
  });

  return { unreadCount: count };
}
