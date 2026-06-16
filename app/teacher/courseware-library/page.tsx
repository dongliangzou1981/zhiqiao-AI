import type { Metadata } from "next";
import Link from "next/link";
import {
  getCoursewareAssetMetadata,
  type CoursewareAssetMetadata,
} from "@/lib/courseware-asset";
import {
  getCoursewareRecommendation,
  getCoursewareRecommendationReasons,
  sortCoursewareResources,
} from "@/lib/courseware-ranking";
import type { CoursewareJson } from "@/lib/courseware-types";
import { listCoursewares, type CoursewareRecord } from "@/lib/coursewares";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "课件资源库 · 知桥AI",
  description: "沉淀、管理和复用教师已生成的 AI 课件资源",
};

type CoursewareLibraryPageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
  }>;
};

const statusFilters = [
  { value: "all", label: "全部" },
  { value: "published", label: "已发布" },
  { value: "draft", label: "草稿" },
  { value: "recommended", label: "推荐资源" },
  { value: "needs_review", label: "需复核" },
] as const;

type StatusFilter = (typeof statusFilters)[number]["value"];

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

function getRecordMetadata(record: CoursewareRecord): CoursewareAssetMetadata {
  return getCoursewareAssetMetadata(
    isCoursewareJson(record.content_json) ? record.content_json : null
  );
}

const sourceLabels: Record<CoursewareAssetMetadata["source_type"], string> = {
  teacher_generated: "教师生成",
  platform_curated: "平台精选",
  official_seed: "官方样板",
};

const visibilityLabels: Record<CoursewareAssetMetadata["visibility"], string> = {
  private: "仅自己可见",
  class: "班级可用",
  school: "校内可用",
  public: "公开可用",
};

const qualityLabels: Record<CoursewareAssetMetadata["quality_status"], string> = {
  draft: "草稿待确认",
  teacher_verified: "教师已确认",
  platform_verified: "平台已验证",
};

const licenseLabels: Record<CoursewareAssetMetadata["license_status"], string> = {
  private_use: "个人/班级使用",
  share_allowed: "允许共享",
  needs_review: "需版权复核",
};

const recommendationToneClass = {
  strong: "bg-indigo-100 text-indigo-700",
  good: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  muted: "bg-slate-100 text-slate-600",
  neutral: "bg-sky-100 text-sky-700",
};

function normalizeStatusFilter(value: string | undefined): StatusFilter {
  return statusFilters.some((filter) => filter.value === value)
    ? (value as StatusFilter)
    : "all";
}

function getFilterHref(status: StatusFilter, query: string): string {
  const params = new URLSearchParams();
  const trimmedQuery = query.trim();

  if (trimmedQuery) {
    params.set("q", trimmedQuery);
  }

  if (status !== "all") {
    params.set("status", status);
  }

  const suffix = params.toString();
  return suffix ? `/teacher/courseware-library?${suffix}` : "/teacher/courseware-library";
}

function matchesSearch(record: CoursewareRecord, query: string): boolean {
  const keyword = query.trim().toLocaleLowerCase("zh-CN");
  if (!keyword) return true;

  return [
    record.knowledge_point_name,
    record.knowledge_point_code,
    record.subject,
    record.grade,
    record.semester,
    record.chapter,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLocaleLowerCase("zh-CN").includes(keyword));
}

function matchesStatus(record: CoursewareRecord, status: StatusFilter): boolean {
  const metadata = getRecordMetadata(record);
  const recommendation = getCoursewareRecommendation(record);

  if (status === "published") return record.is_published;
  if (status === "draft") return !record.is_published;
  if (status === "needs_review") return metadata.license_status === "needs_review";
  if (status === "recommended") {
    return record.is_published && ["strong", "good", "neutral"].includes(recommendation.tone);
  }

  return true;
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{hint}</p>
    </div>
  );
}

function AssetBadges({ metadata }: { metadata: CoursewareAssetMetadata }) {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-700 ring-1 ring-sky-100">
        {sourceLabels[metadata.source_type]}
      </span>
      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-100">
        {qualityLabels[metadata.quality_status]}
      </span>
      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-700 ring-1 ring-indigo-100">
        {visibilityLabels[metadata.visibility]}
      </span>
      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 ring-1 ring-amber-100">
        {licenseLabels[metadata.license_status]}
      </span>
    </div>
  );
}

function CoursewareCard({ record }: { record: CoursewareRecord }) {
  const metadata = getRecordMetadata(record);
  const structured = isCoursewareJson(record.content_json) ? record.content_json : null;
  const generatedBy = metadata.generated_by;
  const recommendation = getCoursewareRecommendation(record);
  const recommendationReasons = getCoursewareRecommendationReasons(record);

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900">
              {record.knowledge_point_name}
            </h3>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                record.is_published
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {record.is_published ? "已发布" : "未发布"}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                recommendationToneClass[recommendation.tone]
              }`}
            >
              {recommendation.label}
            </span>
          </div>
          <code className="mt-2 inline-block rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
            {record.knowledge_point_code}
          </code>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {record.subject} · {record.grade} · {record.semester} · {record.chapter}
          </p>
          <AssetBadges metadata={metadata} />
          {recommendationReasons.length > 0 ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs leading-5 text-slate-500">
              {recommendationReasons.slice(0, 2).map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          ) : null}
          <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
            <p>创建时间：{formatCreatedAt(record.created_at)}</p>
            <p>推荐分：{recommendation.score}</p>
            <p>
              结构化课件：
              <span className={structured ? "text-emerald-700" : "text-amber-700"}>
                {structured ? "可用于学生端" : "仅 Markdown"}
              </span>
            </p>
            {generatedBy ? (
              <>
                <p>
                  Markdown 模型：{generatedBy.markdown_provider} /{" "}
                  {generatedBy.markdown_model}
                </p>
                <p>
                  JSON 模型：{generatedBy.json_provider} / {generatedBy.json_model}
                </p>
              </>
            ) : (
              <p className="sm:col-span-2">模型来源：历史数据未记录</p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 md:justify-end">
          <Link
            href={`/teacher/courseware-history/${record.id}`}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            查看详情
          </Link>
          <Link
            href="/teacher/courseware"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            生成新课件
          </Link>
        </div>
      </div>
    </li>
  );
}

async function getRecords(): Promise<CoursewareRecord[]> {
  const supabase = await createClient();
  return listCoursewares(supabase);
}

export default async function CoursewareLibraryPage({
  searchParams,
}: CoursewareLibraryPageProps) {
  const params = (await searchParams) ?? {};
  const query = params.q?.trim() ?? "";
  const status = normalizeStatusFilter(params.status);
  const records = sortCoursewareResources(await getRecords());
  const filteredRecords = records.filter(
    (record) => matchesSearch(record, query) && matchesStatus(record, status)
  );
  const publishedRecords = records.filter((record) => record.is_published);
  const draftRecords = records.filter((record) => !record.is_published);
  const filteredPublishedRecords = filteredRecords.filter((record) => record.is_published);
  const filteredDraftRecords = filteredRecords.filter((record) => !record.is_published);
  const teacherVerifiedCount = records.filter(
    (record) => getRecordMetadata(record).quality_status === "teacher_verified"
  ).length;
  const modelRecordedCount = records.filter(
    (record) => getRecordMetadata(record).generated_by
  ).length;
  const needsReviewCount = records.filter(
    (record) => getRecordMetadata(record).license_status === "needs_review"
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <Link
              href="/teacher"
              className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
            >
              <span aria-hidden>←</span>
              返回教师工作台
            </Link>
            <h1 className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              课件资源库
            </h1>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              把老师生成并确认过的课件沉淀为可复用资源，后续供学生端和平台精选低成本调用。
            </p>
          </div>
          <Link
            href="/teacher/courseware"
            className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            生成课件
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-4 md:grid-cols-4">
          <StatCard label="全部课件" value={records.length} hint="当前教师 RLS 可见资源" />
          <StatCard label="已发布" value={publishedRecords.length} hint="学生端可复用" />
          <StatCard label="教师已确认" value={teacherVerifiedCount} hint="适合进入班级资源" />
          <StatCard label="模型已记录" value={modelRecordedCount} hint="便于后续成本分析" />
        </section>

        <section className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
          <h2 className="text-base font-semibold text-slate-900">资源沉淀原则</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            生成课件可以使用不同模型，但学生学习时优先读取已保存、已发布、已确认的资源，避免重复调用昂贵模型。每份课件继续绑定知识点编码，后续可以接入平台精选、班级共享和学生掌握记录。
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            默认推荐顺序按“平台验证、教师确认、已发布、结构化课件、可共享授权、最近更新”综合排序；版权待复核资源会降低推荐优先级。
            {needsReviewCount > 0 ? ` 当前有 ${needsReviewCount} 份资源需要版权复核。` : ""}
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <form action="/teacher/courseware-library" className="flex-1">
              <label htmlFor="courseware-search" className="text-sm font-semibold text-slate-900">
                搜索课件
              </label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  id="courseware-search"
                  name="q"
                  defaultValue={query}
                  placeholder="输入知识点名称、编码、章节"
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                />
                {status !== "all" ? <input type="hidden" name="status" value={status} /> : null}
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  搜索
                </button>
                {(query || status !== "all") ? (
                  <Link
                    href="/teacher/courseware-library"
                    className="rounded-lg border border-slate-200 px-4 py-2 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    清空
                  </Link>
                ) : null}
              </div>
            </form>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">筛选状态</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {statusFilters.map((filter) => {
                  const active = filter.value === status;

                  return (
                    <Link
                      key={filter.value}
                      href={getFilterHref(filter.value, query)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        active
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {filter.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            当前显示 {filteredRecords.length} / {records.length} 份课件。
          </p>
        </section>

        {records.length === 0 ? (
          <section className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-700">还没有可复用课件</p>
            <p className="mt-2 text-sm text-slate-500">
              先围绕样板知识点生成一份中文初中数学课件，再回到这里管理和发布。
            </p>
            <Link
              href="/teacher/courseware"
              className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              去生成第一份课件
            </Link>
          </section>
        ) : filteredRecords.length === 0 ? (
          <section className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-700">没有匹配的课件</p>
            <p className="mt-2 text-sm text-slate-500">
              可以换一个知识点名称、编码或筛选状态再试。
            </p>
          </section>
        ) : (
          <div className="mt-6 space-y-6">
            <section>
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">已发布资源</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    这些课件已经允许学生端读取，是当前低成本复用的核心资产。
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
                  {filteredPublishedRecords.length} 份
                </span>
              </div>
              {filteredPublishedRecords.length > 0 ? (
                <ul className="space-y-3">
                  {filteredPublishedRecords.map((record) => (
                    <CoursewareCard key={record.id} record={record} />
                  ))}
                </ul>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
                  暂无已发布课件。进入课件详情页确认内容后，可以发布到学生端。
                </div>
              )}
            </section>

            <section>
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">草稿与待确认</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    这些课件仍适合老师继续检查、编辑、完善，不直接作为学生端默认资源。
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {filteredDraftRecords.length} 份
                </span>
              </div>
              {filteredDraftRecords.length > 0 ? (
                <ul className="space-y-3">
                  {filteredDraftRecords.map((record) => (
                    <CoursewareCard key={record.id} record={record} />
                  ))}
                </ul>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
                  暂无草稿课件。
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
