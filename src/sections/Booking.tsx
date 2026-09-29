"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { bookingSchema, type BookingSchema } from "@/lib/validations/booking";
import type { BookingSettingsDto } from "@/lib/content/dto";
import { MagneticButton } from "@/components/MagneticButton";
import { track } from "@/lib/analytics";
import { useLocale } from "@/i18n/LocaleProvider";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const FIELDS: {
  name: Exclude<keyof BookingSchema, "message">;
  type?: string;
  half?: boolean;
  required?: boolean;
  autoComplete?: string;
}[] = [
  { name: "name", required: true, half: true, autoComplete: "name" },
  { name: "company", half: true, autoComplete: "organization" },
  { name: "whatsapp", type: "tel", required: true, half: true, autoComplete: "tel" },
  { name: "email", type: "email", required: true, half: true, autoComplete: "email" },
  { name: "city", required: true, half: true, autoComplete: "address-level2" },
  { name: "eventType", required: true, half: true },
  { name: "eventDate", type: "date", half: true },
];

/** Splits a headline into two visually balanced lines for the mask reveal. */
function balance(text: string): string[] {
  const words = text.split(/\s+/);
  if (words.length < 3) return [text];
  let best = 1;
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const diff = Math.abs(words.slice(0, i).join(" ").length - words.slice(i).join(" ").length);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

// Bottom-rule fields: the label warms and a bronze line draws in on focus.
const labelCls =
  "block text-xs uppercase tracking-[0.2em] text-fg-muted transition-colors duration-300 group-focus-within/field:text-accent";
const inputCls =
  "peer mt-2 w-full border-b border-border bg-transparent py-3 text-fg outline-none transition-colors duration-300 hover:border-fg/40 aria-[invalid=true]:border-red-400/70";
const focusLine =
  "pointer-events-none absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 bg-accent transition-transform duration-500 ease-[var(--ease-out-expo)] peer-focus:scale-x-100";

export function Booking({ settings }: { settings: BookingSettingsDto }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<BookingSchema>({ resolver: zodResolver(bookingSchema) });

  const honeypotRef = useRef<HTMLInputElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const { t, tc } = useLocale();
  const reduced = usePrefersReducedMotion();
  const headingLines = balance(tc(settings.heading));

  // The calm chapter: one headline reveal, one soft entrance for the form — then stillness.
  useGSAP(
    () => {
      if (!sectionRef.current || reduced) return;
      const trigger = { trigger: sectionRef.current, start: "top 70%", once: true };
      gsap.fromTo(".bk-line", { yPercent: 110, y: 0 }, { yPercent: 0, duration: 1.3, stagger: 0.12, ease: "expo.out", scrollTrigger: trigger });
      gsap.fromTo(".bk-fade", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.1, delay: 0.35, ease: "expo.out", scrollTrigger: trigger });
    },
    { scope: sectionRef, dependencies: [reduced], revertOnUpdate: true }
  );

  const errorText = (name: keyof BookingSchema) => {
    const message = errors[name]?.message;
    return typeof message === "string" ? tc(message) : undefined;
  };

  const onSubmit = async (data: BookingSchema) => {
    setStatus("loading");
    track("booking_submit");
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, company_website: honeypotRef.current?.value ?? "" }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { errors?: Record<string, string[]> } | null;
        if (body?.errors) {
          for (const [field, messages] of Object.entries(body.errors)) {
            if (messages?.[0]) setError(field as keyof BookingSchema, { message: messages[0] });
          }
        }
        throw new Error("Request failed");
      }
      setStatus("success");
      reset();
    } catch {
      setStatus("error");
    }
  };

  return (
    <section id="booking" ref={sectionRef} aria-label={tc(settings.eyebrow)} className="relative border-t border-border py-[var(--section-padding-y)]">
      <div className="container-edit grid grid-cols-1 gap-16 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <span className="bk-fade eyebrow block">{tc(settings.eyebrow)}</span>
          <h2 className="mt-4 font-display uppercase leading-[0.95] tracking-tight" style={{ fontSize: "var(--font-size-h2)" }}>
            {headingLines.map((line, i) => (
              <span key={i} className="line-mask">
                <span className="bk-line">{line}</span>
              </span>
            ))}
          </h2>
          <p className="bk-fade mt-6 max-w-sm text-fg-muted" style={{ fontSize: "var(--font-size-body)" }}>
            {tc(settings.intro)}
          </p>
        </div>

        <div className="bk-fade lg:col-span-7">
          {!settings.isFormEnabled ? (
            <p className="text-fg-muted">{t.booking.paused}</p>
          ) : status === "success" ? (
            <div role="status" className="relative border border-border p-10 md:p-14">
              <span aria-hidden="true" className="bk-draw absolute left-0 top-0 h-px w-full origin-left bg-accent" />
              <p className="font-display text-2xl uppercase tracking-tight md:text-3xl">{tc(settings.successTitle)}</p>
              <p className="mt-3 text-fg-muted">{tc(settings.successMessage)}</p>
              <button onClick={() => setStatus("idle")} className="mt-8 flex min-h-11 items-center gap-3 text-xs uppercase tracking-[0.25em] text-accent">
                <span className="text-roll" data-text={t.booking.sendAnother}>
                  <span>{t.booking.sendAnother}</span>
                </span>
              </button>
            </div>
          ) : (
            <form onSubmit={(e) => handleSubmit(onSubmit)(e)} noValidate className="grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2">
              {/* Honeypot — invisible to real visitors, tabIndex/autoComplete off; a filled value signals a bot. */}
              <div className="absolute left-[-9999px]" aria-hidden="true">
                <input ref={honeypotRef} type="text" name="company_website" tabIndex={-1} autoComplete="off" />
              </div>
              {FIELDS.map((field) => (
                <div key={field.name} className={`group/field ${field.half ? "sm:col-span-1" : "sm:col-span-2"}`}>
                  <label htmlFor={field.name} className={labelCls}>
                    {t.booking.fields[field.name]} {field.required && <span aria-hidden="true">*</span>}
                  </label>
                  <div className="relative">
                    <input
                      id={field.name}
                      type={field.type ?? "text"}
                      autoComplete={field.autoComplete}
                      aria-required={field.required || undefined}
                      aria-invalid={!!errors[field.name]}
                      aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
                      className={inputCls}
                      {...register(field.name)}
                    />
                    <span aria-hidden="true" className={focusLine} />
                  </div>
                  {errors[field.name] && (
                    <p id={`${field.name}-error`} className="mt-2 text-xs text-red-400">
                      {errorText(field.name)}
                    </p>
                  )}
                </div>
              ))}

              <div className="group/field sm:col-span-2">
                <label htmlFor="message" className={labelCls}>
                  {t.booking.fields.message}
                </label>
                <div className="relative">
                  <textarea id="message" rows={4} className={`${inputCls} resize-none`} {...register("message")} />
                  <span aria-hidden="true" className={focusLine} />
                </div>
              </div>

              <div className="sm:col-span-2">
                {status === "error" && (
                  <p role="alert" className="mb-5 border-l border-red-400/70 pl-4 text-sm text-red-300">
                    {t.booking.error}
                  </p>
                )}
                <MagneticButton strength={0.15} className="inline-block">
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    aria-busy={status === "loading"}
                    className="group relative flex min-h-12 items-center gap-4 overflow-hidden border border-fg px-8 py-3 text-xs uppercase tracking-[0.25em] transition-colors duration-500 hover:text-bg disabled:cursor-wait disabled:opacity-60"
                  >
                    {/* Fill wipes in from the left on hover. */}
                    <span aria-hidden="true" className="absolute inset-0 origin-left scale-x-0 bg-fg transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-x-100 group-disabled:scale-x-0" />
                    <span className="relative">{status === "loading" ? t.booking.sending : t.booking.submit}</span>
                    <span aria-hidden="true" className="relative transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1">
                      {status === "loading" ? <span className="inline-block size-3 animate-spin rounded-full border border-current border-t-transparent" /> : "→"}
                    </span>
                  </button>
                </MagneticButton>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
