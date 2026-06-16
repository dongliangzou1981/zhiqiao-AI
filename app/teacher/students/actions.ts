"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function redirectWithStatus(type: "added" | "removed" | "error", message?: string): never {
  const params = new URLSearchParams({ status: type });
  if (message) {
    params.set("message", message);
  }

  redirect(`/teacher/students?${params.toString()}`);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

async function requireTeacher() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login?redirect=/teacher/students");
  }

  const profile = await getProfile(supabase, user.id);
  if (!profile || profile.role !== "teacher") {
    redirect("/teacher");
  }

  return { supabase, user };
}

export async function addStudentLinkAction(formData: FormData) {
  const studentId = getString(formData, "studentId");

  if (!isUuid(studentId)) {
    redirectWithStatus("error", "请输入有效的学生ID");
  }

  const { supabase, user } = await requireTeacher();
  const { error } = await supabase.from("teacher_student_links").insert({
    teacher_id: user.id,
    student_id: studentId,
  });

  if (error) {
    if (error.code === "23505") {
      redirectWithStatus("error", "该学生已经在可查看范围内");
    }

    redirectWithStatus("error", "添加失败，请确认学生ID属于学生账号");
  }

  revalidatePath("/teacher/students");
  revalidatePath("/teacher/analytics");
  redirectWithStatus("added");
}

export async function removeStudentLinkAction(formData: FormData) {
  const studentId = getString(formData, "studentId");

  if (!isUuid(studentId)) {
    redirectWithStatus("error", "学生ID无效");
  }

  const { supabase, user } = await requireTeacher();
  const { error } = await supabase
    .from("teacher_student_links")
    .delete()
    .eq("teacher_id", user.id)
    .eq("student_id", studentId);

  if (error) {
    redirectWithStatus("error", "移除失败，请稍后重试");
  }

  revalidatePath("/teacher/students");
  revalidatePath("/teacher/analytics");
  redirectWithStatus("removed");
}
