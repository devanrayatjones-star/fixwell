// Shared form checks for UK phone numbers, vehicle registrations etc.
import { z } from "zod";
import { normalisePostcode } from "./postcode";

export function normalisePhone(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, "");
  const national = digits.startsWith("+44") ? "0" + digits.slice(3) : digits.startsWith("0044") ? "0" + digits.slice(4) : digits;
  return /^0\d{9,10}$/.test(national) ? national : null;
}

/** Loose UK reg check: 2–8 letters/numbers, e.g. "AB12 CDE", "A123 BCD", "K1". */
export function normaliseVehicleReg(input: string): string | null {
  const c = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return /^[A-Z0-9]{2,8}$/.test(c) && /[A-Z]/.test(c) && /\d/.test(c) ? c : null;
}

export const phoneField = z
  .string()
  .trim()
  .transform((v, ctx) => {
    const p = normalisePhone(v);
    if (!p) {
      ctx.addIssue({ code: "custom", message: "Enter a UK phone number, like 07700 900123" });
      return z.NEVER;
    }
    return p;
  });

export const postcodeField = z
  .string()
  .trim()
  .transform((v, ctx) => {
    const p = normalisePostcode(v);
    if (!p) {
      ctx.addIssue({ code: "custom", message: "Enter a full UK postcode, like BS1 4DJ" });
      return z.NEVER;
    }
    return p;
  });

export const emailField = z.string().trim().toLowerCase().email("Enter a valid email address").max(200);

/** Turns zod errors into { fieldName: "message" } for showing next to inputs. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
};
