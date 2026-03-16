import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types';
import * as paymentService from './payment.service';

export async function onboard(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await paymentService.createConnectAccount(req.userId!);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function connectStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const status = await paymentService.getConnectStatus(req.userId!);
    res.json(status);
  } catch (err) {
    next(err);
  }
}

export async function createTenancy(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const tenancy = await paymentService.createTenancy(req.userId!, req.body);
    res.status(201).json(tenancy);
  } catch (err) {
    next(err);
  }
}

export async function getTenancies(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const tenancies = await paymentService.getTenancies(req.userId!);
    res.json(tenancies);
  } catch (err) {
    next(err);
  }
}

export async function getTenancy(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const tenancy = await paymentService.getTenancy(req.params.id as string, req.userId!);
    res.json(tenancy);
  } catch (err) {
    next(err);
  }
}

export async function endTenancy(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const tenancy = await paymentService.endTenancy(req.params.id as string, req.userId!);
    res.json(tenancy);
  } catch (err) {
    next(err);
  }
}

export async function payRent(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await paymentService.initiateRentPayment(
      req.params.id as string,
      req.userId!,
      req.body.paymentMethodId,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getHistory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const role = req.query.role as 'tenant' | 'landlord' | undefined;
    const payments = await paymentService.getPaymentHistory(req.userId!, role);
    res.json(payments);
  } catch (err) {
    next(err);
  }
}

export async function getPayment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const payment = await paymentService.getPayment(req.params.id as string, req.userId!);
    res.json(payment);
  } catch (err) {
    next(err);
  }
}

export async function getReceipt(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const receipt = await paymentService.getReceipt(req.params.id as string, req.userId!);
    res.json(receipt);
  } catch (err) {
    next(err);
  }
}

export async function markOverdue(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const payment = await paymentService.markOverdue(req.params.id as string, req.userId!);
    res.json(payment);
  } catch (err) {
    next(err);
  }
}
