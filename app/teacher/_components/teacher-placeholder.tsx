import Link from "next/link";

type TeacherPlaceholderProps = {
  title: string;
  description: string;
};

export function TeacherPlaceholder({ title, description }: TeacherPlaceholderProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <Link
          href="/teacher"
          className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
        >
          <span aria-hidden>←</span>
          返回教师工作台
        </Link>

        <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm shadow-slate-200/50">
          <p className="text-xs font-medium uppercase tracking-wider text-indigo-600">
            知桥AI · 教师端
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-4 leading-relaxed text-slate-600">{description}</p>
          <p className="mt-6 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">
            功能开发中，敬请期待。
          </p>
        </div>
      </main>
    </div>
  );
}
