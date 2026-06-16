import Link from "next/link";
import { signInAction, redirectToSignedInHome } from "../actions";

type LoginPageProps = {
  searchParams?: Promise<{
    redirect?: string;
    error?: string;
    message?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  await redirectToSignedInHome();
  const params = (await searchParams) ?? {};
  const redirectTo = params.redirect?.startsWith("/") ? params.redirect : "/";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-indigo-600">知桥AI</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">登录</h1>
        <p className="mt-1 text-sm text-slate-500">进入教师工作台或学生学习中心</p>

        {params.message && (
          <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {params.message}
          </p>
        )}
        {params.error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {params.error}
          </p>
        )}

        <form action={signInAction} className="mt-6 space-y-4">
          <input type="hidden" name="redirectTo" value={redirectTo} />
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
              autoComplete="current-password"
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            登录
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          还没有账号？{" "}
          <Link href="/auth/register" className="font-medium text-indigo-600 hover:text-indigo-700">
            注册
          </Link>
        </p>
      </section>
    </main>
  );
}
