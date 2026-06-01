"use client";

import { useState } from "react";
import type { Chapter, Grade, Semester, Textbook } from "@/data/junior-math";

type KnowledgeBaseTreeProps = {
  textbook: Textbook;
  grades: Grade[];
};

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${open ? "rotate-90" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function StructureOutline({ grade, semester }: { grade: Grade; semester: Semester }) {
  const chapters = semester.chapters;
  return (
    <pre className="overflow-x-auto rounded-xl border border-slate-200/80 bg-slate-900/[0.03] px-4 py-3 font-mono text-sm leading-relaxed text-slate-700">
      {grade.name}
      {"\n"}
      └── {semester.name}
      {chapters.map((ch, i) => {
        const branch = i === chapters.length - 1 ? "└──" : "├──";
        return `\n    ${branch} ${ch.name}`;
      })}
    </pre>
  );
}

function ChapterCard({
  chapter,
  defaultOpen,
}: {
  chapter: Chapter;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-slate-50/80 sm:px-5"
        aria-expanded={open}
      >
        <Chevron open={open} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-semibold text-slate-900">{chapter.name}</span>
            <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-[11px] font-medium text-indigo-700">
              {chapter.code}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {chapter.knowledgePoints.length} 个知识点 · 点击展开
          </p>
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 bg-slate-50/40 px-4 py-4 sm:px-5">
          <ul className="space-y-3">
            {chapter.knowledgePoints.map((kp) => (
              <li
                key={kp.id}
                className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm"
              >
                <dl className="space-y-2.5 text-sm">
                  <div className="flex flex-wrap gap-x-2 gap-y-1">
                    <dt className="shrink-0 font-medium text-slate-500">编码</dt>
                    <dd>
                      <code className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-800">
                        {kp.code}
                      </code>
                    </dd>
                  </div>
                  <div className="flex flex-wrap gap-x-2 gap-y-1">
                    <dt className="shrink-0 font-medium text-slate-500">名称</dt>
                    <dd className="font-semibold text-slate-900">{kp.name}</dd>
                  </div>
                  <div>
                    <dt className="mb-1 font-medium text-slate-500">说明</dt>
                    <dd className="leading-relaxed text-slate-600">{kp.description}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SemesterSection({ grade, semester }: { grade: Grade; semester: Semester }) {
  return (
    <div className="mt-4">
      <StructureOutline grade={grade} semester={semester} />
      <div className="mt-5 space-y-3">
        {semester.chapters.map((chapter, i) => (
          <ChapterCard key={chapter.id} chapter={chapter} defaultOpen={i === 0} />
        ))}
      </div>
    </div>
  );
}

function GradeSection({ grade }: { grade: Grade }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-6">
      <h2 className="flex items-center gap-3 text-lg font-bold text-slate-900">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-sm font-bold text-indigo-700">
          {grade.order}
        </span>
        {grade.name}
      </h2>
      {grade.semesters.map((semester) => (
        <SemesterSection key={semester.id} grade={grade} semester={semester} />
      ))}
    </section>
  );
}

export function KnowledgeBaseTree({ textbook, grades }: KnowledgeBaseTreeProps) {
  const totalPoints = grades.reduce(
    (sum, g) =>
      sum +
      g.semesters.reduce(
        (s, sem) => s + sem.chapters.reduce((c, ch) => c + ch.knowledgePoints.length, 0),
        0
      ),
    0
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50/80 to-white p-5 shadow-sm shadow-indigo-100/30">
        <p className="text-xs font-medium uppercase tracking-wider text-indigo-600">当前教材</p>
        <h3 className="mt-1 text-lg font-semibold text-slate-900">{textbook.name}</h3>
        <p className="mt-1 text-sm text-slate-500">
          {textbook.stage} · {textbook.subject} · {textbook.version}
          <span className="mx-2 text-slate-300">|</span>
          教材编码{" "}
          <code className="rounded bg-white/80 px-1.5 py-0.5 font-mono text-xs text-indigo-800">
            {textbook.code}
          </code>
        </p>
        <p className="mt-3 text-sm text-slate-600">
          共 <span className="font-semibold text-indigo-600">{totalPoints}</span> 个知识点
        </p>
      </div>

      <div className="space-y-6">
        {grades.map((grade) => (
          <GradeSection key={grade.id} grade={grade} />
        ))}
      </div>
    </div>
  );
}
