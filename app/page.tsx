import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold text-slate-900">知桥AI</h1>
      <Link
        href="/teacher"
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        进入教师工作台
      </Link>
    </main>
  );
}
