"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import {
  hashPassword,
  comparePassword,
  setSessionCookie,
  removeSessionCookie,
  getCurrentUser,
} from "@/lib/auth";
import { validateAuthInput } from "@/lib/validation";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export interface AuthActionResult {
  success: boolean;
  error?: string;
  errors?: Record<string, string>;
}

export async function loginAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  const validation = validateAuthInput({ email, password });
  if (!validation.isValid) {
    return { success: false, errors: validation.errors };
  }

  try {
    const { ensureDbInitialized } = await import("@/db");
    await ensureDbInitialized();

    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const user = existingUsers[0];
    if (!user) {
      return { success: false, error: "Invalid email or password." };
    }

    const passwordsMatch = await comparePassword(password, user.passwordHash);
    if (!passwordsMatch) {
      return { success: false, error: "Invalid email or password." };
    }

    await setSessionCookie({
      userId: user.id,
      email: user.email,
      name: user.name,
      currency: user.currency,
    });
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }

  redirect("/dashboard");
}

export async function signupAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const currency = ((formData.get("currency") as string) || "USD").toUpperCase();

  const validation = validateAuthInput({ name, email, password });
  if (!validation.isValid) {
    return { success: false, errors: validation.errors };
  }

  try {
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUsers.length > 0) {
      return { success: false, error: "An account with this email already exists." };
    }

    const passwordHash = await hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash,
        currency,
      })
      .returning();

    await setSessionCookie({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      currency: newUser.currency,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return { success: false, error: "Could not create account. Please try again." };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  await removeSessionCookie();
  redirect("/login");
}

export async function getSessionUser() {
  return await getCurrentUser();
}
