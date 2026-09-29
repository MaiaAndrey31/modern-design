import { z } from "zod";

export const bookingSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name."),
  company: z.string().trim().optional(),
  whatsapp: z
    .string()
    .trim()
    .min(8, "Enter a valid WhatsApp number.")
    .regex(/^[\d\s()+-]+$/, "Use digits only (with country code)."),
  email: z.string().trim().email("Enter a valid email address."),
  city: z.string().trim().min(2, "Enter the event city."),
  eventType: z.string().trim().min(2, "Tell us the type of event."),
  eventDate: z.string().trim().optional(),
  message: z.string().trim().max(2000).optional(),
});

export type BookingSchema = z.infer<typeof bookingSchema>;
