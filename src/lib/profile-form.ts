// Reading and checking the tradesperson profile form (used by "Join Fixwell"
// and the dashboard's profile page), plus file upload helpers.
import "server-only";
import { z } from "zod";
import { isValidWorkingHours, type WorkingHours } from "./availability";
import { MAX_UPLOAD_BYTES } from "./config";
import { parsePostcodeAreas } from "./postcode";
import { db } from "./supabase/admin";
import { randomSuffix } from "./tokens";
import { TRADE_IDS } from "./trades";
import { fieldErrors, phoneField } from "./validation";

const pounds = (label: string) =>
  z
    .string()
    .trim()
    .transform((v, ctx) => {
      const n = Number(v.replace(/[£,\s]/g, ""));
      if (!v || !Number.isFinite(n) || n < 0 || n > 1000) {
        ctx.addIssue({ code: "custom", message: `Enter ${label} in pounds, e.g. 45 or 45.50` });
        return z.NEVER;
      }
      return Math.round(n * 100);
    });

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || null);

const profileSchema = z.object({
  business_name: z.string().trim().min(2, "Enter your business name").max(80),
  contact_name: z.string().trim().min(2, "Enter your name").max(80),
  phone: phoneField,
  trade: z.enum(TRADE_IDS, { message: "Choose your trade" }),
  base_area: z.string().trim().min(2, "Enter the town or area you're based in").max(60),
  postcode_areas: z.string().trim().min(1, "List the postcode districts you cover, e.g. BS1, BS2"),
  hourly_rate: pounds("your hourly rate"),
  callout_fee: pounds("your call-out fee"),
  bio: z.string().trim().max(1500).optional().default(""),
  gas_safe_number: optionalText(30),
  niceic_napit_number: optionalText(30),
  imi_number: optionalText(30),
  other_accreditations: optionalText(300),
  insurance_expiry: z
    .string()
    .optional()
    .transform((v) => v || null)
    .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), "Enter a valid date"),
});

export type ProfileInput = Omit<z.infer<typeof profileSchema>, "postcode_areas" | "hourly_rate" | "callout_fee"> & {
  postcode_areas: string[];
  hourly_rate_pence: number;
  callout_fee_pence: number;
};

export type ServiceInput = { id: string | null; name: string; description: string; estimated_hours: number };

export function parseProfile(formData: FormData): { data?: ProfileInput; errors: Record<string, string> } {
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const { postcode_areas, hourly_rate, callout_fee, ...rest } = parsed.data;
  const errors: Record<string, string> = {};

  const { areas, invalid } = parsePostcodeAreas(postcode_areas);
  if (invalid.length) errors.postcode_areas = `These don't look like postcode districts: ${invalid.join(", ")}. Use e.g. BS1, BS16 or BS for the whole area.`;
  else if (!areas.length) errors.postcode_areas = "List the postcode districts you cover";
  else if (areas.length > 60) errors.postcode_areas = "That's a lot of areas. Use the area letters (e.g. BS) to cover a whole area.";

  if (rest.trade === "gas_engineer" && !rest.gas_safe_number) errors.gas_safe_number = "Gas engineers must be Gas Safe registered. Enter your registration number.";
  if (rest.trade === "electrician" && !rest.niceic_napit_number) errors.niceic_napit_number = "Enter your NICEIC or NAPIT registration number.";

  if (Object.keys(errors).length) return { errors };
  return { data: { ...rest, postcode_areas: areas, hourly_rate_pence: hourly_rate, callout_fee_pence: callout_fee }, errors: {} };
}

/** Services arrive as parallel lists: service_name[], service_hours[], … */
export function parseServices(formData: FormData): { data?: ServiceInput[]; errors: Record<string, string> } {
  const names = formData.getAll("service_name").map(String);
  const descriptions = formData.getAll("service_description").map(String);
  const hours = formData.getAll("service_hours").map(String);
  const ids = formData.getAll("service_id").map(String);
  const services: ServiceInput[] = [];

  for (let i = 0; i < names.length; i++) {
    const name = names[i].trim();
    const h = Number(hours[i]);
    if (!name && !hours[i]?.trim()) continue; // empty row
    if (!name || name.length > 80) return { errors: { services: `Service ${i + 1}: enter a name (up to 80 characters)` } };
    if (!Number.isFinite(h) || h <= 0 || h > 10) return { errors: { services: `"${name}": estimated hours must be between 0.5 and 10` } };
    services.push({
      id: /^[0-9a-f-]{36}$/.test(ids[i] ?? "") ? ids[i] : null,
      name,
      description: (descriptions[i] ?? "").trim().slice(0, 200),
      estimated_hours: Math.round(h * 2) / 2 || 0.5,
    });
  }
  if (!services.length) return { errors: { services: "Add at least one service customers can book" } };
  if (services.length > 30) return { errors: { services: "Up to 30 services, please" } };
  return { data: services, errors: {} };
}

/** Working hours arrive as wh_1_on, wh_1_start, wh_1_end … for each weekday. */
export function parseWorkingHours(formData: FormData): { data?: WorkingHours; errors: Record<string, string> } {
  const hours: WorkingHours = {};
  for (let d = 1; d <= 7; d++) {
    if (formData.get(`wh_${d}_on`) !== "on") continue;
    hours[String(d)] = { start: String(formData.get(`wh_${d}_start`) ?? ""), end: String(formData.get(`wh_${d}_end`) ?? "") };
  }
  if (!Object.keys(hours).length) return { errors: { working_hours: "Choose at least one working day" } };
  if (!isValidWorkingHours(hours)) return { errors: { working_hours: "Check your hours: each day's finish time must be after its start time" } };
  return { data: hours, errors: {} };
}

// ---- Uploads -------------------------------------------------------------

const INSURANCE_TYPES: Record<string, string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png" };
const PHOTO_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export function fileFrom(formData: FormData, name: string): File | null {
  const f = formData.get(name);
  return f instanceof File && f.size > 0 ? f : null;
}

export function checkFile(file: File, kind: "insurance" | "photo"): string | null {
  const types = kind === "insurance" ? INSURANCE_TYPES : PHOTO_TYPES;
  if (!types[file.type]) return kind === "insurance" ? "Upload a PDF, JPG or PNG" : "Upload a JPG, PNG or WebP photo";
  if (file.size > MAX_UPLOAD_BYTES) return "That file is over 4 MB. Please upload a smaller one.";
  return null;
}

export async function uploadFile(file: File, kind: "insurance" | "photo", tradespersonId: string): Promise<string> {
  const ext = (kind === "insurance" ? INSURANCE_TYPES : PHOTO_TYPES)[file.type];
  const path = `${tradespersonId}/${Date.now()}-${randomSuffix()}.${ext}`;
  const { error } = await db()
    .storage.from(kind === "insurance" ? "insurance" : "photos")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return path;
}
