import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types';
import * as interestService from './interest.service';

export async function sendInterest(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { listingId, message } = req.body;
    const interest = await interestService.sendInterest(req.userId!, listingId, message);
    res.status(201).json(interest);
  } catch (err) {
    next(err);
  }
}

export async function getSent(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const interests = await interestService.getSentInterests(req.userId!);
    res.json(interests);
  } catch (err) {
    next(err);
  }
}

export async function getReceived(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const interests = await interestService.getReceivedInterests(req.userId!);
    res.json(interests);
  } catch (err) {
    next(err);
  }
}

export async function accept(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await interestService.acceptInterest(req.params.id as string, req.userId!);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function reject(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await interestService.rejectInterest(req.params.id as string, req.userId!);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
