import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types';
import * as notificationService from './notification.service';

export async function getAll(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    const result = await notificationService.getNotifications(req.userId!, page, limit);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const notification = await notificationService.markAsRead(id, req.userId!);
    res.json(notification);
  } catch (err) {
    next(err);
  }
}

export async function markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await notificationService.markAllAsRead(req.userId!);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getUnreadCount(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await notificationService.getUnreadCount(req.userId!);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
