import type { Metadata } from "next";
import Link from "next/link";
import { getProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { addStudentLinkAction, removeStudentLinkAction } from "./actions";

export const metadata: Metadata = {
  title: "学生范围管理 · 知桥AI",
  description: "管理教师可查看学习数据的学生范围",
};

type PageProps = {
  searchParams?: Promise<{
    status?: string;
    message?: string;
  }>;
};

type LinkedStudent = {
  id: string;
  display_name: string;
  created_at: string;
  linked_at: string;
};

type LoadResult =
  | {
      status: "success";
      students: LinkedStudent[];
    }
  | {
      status: "error";
      message: string;
    };

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function loadLinkedStudents(): Promise<LoadResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { status: "error", message: "请先登录教师账号" };
    }

    const profile = await getProfile(supabase, user.id);
    if (!profile || profile.role !== "teacher") {
      return { status: "error", message: "当前账号不是教师角色" };
    }

    const { data: links, error: linksError } = await supabase
      .from("teacher_student_links")
      .select("student_id, created_at")
      .order("created_at", { ascending: false });

    if (linksError) {
      return { status: "error", message: linksError.message };
    }

    const studentIds = [...new Set((links ?? []).map((link) => link.student_id as string))];
    if (studentIds.length === 0) {
      return { status: "success", students: [] };
    }

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, display_name, created_at")
      .in("id", studentIds);

    if (profilesError) {
      return { status: "error", message: profilesError.message };
    }

    const linkedAtByStudentId = new Map(
      (links ?? []).map((link) => [link.student_id as string, link.created_at as string])
    );

    const students = ((profiles ?? []) as Array<{
      id: string;
      display_name: string;
      created_at: string;
    }>)
      .map((student) => ({
        ...student,
        linked_at: linkedAtByStudentId.get(student.id) ?? student.created_at,
      }))
      .sort((a, b) => b.linked_at.localeCompare(a.linked_at));

    return { status: "success", students };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "学生范围查询失败",
    };
  }
}

function StatusMessage({
  status,
  message,
}: {
  status?: string;
  message?: string;
}) {
  if (!status) return null;

  if (status === "added") {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        已添加学生到可查看范围。
      </div>
    );
  }

  if (status === "removed") {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        已移除学生。
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {message || "操作失败，请稍后重试。"}
    </div>
  );
}

export default async function TeacherStudentsPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const result = await loadLinkedStudents();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href="/teacher"
            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
          >
            <span aria-hidden>←</span>
            返回教师工作台
          </Link>
          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-indigo-600">
                知桥AI · 教师端
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                学生范围管理
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
                管理当前教师可查看学习数据的学生范围。第一版使用学生ID建立关联，不开放全量学生搜索。
              </p>
            </div>
            <Link
              href="/teacher/analytics"
              className="w-fit rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
            >
              查看学习数据
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <StatusMessage status={params.status} message={params.message} />

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">添加学生</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              让学生在学生学习中心复制“我的学生ID”，老师粘贴后即可查看该学生的练习与复习数据。
            </p>
            <form action={addStudentLinkAction} className="mt-5 flex flex-col gap-3 sm:flex-row">
              <input
                name="studentId"
                type="text"
                required
                placeholder="粘贴学生ID，例如 3b2421b0-..."
                className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                type="submit"
                aria-label="add-student-link"
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                添加学生
              </button>
            </form>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">已关联学生</h2>
                <p className="mt-1 text-sm text-slate-500">
                  这里只显示当前教师可查看数据的学生。
                </p>
              </div>
              {result.status === "success" ? (
                <span className="w-fit rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
                  {result.students.length} 名学生
                </span>
              ) : null}
            </div>

            {result.status === "error" ? (
              <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
                {result.message}
              </div>
            ) : result.students.length === 0 ? (
              <div className="mt-5 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                暂无关联学生。添加后，学习数据页会显示该学生的基础练习与复习任务。
              </div>
            ) : (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="pb-3 pr-4 font-medium">学生</th>
                      <th className="pb-3 pr-4 font-medium">学生ID</th>
                      <th className="pb-3 pr-4 font-medium">添加时间</th>
                      <th className="pb-3 text-right font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.students.map((student) => (
                      <tr key={student.id} className="align-top">
                        <td className="py-4 pr-4 font-medium text-slate-900">
                          {student.display_name}
                        </td>
                        <td className="py-4 pr-4">
                          <code className="rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">
                            {student.id}
                          </code>
                        </td>
                        <td className="py-4 pr-4 tabular-nums text-slate-500">
                          {formatDateTime(student.linked_at)}
                        </td>
                        <td className="py-4 text-right">
                          <form action={removeStudentLinkAction}>
                            <input type="hidden" name="studentId" value={student.id} />
                            <button
                              type="submit"
                              aria-label={`remove-student-${student.id}`}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                            >
                              移除
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
