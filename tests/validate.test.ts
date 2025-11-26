import { describe, expect, it } from "vitest";
import { customerInfoSchema } from "../lib/http/schemas";
import { validate } from "../lib/http/validate";

describe("validate()", () => {
  it("accepts valid customer data", () => {
    const result = validate({ name: "Jane", email: "jane@example.com" }, customerInfoSchema);
    expect(result.success).toBe(true);
    expect(result.data?.name).toBe("Jane");
  });

  it("rejects invalid email", () => {
    const result = validate({ name: "Jane", email: "not-an-email" }, customerInfoSchema);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/email/i);
  });
});
