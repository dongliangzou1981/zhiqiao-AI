import Link from "next/link";
import { redirectToSignedInHome, signUpAction } from "../actions";

type RegisterPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  await redirectToSignedInHome();
  const params = (await searchParams) ?? {};

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-indigo-600">知桥AI</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">注册</h1>
        <p className="mt-1 text-sm text-slate-500">创建教师或学生账号</p>

        {params.error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {params.error}
          </p>
        )}

        <form action={signUpAction} className="mt-6 space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-slate-700">
              姓名
            </label>
            <input
              id="displayName"
              name="displayName"
              required
              autoComplete="name"
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
              defaultValue="student"
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="student">学生</option>
              <option value="teacher">教师</option>
            </select>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              邮箱
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              密码
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            注册
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          已有账号？{" "}
          <Link href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-700">
            登录
          </Link>
        </p>
      </section>
    </main>
  );
}
