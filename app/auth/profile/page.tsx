import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { saveProfileAction } from "../actions";

type ProfilePageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?error=请先登录");
  }

  const profile = await getProfile(supabase, user.id);
  const params = (await searchParams) ?? {};

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-indigo-600">知桥AI</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">完善资料</h1>
        <p className="mt-1 text-sm text-slate-500">用于区分教师端和学生端访问权限</p>

        {params.error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {params.error}
          </p>
        )}

        <form action={saveProfileAction} className="mt-6 space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-slate-700">
              姓名
            </label>
            <input
              id="displayName"
              name="displayName"
              required
              defaultValue={profile?.display_name ?? user.email ?? ""}
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-slate-700">
              角色
            </label>
            <select
              id="role"
              name="role"
              defaultValue={profile?.role ?? "student"}
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="student">学生</option>
              <option value="teacher">教师</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            保存并进入系统
          </button>
        </form>
      </section>
    </main>
  );
}
