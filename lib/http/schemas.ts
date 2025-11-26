import { z } from "zod";

// Example: Customer Info Schema
export const customerInfoSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export type CustomerInfo = z.infer<typeof customerInfoSchema>;
