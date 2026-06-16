"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getHomePathForRole, getProfile, isUserRole, type UserRole } from "@/lib/auth/profile";

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getRedirectPath(formData: FormData): string {
  const redirectTo = getString(formData, "redirectTo");
  if (!redirectTo.startsWith("/") || redirectTo.startsWith("//")) {
    return "/";
  }
  return redirectTo;
}

function redirectWithError(path: string, message: string): never {
  const params = new URLSearchParams({ error: message });
  redirect(`${path}?${params.toString()}`);
}

function parseRole(formData: FormData): UserRole {
  const role = getString(formData, "role");
  if (!isUserRole(role)) {
    throw new Error("请选择教师或学生角色");
  }
  return role;
}

export async function signInAction(formData: FormData) {
  const email = getString(formData, "email");
  const password = getString(formData, "password");
  const redirectTo = getRedirectPath(formData);

  if (!email || !password) {
    redirectWithError("/auth/login", "请输入邮箱和密码");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirectWithError("/auth/login", error.message);
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function signUpAction(formData: FormData) {
  const email = getString(formData, "email");
  const password = getString(formData, "password");
  const displayName = getString(formData, "displayName");
  const role = parseRole(formData);

  if (!email || !password || !displayName) {
    redirectWithError("/auth/register", "请输入邮箱、密码和姓名");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        display_name: displayName,
      },
    },
  });

  if (error) {
    redirectWithError("/auth/register", error.message);
  }

  if (data.user && data.session) {
    const existingProfile = await getProfile(supabase, data.user.id);
    const { error: profileError } = existingProfile
      ? await supabase
          .from("profiles")
          .update({ display_name: displayName })
          .eq("id", data.user.id)
      : await supabase.from("profiles").insert({
          id: data.user.id,
          role,
          display_name: displayName,
        });

    if (profileError) {
      redirectWithError("/auth/register", profileError.message);
    }
  }

  revalidatePath("/", "layout");
  redirect(data.session ? getHomePathForRole(role) : "/auth/login?message=注册成功，请检查邮箱并登录");
}

export async function saveProfileAction(formData: FormData) {
  const displayName = getString(formData, "displayName");
  const role = parseRole(formData);

  if (!displayName) {
    redirectWithError("/auth/profile", "请输入姓名");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login?error=请先登录");
  }

  const existingProfile = await getProfile(supabase, user.id);
  const { error } = existingProfile
    ? await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("id", user.id)
    : await supabase.from("profiles").insert({
        id: user.id,
        role,
        display_name: displayName,
      });

  if (error) {
    redirectWithError("/auth/profile", error.message);
  }

  revalidatePath("/", "layout");
  redirect(getHomePathForRole(role));
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth/login");
}

export async function redirectToSignedInHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const profile = await getProfile(supabase, user.id);
  if (profile) {
    redirect(getHomePathForRole(profile.role));
  }

  redirect("/auth/profile");
}
