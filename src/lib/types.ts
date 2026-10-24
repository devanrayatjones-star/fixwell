import type { WorkingHours } from "./availability";
import type { TradeId } from "./trades";

export type TradespersonStatus = "pending" | "approved" | "rejected" | "suspended";
export type BookingStatus = "pending" | "accepted" | "declined" | "cancelled" | "completed" | "expired";

export type Tradesperson = {
  id: string;
  user_id: string | null;
  slug: string;
  status: TradespersonStatus;
  is_test: boolean;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  trade: TradeId;
  bio: string;
  base_area: string;
  postcode_areas: string[];
  hourly_rate_pence: number;
  callout_fee_pence: number;
  working_hours: WorkingHours;
  gas_safe_number: string | null;
  niceic_napit_number: string | null;
  imi_number: string | null;
  other_accreditations: string | null;
  insurance_path: string | null;
  insurance_expiry: string | null;
  photo_paths: string[];
  admin_notes: string;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
};

export type Service = {
  id: string;
  tradesperson_id: string;
  name: string;
  description: string;
  estimated_hours: number;
  sort_order: number;
};

export type Booking = {
  id: string;
  reference: string;
  tradesperson_id: string;
  service_id: string | null;
  service_name: string;
  estimated_hours: number;
  hourly_rate_pence: number;
  callout_fee_pence: number;
  estimate_pence: number;
  starts_at: string;
  ends_at: string;
  status: BookingStatus;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  address: string | null;
  postcode: string | null;
  vehicle_reg: string | null;
  problem_description: string | null;
  early_start_requested: boolean;
  terms_accepted_at: string;
  decline_reason: string | null;
  cancel_reason: string | null;
  cancelled_by: "customer" | "tradesperson" | "admin" | null;
  created_at: string;
  responded_at: string | null;
  cancelled_at: string | null;
  completed_at: string | null;
};

export type Review = {
  id: string;
  booking_id: string;
  tradesperson_id: string;
  rating: number;
  comment: string;
  reviewer_name: string;
  hidden: boolean;
  created_at: string;
};

/** Columns that are safe to show the public. Never includes admin notes, insurance or private contact details. */
export const PUBLIC_TRADESPERSON_COLUMNS =
  "id, slug, status, is_test, business_name, trade, bio, base_area, postcode_areas, hourly_rate_pence, callout_fee_pence, working_hours, gas_safe_number, niceic_napit_number, imi_number, other_accreditations, photo_paths, created_at";

export type PublicTradesperson = Pick<
  Tradesperson,
  | "id"
  | "slug"
  | "status"
  | "is_test"
  | "business_name"
  | "trade"
  | "bio"
  | "base_area"
  | "postcode_areas"
  | "hourly_rate_pence"
  | "callout_fee_pence"
  | "working_hours"
  | "gas_safe_number"
  | "niceic_napit_number"
  | "imi_number"
  | "other_accreditations"
  | "photo_paths"
  | "created_at"
>;

export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Awaiting confirmation",
  accepted: "Confirmed",
  declined: "Declined",
  cancelled: "Cancelled",
  completed: "Completed",
  expired: "Not confirmed in time",
};
