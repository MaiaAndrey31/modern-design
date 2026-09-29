import "server-only";
import { revalidatePath, updateTag } from "next/cache";
import { LAYOUT_TAGS, type CacheTag } from "@/lib/content/tags";

/**
 * Invalidates the content caches touched by an admin mutation.
 *
 * - updateTag: read-your-own-writes — the admin's next request already sees
 *   the new data (Server Actions only).
 * - Layout-level data (brand, theme, fonts, header/footer, menus, SEO) lives
 *   in the site layout, so those tags revalidate the whole layout, not just "/".
 */
export function invalidate(...tags: CacheTag[]): void {
  for (const tag of new Set(tags)) updateTag(tag);
  const touchesLayout = tags.some((tag) => LAYOUT_TAGS.includes(tag));
  revalidatePath("/", touchesLayout ? "layout" : "page");
  // Admin screens are dynamic; this makes the router re-render the current
  // admin list after a delete/toggle/reorder instead of showing stale rows.
  revalidatePath("/admin", "layout");
}
