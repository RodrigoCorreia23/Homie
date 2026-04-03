import { z } from 'zod';

export const sendInterestSchema = z.object({
  listingId: z.string().uuid(),
  message: z.string().max(500).optional(),
});
