"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DynamicCoursewareDemo } from "@/app/_components/dynamic-courseware-demo";
import { buildCoursewareAdoptionAdvice } from "@/lib/courseware-adoption-advice";
import type { CoursewareQualityReport } from "@/lib/courseware-quality";
import { buildCoursewareQualityReviewSummary } from "@/lib/courseware-quality-summary";
import { getCoursewareRevisionApplyGuard } from "@/lib/courseware-revision-apply-guard";
import { buildCoursewareRevisionDiffSummary } from "@/lib/courseware-revision-diff";
import { normalizeCoursewareStoryboardsForDisplay } from "@/lib/courseware-storyboard";
import type { CoursewareJson } from "@/lib/courseware-types";

type CoursewareRevisionComparisonProps = {
  coursewareId: string;
  revisionId: string;
  currentCourseware: CoursewareJson;
  candidateCourseware: CoursewareJson;
  qualityBefore: CoursewareQualityReport;
  qualityAfter: CoursewareQualityReport;
  instruction: string | null;
};

function QualityBadge({ label, report }: { label: string; report: CoursewareQualityReport }) {
  return (
    <div className="rounded-xl bg-white/80 p-4 ring-1 ring-black/5">
      <p className="text-xs text-slate-500">{label}</p>
      <div className="mt-1 flex items-end gap-2">
        <p className="text-2xl font-bold text-slate-900">{report.score}</p>
        <p
          className={`pb-1 text-xs font-semibold ${
            report.passedRequired ? "text-emerald-700" : "text-amber-700"
          }`}
        >
          {report.passedRequired ? "必选项已通过" : "仍需复核必选项"}
        </p>
      </div>
    </div>
  );
}

function getAdviceClass(level: "adopt" | "trial" | "hold") {
  if (level === "adopt") {
    return "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100";
  }

  if (level === "trial") {
    return "bg-sky-50 text-sky-900 ring-1 ring-sky-100";
  }

  return "bg-amber-50 text-amber-900 ring-1 ring-amber-100";
}

export function CoursewareRevisionComparison({
  coursewareId,
  revisionId,
  currentCourseware,
  candidateCourseware,
  qualityBefore,
  qualityAfter,
  instruction,
}: CoursewareRevisionComparisonProps) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<"apply" | "discard" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [riskConfirmed, setRiskConfirmed] = useState(false);
  const currentDisplay = normalizeCoursewareStoryboardsForDisplay(currentCourseware);
  const candidateDisplay = normalizeCoursewareStoryboardsForDisplay(candidateCourseware);
  const diffSummary = buildCoursewareRevisionDiffSummary({
    currentCourseware,
    candidateCourseware,
    qualityBefore,
    qualityAfter,
  });
  const qualityReviewSummary = buildCoursewareQualityReviewSummary(qualityAfter);
  const applyGuard = getCoursewareRevisionApplyGuard(qualityAfter, riskConfirmed);
  const adoptionAdvice = buildCoursewareAdoptionAdvice({
    before: qualityBefore,
    after: qualityAfter,
  });

  async function submit(action: "apply" | "discard") {
    if (action === "apply" && !applyGuard.canApply) {
      setError(applyGuard.message);
      return;
    }

    setLoadingAction(action);
    setError(null);

    try {
      const response = await fetch(
        `/api/courseware/${coursewareId}/revisions/${revisionId}/${action}`,
        {
          method: "POST",
          headers: action === "apply" ? { "Content-Type": "application/json" } : undefined,
          body:
            action === "apply"
              ? JSON.stringify({ confirmQualityRisk: riskConfirmed })
              : undefined,
        }
      );
      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "处理优化版本失败，请稍后再试。");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "处理优化版本失败，请稍后再试。");
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <section className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-6 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-indigo-700">
            课件优化候选版
          </p>
          <h3 className="mt-2 text-base font-semibold text-slate-900">
            当前版本 / 优化版本对比
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            AI 已生成一份优化候选版。老师确认前不会覆盖当前课件，也不会影响学生端。
          </p>
          {instruction ? (
            <p className="mt-2 rounded-lg bg-white/75 px-3 py-2 text-xs leading-5 text-indigo-800 ring-1 ring-indigo-100">
              优化要求：{instruction}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void submit("discard")}
            disabled={Boolean(loadingAction)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            {loadingAction === "discard" ? "正在放弃..." : "放弃新版"}
          </button>
          <button
            type="button"
            onClick={() => void submit("apply")}
            disabled={Boolean(loadingAction) || !applyGuard.canApply}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            {loadingAction === "apply" ? "正在采用..." : "采用新版"}
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-xl bg-white/85 p-4 ring-1 ring-black/5">
        <div className={`mb-4 rounded-xl px-4 py-3 ${getAdviceClass(adoptionAdvice.level)}`}>
          <p className="text-sm font-semibold">{adoptionAdvice.title}</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-xs leading-5">
            {adoptionAdvice.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>

        <p className="text-sm font-semibold text-slate-900">新版改了什么</p>
        <ul className="mt-2 grid gap-2 text-sm leading-6 text-slate-700 md:grid-cols-2">
          {diffSummary.highlights.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        {diffSummary.slideTitleChanges.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {diffSummary.slideTitleChanges.slice(0, 6).map((item) => (
              <span
                key={item}
                className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-800"
              >
                {item}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <QualityBadge label="当前版质量分" report={qualityBefore} />
        <QualityBadge label="优化版质量分" report={qualityAfter} />
      </div>

      <div className="mt-5 rounded-xl bg-white/85 p-4 ring-1 ring-black/5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900">新版还要复核什么</p>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              qualityReviewSummary.statusLabel === "可进入人工确认"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {qualityReviewSummary.statusLabel}
          </span>
        </div>
        {qualityReviewSummary.requiredItems.length > 0 ? (
          <div className="mt-3">
            <p className="text-xs font-semibold text-amber-800">必须复核</p>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
              {qualityReviewSummary.requiredItems.map((item) => (
                <li key={item} className="rounded-lg bg-amber-50 px-3 py-2 text-amber-900">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {qualityReviewSummary.recommendedItems.length > 0 ? (
          <div className="mt-3">
            <p className="text-xs font-semibold text-slate-600">建议优化</p>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
              {qualityReviewSummary.recommendedItems.map((item) => (
                <li key={item} className="rounded-lg bg-slate-50 px-3 py-2 text-slate-700">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {qualityReviewSummary.requiredItems.length === 0 &&
        qualityReviewSummary.recommendedItems.length === 0 ? (
          <p className="mt-3 text-sm leading-6 text-slate-600">
            自动检查未发现明显缺口，仍建议老师重点确认数学推导、例题答案和课堂投屏效果。
          </p>
        ) : null}
        {applyGuard.requiresRiskConfirmation ? (
          <label className="mt-4 flex items-start gap-3 rounded-lg bg-amber-50 px-3 py-3 text-sm leading-6 text-amber-900 ring-1 ring-amber-100">
            <input
              type="checkbox"
              checked={riskConfirmed}
              onChange={(event) => {
                setRiskConfirmed(event.currentTarget.checked);
                if (event.currentTarget.checked) {
                  setError(null);
                }
              }}
              className="mt-1 h-4 w-4 rounded border-amber-300 text-indigo-600"
            />
            <span>我已复核上述必选质量问题，确认仍要采用这个优化版本。</span>
          </label>
        ) : null}
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <div>
          <h4 className="mb-3 text-sm font-semibold text-slate-900">当前版本预览</h4>
          <DynamicCoursewareDemo
            knowledgePointCode={currentCourseware.knowledge_point_code}
            knowledgePointName={currentCourseware.knowledge_point_name}
            slideTitle={currentCourseware.slides[0]?.title}
            slideContent={currentCourseware.slides[0]?.content}
            interactiveHtml={currentCourseware.interactive_html}
            dynamicStoryboards={currentDisplay.dynamic_storyboards}
            compact
          />
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-slate-900">优化版本预览</h4>
          <DynamicCoursewareDemo
            knowledgePointCode={candidateCourseware.knowledge_point_code}
            knowledgePointName={candidateCourseware.knowledge_point_name}
            slideTitle={candidateCourseware.slides[0]?.title}
            slideContent={candidateCourseware.slides[0]?.content}
            interactiveHtml={candidateCourseware.interactive_html}
            dynamicStoryboards={candidateDisplay.dynamic_storyboards}
            compact
          />
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
    </section>
  );
}
