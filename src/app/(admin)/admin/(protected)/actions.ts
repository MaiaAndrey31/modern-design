"use server";

import { signOut } from "@/lib/auth";

export async function logoutAction() {
  await signOut({ redirectTo: "/admin/login" });
}
