"use client";

import Link from "next/link";
import { useState } from "react";

type FormState = {
  subject: string;
  grade: string;
  textbook: string;
  unit: string;
  knowledgePoint: string;
};

type LessonFlowStep = {
  phase: string;
  duration: string;
  teacher: string;
  student: string;
};

export type MockLessonPlan = {
  meta: FormState;
  objectives: string[];
  keyPoints: string[];
  difficulties: { point: string; strategy: string }[];
  flow: LessonFlowStep[];
  interactions: string[];
  homework: string[];
};

const initialForm: FormState = {
  subject: "",
  grade: "",
  textbook: "",
  unit: "",
  knowledgePoint: "",
};

function generateMockLessonPlan(form: FormState): MockLessonPlan {
  const { subject, grade, textbook, unit, knowledgePoint } = form;

  return {
    meta: form,
    objectives: [
      `理解「${knowledgePoint}」的核心概念，并能用数学语言准确表述。`,
      `能运用${knowledgePoint}解决${grade}${subject}典型例题，正确率达 80% 以上。`,
      `在小组讨论中归纳${knowledgePoint}与已学知识的联系，形成知识网络。`,
      `养成验算与反思习惯，能说出常见错误及纠正方法。`,
    ],
    keyPoints: [
      `${knowledgePoint}的定义与适用条件`,
      `结合${unit}中的例题掌握基本解题步骤`,
      `在数轴/图示中直观理解${knowledgePoint}（视学科而定）`,
    ],
    difficulties: [
      {
        point: `符号法则与${knowledgePoint}综合应用时易出错`,
        strategy: "通过对比练习与错例辨析，强化「先定符号、再算绝对值」的步骤化训练",
      },
      {
        point: "文字应用题审题不清，不知如何选择方法",
        strategy: "引导学生标注已知、未知与关系句，配合线段图或表格辅助建模",
      },
    ],
    flow: [
      {
        phase: "导入",
        duration: "5 分钟",
        teacher: `出示${unit}生活情境问题，引出「${knowledgePoint}」学习需求`,
        student: "观察情境、提出猜想，激活已有经验",
      },
      {
        phase: "新授",
        duration: "15 分钟",
        teacher: `讲解${textbook}中${knowledgePoint}概念，板书关键步骤，示范 2 道例题`,
        student: "跟练、笔记，同桌互说概念含义",
      },
      {
        phase: "练习",
        duration: "15 分钟",
        teacher: "巡视点拨，组织板演与讲评",
        student: "独立完成分层练习（基础题 + 提高题）",
      },
      {
        phase: "小结",
        duration: "5 分钟",
        teacher: "归纳本课知识框架，布置课后巩固",
        student: "完成自我评价单，明确薄弱点",
      },
    ],
    interactions: [
      `抢答：${knowledgePoint}与前一课知识的联系是什么？`,
      "四人小组：每人出一道变式题，组内交换解答并互评",
      "实物演示 / 数轴操作：直观验证猜想（适合理科课堂）",
      "「我来当小老师」：学生上台讲解一道错题的订正过程",
    ],
    homework: [
      `完成${textbook} ${unit} 相关练习（必做 3 题，选做 1 题）`,
      `用思维导图整理「${knowledgePoint}」与本周已学内容的关系`,
      `学情薄弱学生：回看课堂例题，完成针对性巩固单（教师另行发放）`,
    ],
  };
}

const fieldConfig: { key: keyof FormState; label: string; placeholder: string }[] = [
  { key: "subject", label: "学科", placeholder: "例如：数学" },
  { key: "grade", label: "年级", placeholder: "例如：七年级" },
  { key: "textbook", label: "教材版本", placeholder: "例如：人教版" },
  { key: "unit", label: "单元", placeholder: "例如：第二章 有理数" },
  { key: "knowledgePoint", label: "知识点", placeholder: "例如：有理数的加减法" },
];

export function LessonGeneratorForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [plan, setPlan] = useState<MockLessonPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const updateField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const empty = fieldConfig.find(({ key }) => !form[key].trim());
    if (empty) {
      setError(`请填写${empty.label}`);
      setPlan(null);
      return;
    }

    setLoading(true);
    setError(null);

    window.setTimeout(() => {
      setPlan(generateMockLessonPlan(form));
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <Link
              href="/teacher"
              className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              <span aria-hidden>←</span>
              返回教师工作台
            </Link>
            <h1 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">AI教案生成</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              填写教材信息，一键生成结构化教案（演示数据）
            </p>
          </div>
          <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700">
            Mock 模式
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-5">
          <form onSubmit={handleSubmit} className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">备课信息</h2>
              <p className="mt-1 text-sm text-slate-500">请完整填写以下字段</p>

              <div className="mt-6 space-y-4">
                {fieldConfig.map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label htmlFor={key} className="block text-sm font-medium text-slate-700">
                      {label}
                    </label>
                    <input
                      id={key}
                      type="text"
                      value={form[key]}
                      onChange={(e) => updateField(key, e.target.value)}
                      placeholder={placeholder}
                      className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-500/20"
                    />
                  </div>
                ))}
              </div>

              {error && (
                <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-violet-500/25 transition hover:from-violet-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "生成中…" : "生成教案"}
              </button>
            </div>
          </form>

          <div className="lg:col-span-3">
            {!plan && !loading && (
              <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 p-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 01-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <p className="mt-4 text-sm font-medium text-slate-600">填写左侧表单后点击「生成教案」</p>
                <p className="mt-1 text-xs text-slate-400">教案将显示在右侧预览区</p>
              </div>
            )}

            {loading && (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-8">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
                <p className="mt-4 text-sm text-slate-500">正在生成教案…</p>
              </div>
            )}

            {plan && !loading && (
              <article className="space-y-6">
                <div className="rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-50 to-white p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900">教案预览</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {plan.meta.grade} · {plan.meta.subject} · {plan.meta.textbook}
                  </p>
                  <p className="text-sm text-slate-500">
                    {plan.meta.unit} · {plan.meta.knowledgePoint}
                  </p>
                </div>

                <Section title="教学目标" accent="violet">
                  <ul className="list-inside list-decimal space-y-2 text-sm leading-relaxed text-slate-700">
                    {plan.objectives.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </Section>

                <Section title="教学重点" accent="indigo">
                  <ul className="list-inside list-disc space-y-1.5 text-sm text-slate-700">
                    {plan.keyPoints.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </Section>

                <Section title="教学难点" accent="amber">
                  <ul className="space-y-4">
                    {plan.difficulties.map((item, i) => (
                      <li key={i} className="rounded-lg bg-amber-50/80 p-4 text-sm">
                        <p className="font-medium text-slate-800">难点：{item.point}</p>
                        <p className="mt-2 text-slate-600">
                          <span className="font-medium text-amber-800">突破：</span>
                          {item.strategy}
                        </p>
                      </li>
                    ))}
                  </ul>
                </Section>

                <Section title="教学流程" accent="sky">
                  <ol className="space-y-4">
                    {plan.flow.map((step, i) => (
                      <li
                        key={i}
                        className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-sm"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800">
                            {step.phase}
                          </span>
                          <span className="text-xs text-slate-400">{step.duration}</span>
                        </div>
                        <p className="mt-2 text-slate-700">
                          <span className="font-medium text-slate-800">教师：</span>
                          {step.teacher}
                        </p>
                        <p className="mt-1 text-slate-600">
                          <span className="font-medium text-slate-800">学生：</span>
                          {step.student}
                        </p>
                      </li>
                    ))}
                  </ol>
                </Section>

                <Section title="课堂互动" accent="emerald">
                  <ul className="list-inside list-disc space-y-2 text-sm text-slate-700">
                    {plan.interactions.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </Section>

                <Section title="课后巩固" accent="rose">
                  <ul className="list-inside list-disc space-y-2 text-sm text-slate-700">
                    {plan.homework.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </Section>

                <p className="text-center text-xs text-slate-400">
                  以上为 Mock 生成内容，接入 API 后将使用真实模型输出
                </p>
              </article>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Section({
  title,
  accent,
  children,
}: {
  title: string;
  accent: "violet" | "indigo" | "amber" | "sky" | "emerald" | "rose";
  children: React.ReactNode;
}) {
  const bar: Record<string, string> = {
    violet: "bg-violet-500",
    indigo: "bg-indigo-500",
    amber: "bg-amber-500",
    sky: "bg-sky-500",
    emerald: "bg-emerald-500",
    rose: "bg-rose-500",
  };

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className={`h-5 w-1 rounded-full ${bar[accent]}`} />
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      </div>
      {children}
    </section>
  );
}
