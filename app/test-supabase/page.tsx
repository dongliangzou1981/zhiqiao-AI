import { createClient } from "@/lib/supabase/server";

export default async function TestSupabasePage() {
  let connected = false;
  let errorMessage: string | null = null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    errorMessage =
      "未配置环境变量：NEXT_PUBLIC_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_ANON_KEY";
  } else {
    try {
      const supabase = await createClient();
      const { error } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true });

      if (error) {
        errorMessage = error.message;
      } else {
        connected = true;
      }
    } catch (err) {
      errorMessage =
        err instanceof Error ? err.message : "无法创建 Supabase 客户端";
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold text-slate-900">Supabase 连接测试</h1>
      <p className="text-sm text-slate-600">
        通过服务端查询 <code className="rounded bg-slate-100 px-1">profiles</code>{" "}
        表验证数据库连接。
      </p>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">连接状态</p>
        <p
          className={`mt-2 text-lg font-medium ${
            connected ? "text-green-700" : "text-red-700"
          }`}
        >
          {connected ? "连接成功" : "连接失败"}
        </p>
      </section>

      {errorMessage && (
        <section className="rounded-lg border border-red-200 bg-red-50 p-6">
          <p className="text-sm font-medium text-red-800">错误信息</p>
          <p className="mt-2 text-sm text-red-700">{errorMessage}</p>
        </section>
      )}
    </main>
  );
}
