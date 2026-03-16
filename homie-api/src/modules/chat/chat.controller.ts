import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types';
import * as chatService from './chat.service';

export async function getConversations(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const conversations = await chatService.getConversations(req.userId!);
    res.json(conversations);
  } catch (err) {
    next(err);
  }
}

export async function getMessages(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const cursor = req.query.cursor as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

    const result = await chatService.getMessages(id, req.userId!, cursor, limit);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const { content } = req.body;

    const message = await chatService.sendMessage(id, req.userId!, content);
    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const result = await chatService.markAsRead(id, req.userId!);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
