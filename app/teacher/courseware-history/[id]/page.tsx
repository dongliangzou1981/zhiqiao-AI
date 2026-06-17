import Link from "next/link";
import { DynamicCoursewareDemo } from "@/app/_components/dynamic-courseware-demo";
import {
  getCoursewareAssetMetadata,
  type CoursewareAssetMetadata,
} from "@/lib/courseware-asset";
import {
  assessCoursewareQuality,
  getCoursewareQualityIssues,
  type CoursewareQualityReport,
} from "@/lib/courseware-quality";
import { getLatestPendingCoursewareRevisionRecord } from "@/lib/courseware-revisions";
import { normalizeCoursewareStoryboardsForDisplay } from "@/lib/courseware-storyboard";
import type { CoursewareJson } from "@/lib/courseware-types";
import { getCoursewareById } from "@/lib/coursewares";
import {
  buildCoursewareFeedbackImprovementSummary,
  type CoursewareFeedbackLevel,
} from "@/lib/student-courseware-feedback";
import { createClient } from "@/lib/supabase/server";
import { setCoursewarePublishedAction } from "../actions";
import { CoursewareJsonEditor } from "./courseware-json-editor";
import { DynamicCoursewareGenerator } from "./dynamic-courseware-generator";
import { CoursewareHumanReviewChecklist } from "./courseware-human-review-checklist";
import { CoursewareQualityImprover } from "./courseware-quality-improver";
import { CoursewareRevisionComparison } from "./courseware-revision-comparison";

type CoursewareHistoryDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    publish?: string;
    edit?: string;
    practice?: string;
    feedback?: string;
  }>;
};

type CoursewareFeedbackRow = {
  id: string;
  user_id: string;
  understanding_level: CoursewareFeedbackLevel;
  need_teacher_help: boolean;
  feedback_text: string | null;
  updated_at: string;
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

function parsePracticeIndex(value: string | undefined, itemCount: number): number | null {
  if (!value) return null;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed >= itemCount) {
    return null;
  }

  return parsed;
}

async function listCoursewareFeedbackForTeacher(
  supabase: Awaited<ReturnType<typeof createClient>>,
  coursewareId: string
): Promise<CoursewareFeedbackRow[]> {
  const { data, error } = await supabase
    .from("student_courseware_feedback")
    .select("id, user_id, understanding_level, need_teacher_help, feedback_text, updated_at")
    .eq("courseware_id", coursewareId)
    .order("need_teacher_help", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) {
    return [];
  }

  return ((data ?? []) as CoursewareFeedbackRow[]).filter(
    (row) => row.understanding_level !== "understood" || row.need_teacher_help
  );
}

const sourceLabels: Record<CoursewareAssetMetadata["source_type"], string> = {
  teacher_generated: "老师生成",
  platform_curated: "平台精选",
  official_seed: "官方种子",
};

const visibilityLabels: Record<CoursewareAssetMetadata["visibility"], string> = {
  private: "仅自己可见",
  class: "班级可见",
  school: "学校可见",
  public: "公开资源",
};

const qualityLabels: Record<CoursewareAssetMetadata["quality_status"], string> = {
  draft: "草稿待确认",
  teacher_verified: "老师已确认",
  platform_verified: "平台已确认",
};

const licenseLabels: Record<CoursewareAssetMetadata["license_status"], string> = {
  private_use: "自用/班级使用",
  share_allowed: "允许共享",
  needs_review: "授权待审核",
};

function AssetMetadataPanel({ metadata }: { metadata: CoursewareAssetMetadata }) {
  const generatedBy = metadata.generated_by;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            资源资产信息
          </p>
          <h3 className="mt-2 text-base font-semibold text-slate-900">
            为后续低成本复用和平台精选预留
          </h3>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {generatedBy ? "模型已记录" : "旧课件 / 未记录模型"}
        </span>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-4">
          <dt className="text-xs text-slate-500">资源来源</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-900">
            {sourceLabels[metadata.source_type]}
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <dt className="text-xs text-slate-500">质量状态</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-900">
            {qualityLabels[metadata.quality_status]}
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <dt className="text-xs text-slate-500">可见范围</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-900">
            {visibilityLabels[metadata.visibility]}
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <dt className="text-xs text-slate-500">授权状态</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-900">
            {licenseLabels[metadata.license_status]}
          </dd>
        </div>
      </dl>

      {generatedBy ? (
        <div className="mt-4 rounded-xl bg-sky-50 p-4 text-xs leading-6 text-sky-900 ring-1 ring-sky-100">
          <p>
            Markdown：{generatedBy.markdown_provider} / {generatedBy.markdown_model}
          </p>
          <p>
            结构化 JSON：{generatedBy.json_provider} / {generatedBy.json_model}
          </p>
          {generatedBy.html_provider && generatedBy.html_model ? (
            <p>
              互动课件：{generatedBy.html_provider} / {generatedBy.html_model}
            </p>
          ) : null}
          {metadata.generated_at ? <p>生成时间：{formatCreatedAt(metadata.generated_at)}</p> : null}
        </div>
      ) : null}
    </section>
  );
}

function ContentQualityPanel({
  report,
  coursewareId,
  feedbackInstruction,
  feedbackRows,
}: {
  report: CoursewareQualityReport;
  coursewareId: string;
  feedbackInstruction: string;
  feedbackRows: CoursewareFeedbackRow[];
}) {
  const issues = getCoursewareQualityIssues(report);
  const requiredIssues = issues.filter((issue) => issue.severity === "required");
  const recommendedIssues = issues.filter((issue) => issue.severity === "recommended");

  return (
    <section
      className={`rounded-2xl border p-6 shadow-sm ${
        report.passedRequired
          ? "border-emerald-200 bg-emerald-50/70"
          : "border-amber-200 bg-amber-50/80"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            内容效果检查
          </p>
          <h3 className="mt-2 text-base font-semibold text-slate-900">
            先看内容是否真的能帮助老师讲清、学生学会
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            这不是技术通过率，而是围绕知识点、推导完整、练习解析、学生复习和投屏可用性的规则检查。
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-slate-900">{report.score}</p>
          <p className="text-xs text-slate-500">内容质量分</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-white/80 p-4 ring-1 ring-black/5">
          <p className="text-xs text-slate-500">必选项</p>
          <p
            className={`mt-1 text-sm font-semibold ${
              report.passedRequired ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            {report.passedRequired ? "已通过" : `${requiredIssues.length} 项待修正`}
          </p>
        </div>
        <div className="rounded-xl bg-white/80 p-4 ring-1 ring-black/5">
          <p className="text-xs text-slate-500">建议项</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {recommendedIssues.length === 0 ? "已通过" : `${recommendedIssues.length} 项可优化`}
          </p>
        </div>
        <div className="rounded-xl bg-white/80 p-4 ring-1 ring-black/5">
          <p className="text-xs text-slate-500">建议动作</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {report.passedRequired ? "老师预览确认" : "先重新生成或编辑"}
          </p>
        </div>
      </div>

      {issues.length > 0 ? (
        <div className="mt-5 space-y-2">
          {issues.slice(0, 6).map((issue) => (
            <div
              key={issue.id}
              className="rounded-xl bg-white/85 px-4 py-3 text-sm leading-6 ring-1 ring-black/5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    issue.severity === "required"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {issue.severity === "required" ? "必须修正" : "建议优化"}
                </span>
                <span className="font-semibold text-slate-900">{issue.label}</span>
              </div>
              <p className="mt-1 text-slate-600">{issue.detail}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-xl bg-white/85 px-4 py-3 text-sm text-emerald-700 ring-1 ring-black/5">
          当前课件已通过全部内容效果检查。仍建议老师课前按投屏预览完整播放一遍。
        </p>
      )}

      <CoursewareQualityImprover
        coursewareId={coursewareId}
        issueCount={issues.length}
        passedRequired={report.passedRequired}
        initialInstruction={feedbackInstruction}
      />

      {feedbackRows.length > 0 ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-white/85 p-4 text-sm ring-1 ring-black/5">
          <p className="font-semibold text-slate-900">来自学生反馈的优化线索</p>
          <p className="mt-1 text-slate-600">{feedbackInstruction}</p>
          <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-500">
            {feedbackRows.slice(0, 5).map((feedback) => (
              <li key={feedback.id} className="rounded-lg bg-amber-50 px-3 py-2">
                <span className="font-semibold text-amber-900">
                  {feedback.understanding_level === "not_understood"
                    ? "没看懂"
                    : "部分看懂"}
                  {feedback.need_teacher_help ? " · 希望老师再讲" : ""}
                </span>
                <span className="ml-2">
                  {feedback.feedback_text || "学生未填写具体说明"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

export default async function CoursewareHistoryDetailPage({
  params,
  searchParams,
}: CoursewareHistoryDetailPageProps) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const supabase = await createClient();
  const record = await getCoursewareById(supabase, id);
  const structured = record && isCoursewareJson(record.content_json) ? record.content_json : null;
  const displayStructured = structured ? normalizeCoursewareStoryboardsForDisplay(structured) : null;
  const assetMetadata = structured ? getCoursewareAssetMetadata(structured) : null;
  const qualityReport = structured
    ? assetMetadata?.content_quality ?? assessCoursewareQuality(structured)
    : null;
  const pendingRevision =
    record && structured ? await getLatestPendingCoursewareRevisionRecord(supabase, record.id) : null;
  const feedbackRows =
    record && query.feedback === "student"
      ? await listCoursewareFeedbackForTeacher(supabase, record.id)
      : [];
  const feedbackInstruction = buildCoursewareFeedbackImprovementSummary(feedbackRows);
  const candidateStructured =
    pendingRevision && isCoursewareJson(pendingRevision.candidate_content_json)
      ? pendingRevision.candidate_content_json
      : null;
  const revisionQualityBefore =
    pendingRevision?.quality_before ?? (structured ? assessCoursewareQuality(structured) : null);
  const revisionQualityAfter =
    pendingRevision?.quality_after ??
    (candidateStructured ? assessCoursewareQuality(candidateStructured) : null);
  const focusPracticeIndex = structured
    ? parsePracticeIndex(query.practice, structured.practice_items.length)
    : null;
  const editMessage =
    query.edit === "saved"
      ? "课件编辑已保存，当前已取消发布，请确认后重新发布给学生。"
      : query.edit === "failed"
        ? "课件编辑保存失败，请检查内容后重试。"
        : null;
  const publishMessage =
    query.publish === "published"
      ? "课件已发布到学生端。"
      : query.publish === "unpublished"
        ? "课件已从学生端取消发布。"
        : query.publish === "needs-quality-confirmation"
          ? "课件仍有必选质量项未通过，请勾选风险确认后再发布。"
        : query.publish === "failed"
          ? "发布状态更新失败，请稍后重试。"
          : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          <Link
            href="/teacher/courseware-history"
            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
          >
            <span aria-hidden>←</span>
            返回课件历史
          </Link>
          <h1 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">课件详情</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {!record && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-sm">
            <p className="text-slate-600">未找到该课件记录</p>
            <Link
              href="/teacher/courseware-history"
              className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              返回列表
            </Link>
          </div>
        )}

        {record && (
          <article className="space-y-4">
            <div className="rounded-2xl border border-sky-200/60 bg-gradient-to-br from-sky-50 to-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-sky-600">
                    AI课件
                  </p>
                  <h2 className="mt-2 text-lg font-bold text-slate-900">
                    {record.knowledge_point_name}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {record.subject} · {record.grade} · {record.semester} · {record.chapter}
                  </p>
                </div>
                <Link
                  href="/teacher/courseware"
                  className="rounded-lg border border-sky-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-50"
                >
                  继续生成
                </Link>
              </div>
              <code className="mt-3 inline-block rounded-md bg-white/80 px-2 py-0.5 font-mono text-xs text-sky-800 ring-1 ring-sky-200/60">
                {record.knowledge_point_code}
              </code>
              <p className="mt-2 text-sm text-slate-500">
                创建时间：{formatCreatedAt(record.created_at)}
              </p>

              <div className="mt-5 rounded-xl border border-slate-200 bg-white/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">学生端发布状态</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      只有已发布且包含结构化 JSON 的课件，学生才能在知识点学习页看到。
                    </p>
                    {record.is_published && record.published_at ? (
                      <p className="mt-1 text-xs text-slate-500">
                        发布时间：{formatCreatedAt(record.published_at)}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      record.is_published
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {record.is_published ? "已发布" : "未发布"}
                  </span>
                </div>

                {publishMessage ? (
                  <p
                    className={`mt-3 rounded-lg px-3 py-2 text-xs ${
                      query.publish === "failed"
                        ? "bg-rose-50 text-rose-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {publishMessage}
                  </p>
                ) : null}

                {editMessage ? (
                  <p
                    className={`mt-3 rounded-lg px-3 py-2 text-xs ${
                      query.edit === "failed"
                        ? "bg-rose-50 text-rose-700"
                        : "bg-indigo-50 text-indigo-700"
                    }`}
                  >
                    {editMessage}
                  </p>
                ) : null}

                <form action={setCoursewarePublishedAction} className="mt-4">
                  <input type="hidden" name="id" value={record.id} />
                  <input
                    type="hidden"
                    name="isPublished"
                    value={record.is_published ? "false" : "true"}
                  />
                  {!record.is_published && qualityReport && !qualityReport.passedRequired ? (
                    <label className="mb-3 flex items-start gap-3 rounded-lg bg-amber-50 px-3 py-3 text-xs leading-5 text-amber-900 ring-1 ring-amber-100">
                      <input
                        type="checkbox"
                        name="confirmQualityRisk"
                        value="true"
                        className="mt-0.5 h-4 w-4 rounded border-amber-300 text-emerald-600"
                      />
                      <span>
                        我已复核质量风险，确认仍要发布给学生端。
                      </span>
                    </label>
                  ) : null}
                  <button
                    type="submit"
                    disabled={!structured}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      structured
                        ? record.is_published
                          ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "cursor-not-allowed bg-slate-100 text-slate-400"
                    }`}
                  >
                    {record.is_published ? "取消发布" : "发布到学生端"}
                  </button>
                  {!structured ? (
                    <p className="mt-2 text-xs text-slate-500">
                      该课件还没有结构化 JSON，暂不能发布给学生端复用。
                    </p>
                  ) : null}
                </form>
              </div>
            </div>

            {assetMetadata ? <AssetMetadataPanel metadata={assetMetadata} /> : null}

            {qualityReport ? (
              <ContentQualityPanel
                report={qualityReport}
                coursewareId={record.id}
                feedbackInstruction={feedbackInstruction}
                feedbackRows={feedbackRows}
              />
            ) : null}

            {qualityReport ? <CoursewareHumanReviewChecklist report={qualityReport} /> : null}

            {structured &&
            candidateStructured &&
            pendingRevision &&
            revisionQualityBefore &&
            revisionQualityAfter ? (
              <CoursewareRevisionComparison
                coursewareId={record.id}
                revisionId={pendingRevision.id}
                currentCourseware={displayStructured ?? structured}
                candidateCourseware={candidateStructured}
                qualityBefore={revisionQualityBefore}
                qualityAfter={revisionQualityAfter}
                instruction={pendingRevision.instruction}
              />
            ) : null}

            {structured ? (
              <section className="rounded-2xl border border-teal-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-teal-700">
                      课堂互动课件预览
                    </p>
                    <h3 className="mt-2 text-base font-semibold text-slate-900">
                      老师可投屏讲解，后续可转成 PPT 或讲义
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      当前由 AI 直接生成 HTML 互动幻灯片，前端只负责安全沙箱展示和保存；后续继续提升不同知识点的可视化表达能力。
                    </p>
                  </div>
                  <span className="w-fit rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-100">
                    PPT-ready
                  </span>
                </div>
                <div className="mt-5">
                  <DynamicCoursewareDemo
                    knowledgePointCode={structured.knowledge_point_code}
                    knowledgePointName={structured.knowledge_point_name}
                    slideTitle={structured.slides[0]?.title}
                    slideContent={structured.slides[0]?.content}
                    interactiveHtml={structured.interactive_html}
                    dynamicStoryboards={displayStructured?.dynamic_storyboards}
                    compact
                    coursewareId={record.id}
                  />
                </div>
              </section>
            ) : (
              <div id="dynamic-courseware-generator">
                <DynamicCoursewareGenerator
                  coursewareId={record.id}
                  initialMarkdown={record.content_markdown}
                />
              </div>
            )}

            {structured ? (
              <div id="dynamic-courseware-generator">
                <DynamicCoursewareGenerator
                  coursewareId={record.id}
                  initialMarkdown={record.content_markdown}
                  mode="regenerate"
                />
              </div>
            ) : null}

            {structured ? (
              <CoursewareJsonEditor
                coursewareId={record.id}
                initialJson={displayStructured ?? structured}
                isPublished={record.is_published}
                focusPracticeIndex={focusPracticeIndex}
              />
            ) : null}

            {structured ? (
              <section className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-emerald-700">
                      结构化 JSON 已保存
                    </p>
                    <h3 className="mt-2 text-base font-semibold text-slate-900">
                      可复用于学生端复习、练习和后续学情分析
                    </h3>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                    {structured.version}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-white/80 p-4 ring-1 ring-emerald-100">
                    <p className="text-xs text-slate-500">课件页数</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {structured.slides.length}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/80 p-4 ring-1 ring-emerald-100">
                    <p className="text-xs text-slate-500">基础练习</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {structured.practice_items.length}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/80 p-4 ring-1 ring-emerald-100">
                    <p className="text-xs text-slate-500">学习目标</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {structured.learning_goals.length}
                    </p>
                  </div>
                </div>

                <ul className="mt-5 list-disc space-y-1.5 pl-5 text-sm leading-6 text-slate-700">
                  {structured.learning_goals.map((goal) => (
                    <li key={goal}>{goal}</li>
                  ))}
                </ul>
              </section>
            ) : (
              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                该课件暂无结构化 JSON。新生成的课件会自动写入结构化数据。
              </section>
            )}
          </article>
        )}
      </main>
    </div>
  );
}
