import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { bookingSchema } from "@/lib/validations/booking";
import { prisma } from "@/lib/db";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

function hashIp(ip: string) {
  // Never store raw IPs — a salted hash is enough for rate limiting without
  // retaining personal data (LGPD/GDPR hygiene).
  return createHash("sha256").update(`${ip}:${process.env.AUTH_SECRET ?? "booking"}`).digest("hex");
}

/**
 * Booking form submission endpoint. Persists to BookingRequest (visible in
 * the admin's Booking inbox). No email/CRM integration is wired up yet — see
 * README > "Como configurar formulário" for how to connect a real provider.
 *
 * Example of what to add once a provider is chosen:
 *   await resend.emails.send({
 *     from: "booking@alansaher.com",
 *     to: process.env.BOOKING_NOTIFY_EMAIL,
 *     subject: `New booking request — ${data.city}`,
 *     text: JSON.stringify(data, null, 2),
 *   });
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  // Honeypot: a field real visitors never see/fill (hidden in the form via
  // CSS, not `type="hidden"`, so basic bots that skip hidden inputs still
  // fall for it). Silently accept without persisting — never tip off a bot.
  if (body && typeof body === "object" && "company_website" in body && body.company_website) {
    return NextResponse.json({ ok: true });
  }

  const result = bookingSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ ok: false, errors: result.error.flatten().fieldErrors }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ipHash = hashIp(ip);

  const recentCount = await prisma.bookingRequest.count({
    where: { ipHash, createdAt: { gte: new Date(Date.now() - RATE_LIMIT_WINDOW_MS) } },
  });
  if (recentCount >= RATE_LIMIT_MAX_REQUESTS) {
    return NextResponse.json({ ok: false, errors: { _form: ["Muitas tentativas. Tente novamente mais tarde."] } }, { status: 429 });
  }

  const data = result.data;
  await prisma.bookingRequest.create({
    data: {
      name: data.name,
      company: data.company || null,
      whatsapp: data.whatsapp,
      email: data.email,
      city: data.city,
      eventType: data.eventType,
      eventDate: data.eventDate ? new Date(data.eventDate) : null,
      message: data.message || null,
      ipHash,
      userAgent: request.headers.get("user-agent"),
    },
  });

  // TODO: forward `data` to email/CRM once a provider is configured.

  return NextResponse.json({ ok: true });
}
