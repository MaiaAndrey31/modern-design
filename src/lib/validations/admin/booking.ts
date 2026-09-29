import { z } from "zod";

export const bookingSettingsSchema = z.object({
  heading: z.string().trim().min(1, "Informe o título."),
  intro: z.string().trim().min(1, "Informe o texto de introdução."),
  notifyEmail: z.string().trim().email("E-mail inválido.").optional().or(z.literal("")),
  isFormEnabled: z.boolean().optional(),
});
