import type { Metadata } from "next";
import Link from "next/link";
import {
  getCoursewareAssetMetadata,
  type CoursewareAssetMetadata,
} from "@/lib/courseware-asset";
import type { CoursewareJson } from "@/lib/courseware-types";
import { listCoursewares, type CoursewareRecord } from "@/lib/coursewares";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "课件历史记录 · 知桥AI",
  description: "查看已生成的 AI 课件历史",
};

function formatCreatedAt(iso: string): string {
  return new Date(iso).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isCoursewareJson(value: unknown): value is CoursewareJson {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      (value as { version?: unknown }).version === "courseware_json_v1"
  );
}

function getRecordAssetMetadata(record: CoursewareRecord): CoursewareAssetMetadata {
  return getCoursewareAssetMetadata(
    isCoursewareJson(record.content_json) ? record.content_json : null
  );
}

const sourceLabels: Record<CoursewareAssetMetadata["source_type"], string> = {
  teacher_generated: "老师生成",
  platform_curated: "平台精选",
  official_seed: "官方种子",
};

const qualityLabels: Record<CoursewareAssetMetadata["quality_status"], string> = {
  draft: "草稿待确认",
  teacher_verified: "老师已确认",
  platform_verified: "平台已确认",
};

function AssetBadges({ metadata }: { metadata: CoursewareAssetMetadata }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700 ring-1 ring-sky-100">
        {sourceLabels[metadata.source_type]}
      </span>
      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-100">
        {qualityLabels[metadata.quality_status]}
      </span>
      <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-slate-100">
        {metadata.generated_by ? "模型已记录" : "旧课件"}
      </span>
    </div>
  );
}

function IconSlides() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h14.25c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125H4.875a1.125 1.125 0 01-1.125-1.125v-9.75zM8.25 20.25h7.5M12 15.75v4.5"
      />
    </svg>
  );
}

async function getRecords(): Promise<CoursewareRecord[]> {
  const supabase = await createClient();
  return listCoursewares(supabase);
}

export default async function CoursewareHistoryPage() {
  const records = await getRecords();
  const publishedCount = records.filter((record) => record.is_published).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <Link
              href="/teacher"
              className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
            >
              <span aria-hidden>←</span>
              返回教师工作台
            </Link>
            <div className="mt-2 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                <IconSlides />
              </span>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  课件历史记录
                </h1>
                <p className="text-sm text-slate-500">查看已生成的 AI 课件</p>
              </div>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 ring-1 ring-sky-200/80">
            已保存课件
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              共 <span className="font-semibold text-indigo-600">{records.length}</span>{" "}
              条记录 · 已发布 <span className="font-semibold text-emerald-600">{publishedCount}</span>{" "}
              条 · 按创建时间倒序
            </p>
            <Link
              href="/teacher/courseware"
              className="text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
            >
              去生成新课件 →
            </Link>
          </div>

          {records.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center">
              <p className="text-sm font-medium text-slate-600">暂无课件历史</p>
              <p className="mt-1 text-xs text-slate-400">
                生成课件后将自动保存到数据库
              </p>
              <Link
                href="/teacher/courseware"
                className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                去生成第一份课件 →
              </Link>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="pb-3 pr-4 font-medium">知识点名称</th>
                      <th className="pb-3 pr-4 font-medium">知识点编码</th>
                      <th className="pb-3 pr-4 font-medium">课件范围</th>
                      <th className="pb-3 pr-4 font-medium">学生端</th>
                      <th className="pb-3 pr-4 font-medium">创建时间</th>
                      <th className="pb-3 text-right font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {records.map((record) => {
                      const metadata = getRecordAssetMetadata(record);

                      return (
                      <tr key={record.id} className="transition hover:bg-slate-50/80">
                        <td className="py-4 pr-4 font-medium text-slate-900">
                          {record.knowledge_point_name}
                          <AssetBadges metadata={metadata} />
                        </td>
                        <td className="py-4 pr-4">
                          <code className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
                            {record.knowledge_point_code}
                          </code>
                        </td>
                        <td className="py-4 pr-4 text-slate-600">
                          {record.grade} · {record.semester} · {record.chapter}
                        </td>
                        <td className="py-4 pr-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              record.is_published
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {record.is_published ? "已发布" : "未发布"}
                          </span>
                        </td>
                        <td className="py-4 pr-4 tabular-nums text-slate-600">
                          {formatCreatedAt(record.created_at)}
                        </td>
                        <td className="py-4 text-right">
                          <Link
                            href={`/teacher/courseware-history/${record.id}`}
                            className="inline-flex items-center rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100"
                          >
                            查看
                          </Link>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <ul className="space-y-3 md:hidden">
                {records.map((record) => {
                  const metadata = getRecordAssetMetadata(record);

                  return (
                  <li
                    key={record.id}
                    className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/30"
                  >
                    <p className="font-semibold text-slate-900">
                      {record.knowledge_point_name}
                    </p>
                    <code className="mt-2 inline-block rounded-md bg-white px-2 py-0.5 font-mono text-xs text-slate-600 ring-1 ring-slate-200/80">
                      {record.knowledge_point_code}
                    </code>
                    <AssetBadges metadata={metadata} />
                    <p className="mt-2 text-xs text-slate-500">
                      {record.grade} · {record.semester} · {record.chapter}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      创建时间：{formatCreatedAt(record.created_at)}
                    </p>
                    <span
                      className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        record.is_published
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {record.is_published ? "已发布到学生端" : "未发布"}
                    </span>
                    <Link
                      href={`/teacher/courseware-history/${record.id}`}
                      className="mt-3 inline-flex items-center rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                    >
                      查看
                    </Link>
                  </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>

        <p className="mt-8 text-center text-xs text-slate-400">
          数据保存在 Supabase · 知桥AI P2
        </p>
      </main>
    </div>
  );
}
