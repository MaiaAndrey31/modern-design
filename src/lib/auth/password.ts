import "server-only";
import bcrypt from "bcryptjs";

// bcryptjs is pure JS (no native bindings) — deliberately chosen over
// native `bcrypt`/`argon2` to avoid Vercel/Turbopack native-module build
// failures for a single-admin-scale CMS where the extra hashing cost of a
// native implementation isn't the bottleneck.
const SALT_ROUNDS = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
