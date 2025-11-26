import { ZodSchema } from "zod";

export function validate<T>(data: unknown, schema: ZodSchema<T>): { success: boolean; data?: T; error?: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error.message };
  }
  return { success: true, data: result.data };
}
