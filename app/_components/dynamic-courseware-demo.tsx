"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildTeachingPanels, getInitialPlaybackStepIndex } from "@/lib/courseware-playback";
import { buildCoursewareSandboxedHtml } from "@/lib/courseware-sandbox";
import type {
  CoursewareInteractiveHtml,
  DynamicStoryboard,
  DynamicVisualElement,
} from "@/lib/courseware-types";

type DynamicCoursewareDemoProps = {
  knowledgePointCode: string;
  knowledgePointName: string;
  slideTitle?: string;
  slideContent?: string;
  interactiveHtml?: CoursewareInteractiveHtml;
  dynamicStoryboards?: DynamicStoryboard[];
  compact?: boolean;
  initialStepIndex?: number | null;
  coursewareId?: string;
};

type PlaybackPace = "normal" | "slow";
type TeachingPanel = {
  title: string;
  body: string;
  emphasis: string[];
};

const visualRoleClass: Record<NonNullable<DynamicVisualElement["role"]>, string> = {
  primary: "border-cyan-200/70 bg-cyan-300/15 text-cyan-50",
  secondary: "border-indigo-200/50 bg-indigo-300/12 text-indigo-50",
  emphasis: "border-rose-200/70 bg-rose-300/20 text-rose-50",
  success: "border-emerald-200/60 bg-emerald-300/15 text-emerald-50",
  warning: "border-amber-200/70 bg-amber-300/18 text-amber-50",
  muted: "border-white/10 bg-white/[0.06] text-slate-100",
};

const visualKindLabel: Record<DynamicVisualElement["kind"], string> = {
  title: "标题",
  text: "说明",
  formula: "公式",
  badge: "重点",
  panel: "面板",
  arrow: "变化",
  highlight: "高亮",
  number_line: "数轴",
  comparison: "对比",
};

function AiHtmlCoursewarePlayer({
  interactiveHtml,
  compact,
  coursewareId,
}: {
  interactiveHtml: CoursewareInteractiveHtml;
  compact?: boolean;
  coursewareId?: string;
}) {
  const [isLargePreviewOpen, setIsLargePreviewOpen] = useState(false);
  const largePreviewRef = useRef<HTMLDivElement | null>(null);
  const srcDoc = buildCoursewareSandboxedHtml(interactiveHtml.html);

  function openLargePreview() {
    setIsLargePreviewOpen(true);
    largePreviewRef.current?.requestFullscreen?.().catch(() => {
      // Fullscreen can be blocked by browser policy; the fixed preview layer still works.
    });
  }

  function closeLargePreview() {
    setIsLargePreviewOpen(false);

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => undefined);
    }
  }

  function printCourseware() {
    const url = URL.createObjectURL(new Blob([srcDoc], { type: "text/html;charset=utf-8" }));
    const preview = window.open(url, "_blank", "noopener,noreferrer");
    if (!preview) return;

    preview.focus();
    window.setTimeout(() => preview.print(), 500);
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  const previewHref = coursewareId ? `/teacher/courseware-preview/${coursewareId}` : null;

  function downloadHtml() {
    const blob = new Blob([srcDoc], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filename = `${interactiveHtml.title || "courseware"}.html`.replace(/[\\/:*?"<>|]/g, "-");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-4 py-3 text-white">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
            AI 生成动态互动课件
          </p>
          <h3 className="mt-1 text-base font-semibold">{interactiveHtml.title}</h3>
          {interactiveHtml.instructions ? (
            <p className="mt-1 text-xs leading-5 text-slate-400">
              {interactiveHtml.instructions}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openLargePreview}
            className="rounded-full border border-cyan-300/25 px-3 py-1 text-xs font-semibold text-cyan-50 transition hover:bg-cyan-300/10"
          >
            大屏预览
          </button>
          {previewHref ? (
            <a
              href={previewHref}
              target="_blank"
              className="rounded-full border border-cyan-300/25 px-3 py-1 text-xs font-semibold text-cyan-50 transition hover:bg-cyan-300/10"
            >
              新窗口打开
            </a>
          ) : null}
          <button
            type="button"
            onClick={printCourseware}
            className="rounded-full border border-cyan-300/25 px-3 py-1 text-xs font-semibold text-cyan-50 transition hover:bg-cyan-300/10"
          >
            打印/保存PDF
          </button>
          <button
            type="button"
            onClick={downloadHtml}
            className="rounded-full border border-cyan-300/25 px-3 py-1 text-xs font-semibold text-cyan-50 transition hover:bg-cyan-300/10"
          >
            下载HTML
          </button>
          <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100 ring-1 ring-cyan-300/20">
            PPT-ready
          </span>
        </div>
      </div>
      <div className="bg-slate-950 p-3">
        <iframe
          title={interactiveHtml.title}
          sandbox="allow-scripts"
          srcDoc={srcDoc}
          className="block aspect-video w-full rounded-xl border border-white/10 bg-slate-950"
        />
      </div>
      {isLargePreviewOpen ? (
        <div
          ref={largePreviewRef}
          className="fixed inset-0 z-[80] flex flex-col bg-slate-950 text-white"
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                课堂投屏预览
              </p>
              <h3 className="truncate text-base font-semibold">{interactiveHtml.title}</h3>
            </div>
            <div className="flex items-center gap-2">
              {previewHref ? (
                <a
                  href={previewHref}
                  target="_blank"
                  className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  新窗口
                </a>
              ) : null}
              <button
                type="button"
                onClick={closeLargePreview}
                className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                退出预览
              </button>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center p-3">
            <iframe
              title={`${interactiveHtml.title} 大屏预览`}
              sandbox="allow-scripts"
              srcDoc={srcDoc}
              className="rounded-xl border border-white/10 bg-slate-950 shadow-2xl"
              style={{
                width: "min(100vw, calc((100vh - 88px) * 16 / 9))",
                height: "min(calc(100vh - 88px), calc(100vw * 9 / 16))",
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LegacyDynamicNotice({ knowledgePointName }: { knowledgePointName: string }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-slate-800 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
        旧版动态课件
      </p>
      <h3 className="mt-2 text-base font-semibold text-slate-900">
        需要重新生成互动幻灯片
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        这份「{knowledgePointName}」课件还没有 AI 直接生成的 HTML 动态幻灯片。
        为避免继续展示固定播放器样式，请点击下方“重新生成互动幻灯片”，生成新的互动课件后再预览。
      </p>
    </div>
  );
}

function getPacedDuration(baseDuration: number, pace: PlaybackPace) {
  return pace === "slow" ? Math.round(baseDuration * 1.55) : baseDuration;
}

function clampDuration(duration: number) {
  return Math.min(6500, Math.max(1800, duration));
}

function getStoryboardStepDuration(
  step: DynamicStoryboard["steps"][number],
  pace: PlaybackPace
) {
  const textLoad = [
    step.step_title,
    step.narration,
    step.visual_state,
    step.formula_or_state,
    step.operation,
    step.operation_reason,
    step.student_check,
    ...(step.visual_elements ?? []).map((item) => item.text),
  ]
    .filter(Boolean)
    .join("").length;
  const emphasisLoad = (step.emphasis_points?.length ?? 0) * 350;
  const baseDuration = clampDuration(1800 + textLoad * 16 + emphasisLoad);

  return getPacedDuration(baseDuration, pace);
}

function elementClassName(element: DynamicVisualElement) {
  const role =
    element.role ??
    (element.kind === "badge" || element.kind === "highlight" ? "emphasis" : "muted");
  const size =
    element.kind === "formula" || element.kind === "title"
      ? "md:col-span-2 px-5 py-4"
      : "px-4 py-3";

  return `rounded-2xl border ${visualRoleClass[role]} ${size} shadow-sm transition-all duration-500`;
}

function VisualElementCard({ element }: { element: DynamicVisualElement }) {
  const isFormula = element.kind === "formula";
  const isTitle = element.kind === "title";
  const isArrow = element.kind === "arrow";

  return (
    <div className={elementClassName(element)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">
          {visualKindLabel[element.kind]}
        </span>
        {element.group ? (
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/60">
            {element.group}
          </span>
        ) : null}
      </div>
      <p
        className={`mt-2 whitespace-pre-wrap ${
          isFormula
            ? "text-2xl font-black tracking-tight md:text-3xl"
            : isTitle
              ? "text-xl font-bold md:text-2xl"
              : isArrow
                ? "text-base font-bold"
                : "text-sm font-semibold leading-6"
        }`}
      >
        {isArrow ? `-> ${element.text}` : element.text}
      </p>
      {element.items && element.items.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {element.items.map((item) => (
            <span
              key={item}
              className="rounded-full bg-white/14 px-2.5 py-1 text-xs font-semibold text-white"
            >
              {item}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function VisualSlideCanvas({ step }: { step: DynamicStoryboard["steps"][number] }) {
  const elements = step.visual_elements?.length
    ? step.visual_elements
    : [
        {
          kind: "formula",
          role: "primary",
          text: step.formula_or_state || step.visual_state,
          group: "main",
        } satisfies DynamicVisualElement,
        ...(step.emphasis_points ?? []).slice(0, 3).map(
          (point) =>
            ({
              kind: "badge",
              role: "emphasis",
              text: point,
              group: "focus",
            }) satisfies DynamicVisualElement
        ),
      ];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.18),transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.95),rgba(30,41,59,0.9))] p-5">
      <div className="absolute right-5 top-5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold text-white/60">
        AI 画面
      </div>
      <div className="grid gap-3 pt-6 md:grid-cols-2">
        {elements.slice(0, 10).map((element, index) => (
          <VisualElementCard key={`${element.kind}-${element.text}-${index}`} element={element} />
        ))}
      </div>
    </div>
  );
}

function StoryboardStage({
  storyboard,
  compact = false,
  initialStepIndex,
}: {
  storyboard: DynamicStoryboard;
  compact?: boolean;
  initialStepIndex?: number | null;
}) {
  const stepRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const detailRef = useRef<HTMLDivElement | null>(null);
  const steps = storyboard.steps;
  const [stepIndex, setStepIndex] = useState(() =>
    getInitialPlaybackStepIndex(initialStepIndex, steps.length)
  );
  const [playing, setPlaying] = useState(false);
  const [pace, setPace] = useState<PlaybackPace>("normal");
  const step = steps[stepIndex] ?? steps[0];
  const previousStep = stepIndex > 0 ? steps[stepIndex - 1] : null;
  const progressPercent = steps.length > 1 ? (stepIndex / (steps.length - 1)) * 100 : 100;
  const stepDuration = useMemo(
    () => getStoryboardStepDuration(step, pace),
    [pace, step]
  );
  const teachingPanels = useMemo<TeachingPanel[]>(
    () => buildTeachingPanels({ previousStep, currentStep: step }),
    [previousStep, step]
  );

  useEffect(() => {
    if (initialStepIndex === null || initialStepIndex === undefined) return;

    setPlaying(false);
    setStepIndex(getInitialPlaybackStepIndex(initialStepIndex, steps.length));
  }, [initialStepIndex, steps.length]);

  useEffect(() => {
    if (!playing || steps.length <= 1) return;

    const timer = window.setTimeout(() => {
      setStepIndex((current) => {
        if (current >= steps.length - 1) {
          setPlaying(false);
          return current;
        }

        return current + 1;
      });
    }, stepDuration);

    return () => window.clearTimeout(timer);
  }, [playing, stepDuration, steps.length]);

  useEffect(() => {
    stepRefs.current[stepIndex]?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
    detailRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [stepIndex]);

  if (!step) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-white shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
            幻灯片式动态课件 · AI 画面分镜
          </p>
          <h3 className="mt-1 text-base font-semibold">{storyboard.title}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            {storyboard.learning_objective}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setStepIndex((current) => Math.max(0, current - 1));
            }}
            disabled={stepIndex === 0}
            className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-slate-500"
          >
            上一步
          </button>
          <button
            type="button"
            onClick={() => setPlaying((current) => !current)}
            className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-cyan-400"
          >
            {playing ? "暂停" : "播放"}
          </button>
          <button
            type="button"
            onClick={() => setPace((current) => (current === "normal" ? "slow" : "normal"))}
            className="rounded-lg border border-cyan-300/30 px-3 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-300/10"
          >
            {pace === "slow" ? "慢放中" : "慢放"}
          </button>
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setStepIndex((current) => Math.min(steps.length - 1, current + 1));
            }}
            disabled={stepIndex === steps.length - 1}
            className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-slate-500"
          >
            下一步
          </button>
        </div>
      </div>

      <div className={compact ? "p-4" : "p-5"}>
        <div className="relative aspect-video overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_18%_18%,rgba(6,182,212,0.24),transparent_30%),linear-gradient(135deg,#0f172a,#111827_58%,#0f172a)] p-5">
          <div className="absolute inset-x-5 top-5 flex items-center justify-between text-xs text-slate-300">
            <span>同一画面保留完整过程</span>
            <span>
              第 {stepIndex + 1} / {steps.length} 步
            </span>
            <span>{Math.round(stepDuration / 1000)} 秒节奏</span>
          </div>

          <div className="grid h-full gap-5 pb-8 pt-8 md:grid-cols-[0.9fr_1.1fr]">
            <div className="min-h-0 overflow-y-auto pr-1">
              <div className="space-y-2">
                {steps.map((item, index) => (
                  <button
                    key={`${item.step_title}-${index}`}
                    ref={(node) => {
                      stepRefs.current[index] = node;
                    }}
                    type="button"
                    onClick={() => {
                      setPlaying(false);
                      setStepIndex(index);
                    }}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition-all duration-500 ${
                      index === stepIndex
                        ? "scale-[1.01] border-cyan-300 bg-cyan-300/15 shadow-lg shadow-cyan-950/40"
                        : index < stepIndex
                          ? "border-emerald-300/30 bg-emerald-300/10 opacity-90"
                          : "border-white/10 bg-white/[0.04] opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-slate-300">
                        {index + 1}. {item.step_title}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          index === stepIndex
                            ? "bg-cyan-300 text-slate-950"
                            : index < stepIndex
                              ? "bg-emerald-300 text-slate-950"
                              : "bg-white/10 text-slate-300"
                        }`}
                      >
                        {index < stepIndex ? "已讲清" : index === stepIndex ? "正在讲" : "待展示"}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-100">
                      {item.formula_or_state || item.visual_state}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div ref={detailRef} className="min-h-0 overflow-y-auto pr-1">
              <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-wider text-cyan-200">
                  当前画面
                </p>
                <h4 className="mt-3 text-2xl font-bold leading-tight text-white">
                  {step.step_title}
                </h4>
                <div className="mt-4">
                  <VisualSlideCanvas step={step} />
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-200">
                  {step.narration}
                </p>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {teachingPanels.map((panel, index) => (
                    <div
                      key={`${panel.title}-${index}`}
                      className={`rounded-2xl p-4 ring-1 ${
                        panel.title === "当前画面"
                          ? "bg-cyan-300/10 ring-cyan-300/20 md:col-span-2"
                          : panel.title === "本步操作"
                            ? "bg-amber-300/10 ring-amber-300/20"
                            : panel.title === "上一画面"
                              ? "bg-white/[0.05] ring-white/10 md:col-span-2"
                              : "bg-white/[0.06] ring-white/10"
                      }`}
                    >
                      <p className="text-xs font-semibold text-slate-200">
                        {index + 1}. {panel.title}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-100">
                        {panel.body}
                      </p>
                      {panel.emphasis.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {panel.emphasis.map((point) => (
                            <span
                              key={point}
                              className="rounded-full bg-rose-200 px-2.5 py-1 text-xs font-bold text-rose-950"
                            >
                              {point}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10">
                  <p className="text-xs font-semibold text-slate-200">学生检查点</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{step.student_check}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    老师追问：{step.teacher_prompt}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute inset-x-5 bottom-5">
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-cyan-300 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-2 line-clamp-1 text-[10px] font-medium text-slate-400">
              {storyboard.summary}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function GenericStepDemo({
  knowledgePointName,
  slideTitle,
  slideContent,
  initialStepIndex,
}: Pick<
  DynamicCoursewareDemoProps,
  "knowledgePointName" | "slideTitle" | "slideContent" | "initialStepIndex"
>) {
  const steps = useMemo(() => {
    const raw = (slideContent ?? "")
      .split(/[。；;\n]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 4);

    return raw.length > 0
      ? raw
      : ["先读懂概念", "找出关键条件", "按步骤解决问题", "回到题目检查结果"];
  }, [slideContent]);
  const [active, setActive] = useState(() =>
    getInitialPlaybackStepIndex(initialStepIndex, steps.length)
  );
  const progressPercent = steps.length > 1 ? (active / (steps.length - 1)) * 100 : 100;

  useEffect(() => {
    if (initialStepIndex === null || initialStepIndex === undefined) return;

    setActive(getInitialPlaybackStepIndex(initialStepIndex, steps.length));
  }, [initialStepIndex, steps.length]);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-white shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-300">
            幻灯片式动态课件 · 分步理解
          </p>
          <h3 className="mt-1 text-base font-semibold">
            {slideTitle || knowledgePointName}
          </h3>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActive((current) => Math.max(0, current - 1))}
            disabled={active === 0}
            className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-slate-500"
          >
            上一步
          </button>
          <button
            type="button"
            onClick={() => setActive((current) => Math.min(steps.length - 1, current + 1))}
            disabled={active === steps.length - 1}
            className="rounded-lg bg-violet-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            下一步
          </button>
        </div>
      </div>

      <div className="p-5">
        <div className="relative aspect-video overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_72%_18%,rgba(139,92,246,0.24),transparent_30%),linear-gradient(135deg,#0f172a,#111827_58%,#0f172a)] p-6">
          <div className="grid h-full gap-4 pb-8 md:grid-cols-[240px_1fr]">
            <div className="min-h-0 space-y-2 overflow-y-auto pr-1">
              {steps.map((step, index) => (
                <button
                  key={`${step}-${index}`}
                  type="button"
                  onClick={() => setActive(index)}
                  className={`rounded-xl border px-3 py-3 text-left text-sm font-semibold transition-all ${
                    index === active
                      ? "scale-[1.02] border-violet-300 bg-violet-300/20 text-white"
                      : index < active
                        ? "border-emerald-300/30 bg-emerald-300/10 text-slate-200"
                        : "border-white/10 bg-white/[0.04] text-slate-400"
                  }`}
                >
                  第 {index + 1} 步
                </button>
              ))}
            </div>
            <div className="min-h-0 overflow-y-auto pr-1">
              <div className="w-full rounded-3xl border border-white/10 bg-white/[0.06] p-8">
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-200">
                  当前画面
                </p>
                <p className="mt-5 text-3xl font-bold leading-tight text-white">
                  {steps[active]}
                </p>
                <p className="mt-5 text-sm leading-7 text-slate-300">
                  这是旧课件兜底展示。新生成的动态课件会由 AI 输出画面元素并进入 AI 分镜播放器。
                </p>
              </div>
            </div>
          </div>
          <div className="absolute inset-x-6 bottom-5">
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-violet-300 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DynamicCoursewareDemo({
  knowledgePointName,
  interactiveHtml,
  compact = false,
  coursewareId,
}: DynamicCoursewareDemoProps) {
  if (interactiveHtml?.html) {
    return (
      <AiHtmlCoursewarePlayer
        interactiveHtml={interactiveHtml}
        compact={compact}
        coursewareId={coursewareId}
      />
    );
  }

  return <LegacyDynamicNotice knowledgePointName={knowledgePointName} />;
}
