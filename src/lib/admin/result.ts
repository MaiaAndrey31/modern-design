import type { ZodError } from "zod";
import type { ActionState } from "@/lib/validations/admin/actionState";

/**
 * Zod error → ActionState. Nested paths are flattened to dotted keys
 * ("cta.target", "places.routeToPlaceId") so form fields can look up their
 * own message with `state.fieldErrors?.["cta.target"]`.
 */
export function invalid(error: ZodError, message = "Revise os campos destacados."): ActionState {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_form";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return { ok: false, error: message, fieldErrors };
}

export const saved = (): ActionState => ({ ok: true });

export const failed = (error: string): ActionState => ({ ok: false, error });

/** First error for a field key (dotted), for form components. */
export function fieldError(state: ActionState | undefined, key: string): string | undefined {
  return state?.fieldErrors?.[key]?.[0];
}
