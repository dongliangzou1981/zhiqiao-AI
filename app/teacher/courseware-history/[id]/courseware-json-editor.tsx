"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getPracticeTargetStepOptions } from "@/lib/courseware-edit";
import type { CoursewareJson } from "@/lib/courseware-types";

type CoursewareJsonEditorProps = {
  coursewareId: string;
  initialJson: CoursewareJson;
  isPublished: boolean;
  focusPracticeIndex: number | null;
};

type SlideDraft = CoursewareJson["slides"][number];
type PracticeDraft = CoursewareJson["practice_items"][number];
type StoryboardStepDraft = NonNullable<
  CoursewareJson["dynamic_storyboards"]
>[number]["steps"][number];

const difficultyOptions: PracticeDraft["difficulty"][] = ["基础", "易错纠正", "拓展挑战"];

function cloneJson(json: CoursewareJson): CoursewareJson {
  return JSON.parse(JSON.stringify(json)) as CoursewareJson;
}

function joinLines(items: string[]) {
  return items.join("\n");
}

function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function CoursewareJsonEditor({
  coursewareId,
  initialJson,
  isPublished,
  focusPracticeIndex,
}: CoursewareJsonEditorProps) {
  const router = useRouter();
  const [draft, setDraft] = useState(() => cloneJson(initialJson));
  const [learningGoalsText, setLearningGoalsText] = useState(() =>
    joinLines(initialJson.learning_goals)
  );
  const [summaryText, setSummaryText] = useState(() => joinLines(initialJson.summary_points));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const practiceRefs = useRef<Array<HTMLDivElement | null>>([]);
  const targetStepOptions = useMemo(
    () => getPracticeTargetStepOptions(draft.dynamic_storyboards),
    [draft.dynamic_storyboards]
  );

  const serialized = useMemo(
    () =>
      JSON.stringify({
        ...draft,
        learning_goals: splitLines(learningGoalsText),
        summary_points: splitLines(summaryText),
      }),
    [draft, learningGoalsText, summaryText]
  );

  function updateSlide(index: number, patch: Partial<SlideDraft>) {
    setDraft((current) => ({
      ...current,
      slides: current.slides.map((slide, slideIndex) =>
        slideIndex === index ? { ...slide, ...patch } : slide
      ),
    }));
  }

  function removeSlide(index: number) {
    setDraft((current) => {
      if (current.slides.length <= 1) {
        return current;
      }

      return {
        ...current,
        slides: current.slides.filter((_, slideIndex) => slideIndex !== index),
      };
    });
  }

  function updatePractice(index: number, patch: Partial<PracticeDraft>) {
    setDraft((current) => ({
      ...current,
      practice_items: current.practice_items.map((practice, practiceIndex) =>
        practiceIndex === index ? { ...practice, ...patch } : practice
      ),
    }));
  }

  function removePractice(index: number) {
    setDraft((current) => {
      if (current.practice_items.length <= 1) {
        return current;
      }

      return {
        ...current,
        practice_items: current.practice_items.filter(
          (_, practiceIndex) => practiceIndex !== index
        ),
      };
    });
  }

  function updateStoryboardStep(
    storyboardIndex: number,
    stepIndex: number,
    patch: Partial<StoryboardStepDraft>
  ) {
    setDraft((current) => ({
      ...current,
      dynamic_storyboards: (current.dynamic_storyboards ?? []).map((storyboard, index) =>
        index === storyboardIndex
          ? {
              ...storyboard,
              steps: storyboard.steps.map((step, currentStepIndex) =>
                currentStepIndex === stepIndex ? { ...step, ...patch } : step
              ),
            }
          : storyboard
      ),
    }));
  }

  useEffect(() => {
    if (focusPracticeIndex === null) return;

    const timer = window.setTimeout(() => {
      practiceRefs.current[focusPracticeIndex]?.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [focusPracticeIndex]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/courseware/${coursewareId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentJson: JSON.parse(serialized) }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "课件编辑保存失败");
      }

      router.push(`/teacher/courseware-history/${coursewareId}?edit=saved`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "课件编辑保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-indigo-600">
            老师可编辑课件
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">
            先确认内容，再发布给学生
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            AI 生成的是初稿。这里可以调整学习目标、课件页面和基础练习，保存后会自动取消发布，
            需要老师重新点击发布，学生端才会看到新版本。
          </p>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
          {draft.slides.length} 页 · {draft.practice_items.length} 题
        </span>
      </div>

      {isPublished ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
          当前课件已发布。保存编辑后会先取消发布，避免学生看到未经确认的新内容。
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-800">学习目标</span>
              <textarea
                value={learningGoalsText}
                onChange={(event) => setLearningGoalsText(event.target.value)}
                rows={5}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-800">课堂小结</span>
              <textarea
                value={summaryText}
                onChange={(event) => setSummaryText(event.target.value)}
                rows={5}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              />
            </label>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">文本课件内容</p>
              <p className="mt-1 text-xs text-slate-500">
                这里调整学习目标、页面内容、例题和练习；上方互动幻灯片由 AI 单独生成。
              </p>
            </div>

            {draft.slides.map((slide, index) => (
              <div key={`${slide.slide_type}-${index}`} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    第 {index + 1} 页 · {slide.slide_type}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeSlide(index)}
                    disabled={draft.slides.length <= 1}
                    className="rounded-lg px-2 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    删除本页
                  </button>
                </div>

                <label className="mt-3 block">
                  <span className="text-xs font-medium text-slate-500">页面标题</span>
                  <input
                    value={slide.title}
                    onChange={(event) => updateSlide(index, { title: event.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </label>

                <label className="mt-3 block">
                  <span className="text-xs font-medium text-slate-500">页面内容</span>
                  <textarea
                    value={slide.content}
                    onChange={(event) => updateSlide(index, { content: event.target.value })}
                    rows={4}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm leading-6 text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </label>

                <label className="mt-3 block">
                  <span className="text-xs font-medium text-slate-500">老师备注</span>
                  <textarea
                    value={slide.teacher_notes ?? ""}
                    onChange={(event) =>
                      updateSlide(index, { teacher_notes: event.target.value })
                    }
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm leading-6 text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </label>
              </div>
            ))}
          </div>
        </div>

        {(draft.dynamic_storyboards ?? []).length > 0 ? (
          <div className="rounded-2xl border border-cyan-200 bg-cyan-50/60 p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">分步画面与讲解微调</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  这里编辑学生端看到的每一步画面、教师讲解和重点提醒，不需要理解脚本。
                  如果 AI 省略了关键过程，老师可以直接补充；保存后需要重新发布。
                </p>
              </div>
              <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-cyan-700 ring-1 ring-cyan-100">
                {(draft.dynamic_storyboards ?? [])[0]?.steps.length ?? 0} 步
              </span>
            </div>

            <div className="mt-4 space-y-5">
              {(draft.dynamic_storyboards ?? []).map((storyboard, storyboardIndex) => (
                <div
                  key={`${storyboard.title}-${storyboardIndex}`}
                  className="rounded-xl border border-cyan-100 bg-white p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{storyboard.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {storyboard.learning_objective}
                      </p>
                    </div>
                    <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700">
                      AI 分镜
                    </span>
                  </div>

                  <div className="mt-4 space-y-4">
                    {storyboard.steps.map((step, stepIndex) => (
                      <div
                        key={`${step.step_title}-${stepIndex}`}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="grid gap-3 md:grid-cols-2">
                          <label className="block">
                            <span className="text-xs font-medium text-slate-500">步骤标题</span>
                            <input
                              value={step.step_title}
                              onChange={(event) =>
                                updateStoryboardStep(storyboardIndex, stepIndex, {
                                  step_title: event.target.value,
                                })
                              }
                              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                            />
                          </label>
                          <label className="block">
                            <span className="text-xs font-medium text-slate-500">
                              公式或状态
                            </span>
                            <input
                              value={step.formula_or_state ?? ""}
                              onChange={(event) =>
                                updateStoryboardStep(storyboardIndex, stepIndex, {
                                  formula_or_state: event.target.value,
                                })
                              }
                              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                            />
                          </label>
                        </div>

                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <label className="block">
                            <span className="text-xs font-medium text-slate-500">
                              学生看到的画面
                            </span>
                            <textarea
                              value={step.visual_state}
                              onChange={(event) =>
                                updateStoryboardStep(storyboardIndex, stepIndex, {
                                  visual_state: event.target.value,
                                })
                              }
                              rows={3}
                              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm leading-6 text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                            />
                          </label>
                          <label className="block">
                            <span className="text-xs font-medium text-slate-500">
                              教师讲解
                            </span>
                            <textarea
                              value={step.narration}
                              onChange={(event) =>
                                updateStoryboardStep(storyboardIndex, stepIndex, {
                                  narration: event.target.value,
                                })
                              }
                              rows={3}
                              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm leading-6 text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                            />
                          </label>
                        </div>

                        <label className="mt-3 block">
                          <span className="text-xs font-medium text-rose-600">
                            本步重点标记
                          </span>
                          <textarea
                            value={(step.emphasis_points ?? []).join("\n")}
                            onChange={(event) =>
                              updateStoryboardStep(storyboardIndex, stepIndex, {
                                emphasis_points: splitLines(event.target.value),
                              })
                            }
                            rows={2}
                            className="mt-1 w-full rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm leading-6 text-rose-900 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                          />
                          <p className="mt-1 text-xs text-slate-500">
                            每行一个重点，用于学生端标红或高亮提醒。
                          </p>
                        </label>

                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <label className="block">
                            <span className="text-xs font-medium text-slate-500">这一步做什么</span>
                            <textarea
                              value={step.operation ?? ""}
                              onChange={(event) =>
                                updateStoryboardStep(storyboardIndex, stepIndex, {
                                  operation: event.target.value,
                                })
                              }
                              rows={2}
                              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm leading-6 text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                            />
                          </label>
                          <label className="block">
                            <span className="text-xs font-medium text-slate-500">为什么这样做</span>
                            <textarea
                              value={step.operation_reason ?? ""}
                              onChange={(event) =>
                                updateStoryboardStep(storyboardIndex, stepIndex, {
                                  operation_reason: event.target.value,
                                })
                              }
                              rows={2}
                              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm leading-6 text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                            />
                          </label>
                        </div>

                        <label className="mt-3 block">
                          <span className="text-xs font-medium text-slate-500">
                            给学生的检查问题
                          </span>
                          <textarea
                            value={step.student_check ?? ""}
                            onChange={(event) =>
                              updateStoryboardStep(storyboardIndex, stepIndex, {
                                student_check: event.target.value,
                              })
                            }
                            rows={2}
                            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm leading-6 text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                          />
                          <p className="mt-1 text-xs text-slate-500">
                            用一句话提醒学生本步要看懂什么，避免只看动画、不思考。
                          </p>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4 text-sm leading-6 text-slate-600">
            该课件暂无分步画面。保存编辑时系统会按现有课件内容补一个基础演示；
            新生成课件会优先由 AI 生成完整的画面分镜。
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">基础练习</p>
          {focusPracticeIndex !== null ? (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
              正在查看第 {focusPracticeIndex + 1} 题。可以对照学生错题记录，检查题目、答案和解析是否需要调整。
            </div>
          ) : null}
          <div className="mt-4 space-y-4">
            {draft.practice_items.map((practice, index) => (
              <div
                key={`${practice.difficulty}-${index}`}
                id={`practice-${index + 1}`}
                ref={(node) => {
                  practiceRefs.current[index] = node;
                }}
                className={`rounded-xl border bg-white p-4 transition ${
                  focusPracticeIndex === index
                    ? "border-amber-300 ring-4 ring-amber-200"
                    : "border-slate-200"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                    第 {index + 1} 题
                  </span>
                  <button
                    type="button"
                    onClick={() => removePractice(index)}
                    disabled={draft.practice_items.length <= 1}
                    className="rounded-lg px-2 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    删除本题
                  </button>
                </div>

                <label className="mt-3 block">
                  <span className="text-xs font-medium text-slate-500">题目</span>
                  <textarea
                    value={practice.question}
                    onChange={(event) => updatePractice(index, { question: event.target.value })}
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm leading-6 text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </label>

                <div className="mt-3 grid gap-3 md:grid-cols-[160px_1fr]">
                  <label className="block">
                    <span className="text-xs font-medium text-slate-500">难度</span>
                    <select
                      value={practice.difficulty}
                      onChange={(event) =>
                        updatePractice(index, {
                          difficulty: event.target.value as PracticeDraft["difficulty"],
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {difficultyOptions.map((difficulty) => (
                        <option key={difficulty} value={difficulty}>
                          {difficulty}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-xs font-medium text-slate-500">标准答案</span>
                    <input
                      value={practice.answer}
                      onChange={(event) => updatePractice(index, { answer: event.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </label>
                </div>

                {targetStepOptions.length > 0 ? (
                  <label className="mt-3 block">
                    <span className="text-xs font-medium text-cyan-700">
                      对应动态讲解步骤
                    </span>
                    <select
                      value={practice.target_storyboard_step ?? ""}
                      onChange={(event) =>
                        updatePractice(index, {
                          target_storyboard_step:
                            event.target.value.length > 0
                              ? Number(event.target.value)
                              : undefined,
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                    >
                      <option value="">自动匹配动态步骤</option>
                      {targetStepOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      学生做错这道题后，会优先跳回这里复看完整演化过程。
                    </p>
                  </label>
                ) : null}

                <label className="mt-3 block">
                  <span className="text-xs font-medium text-slate-500">解析</span>
                  <textarea
                    value={practice.explanation}
                    onChange={(event) =>
                      updatePractice(index, { explanation: event.target.value })
                    }
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm leading-6 text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          {error ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            {saving ? "保存中..." : "保存编辑并等待重新发布"}
          </button>
        </div>
      </form>
    </section>
  );
}
