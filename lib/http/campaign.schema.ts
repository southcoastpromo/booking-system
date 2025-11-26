import { z } from "zod";

export const campaignSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  budget: z.number().positive(),
});

export type Campaign = z.infer<typeof campaignSchema>;
