"use server";

import { signIn, signOut } from "@/lib/auth";

export async function loginAction() {
  await signIn("google", { redirectTo: "/dashboard" });
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}