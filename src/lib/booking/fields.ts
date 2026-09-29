/**
 * Booking form fields — defined in code (their validation lives in
 * src/lib/validations/booking.ts). Only their visible labels are editable,
 * through BookingSection.fieldLabels, whose shape is derived from this list.
 */

export const BOOKING_FORM_FIELDS = [
  "name",
  "company",
  "whatsapp",
  "email",
  "city",
  "eventType",
  "eventDate",
  "message",
] as const;

export type BookingFormField = (typeof BOOKING_FORM_FIELDS)[number];

export type BookingFieldLabels = Record<BookingFormField, { pt: string; en?: string }>;
