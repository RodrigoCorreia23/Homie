import { z } from 'zod';

export const createTenancySchema = z.object({
  listingId: z.string().uuid(),
  tenantId: z.string().uuid(),
  rentAmount: z.number().int().positive(),
  startDate: z.string().datetime(),
});

export const payRentSchema = z.object({
  paymentMethodId: z.string().min(1),
});
