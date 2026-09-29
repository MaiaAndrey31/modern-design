/**
 * FormData readers for admin Server Actions. They only EXTRACT raw values —
 * validation and normalisation always happen afterwards in the Zod schema
 * (src/lib/validations/cms/*). Never trust anything read here directly.
 */

/** A text field ("" when absent or not a string, e.g. a File). */
export function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

/** A checkbox: present with value "on" → true. */
export function bool(formData: FormData, name: string): boolean {
  return formData.get(name) === "on";
}

/** A textarea holding one item per line → array (blank lines kept; the schema drops them). */
export function lines(formData: FormData, name: string): string[] {
  return text(formData, name).split(/\r?\n/);
}

/** Every string value for a repeated field name (e.g. multi-selects). */
export function all(formData: FormData, name: string): string[] {
  return formData.getAll(name).filter((v): v is string => typeof v === "string" && v !== "");
}

/** PT/EN pair for a LocalizedField named `base` → `${base}Pt` / `${base}En`. */
export function localizedPair(formData: FormData, base: string) {
  return { [`${base}Pt`]: text(formData, `${base}Pt`), [`${base}En`]: text(formData, `${base}En`) };
}

/**
 * Link fields rendered by <LinkField prefix="cta"> → { labelPt, labelEn, type, target }.
 * `type` is "" when the link is disabled/unset.
 */
export function link(formData: FormData, prefix: string) {
  const type = text(formData, `${prefix}Type`);
  return {
    labelPt: text(formData, `${prefix}LabelPt`),
    labelEn: text(formData, `${prefix}LabelEn`),
    type: type === "SECTION" || type === "ROUTE" || type === "EXTERNAL" ? type : null,
    target: text(formData, `${prefix}Target`),
  };
}
