import type { Metadata } from "next";
import Link from "next/link";
import { getProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "学习数据 · 知桥AI",
  description: "查看已关联学生的基础练习与复习任务数据",
};

type LinkedStudent = {
  id: string;
  display_name: string;
  created_at: string;
};

type PracticeRecord = {
  id: string;
  user_id: string;
  courseware_id: string | null;
  knowledge_point_code: string;
  knowledge_point_name: string;
  practice_item_index: number;
  question: string;
  expected_answer: string;
  student_answer: string;
  is_correct: boolean;
  error_reason: string | null;
  difficulty: string;
  created_at: string;
};

type ReviewTask = {
  id: string;
  user_id: string;
  source_practice_record_id: string | null;
  knowledge_point_code: string;
  knowledge_point_name: string;
  task_type: "mistake_review" | "weekly_review";
  status: "pending" | "completed";
  due_date: string;
  created_at: string;
  completed_at: string | null;
};

type CoursewareProgress = {
  id: string;
  user_id: string;
  courseware_id: string;
  knowledge_point_code: string;
  knowledge_point_name: string;
  last_slide_index: number;
  slide_count: number;
  status: "in_progress" | "completed";
  first_opened_at: string;
  last_viewed_at: string;
  completed_at: string | null;
  created_at: string;
};

type KnowledgeMastery = {
  id: string;
  user_id: string;
  knowledge_point_code: string;
  knowledge_point_name: string;
  courseware_opened_count: number;
  courseware_completed_count: number;
  practice_attempts: number;
  correct_attempts: number;
  wrong_attempts: number;
  accuracy: number;
  pending_review_count: number;
  completed_review_count: number;
  mastery_score: number;
  mastery_level: "needs_work" | "basic" | "stable";
  reasons: string[];
  last_activity_at: string | null;
  calculated_at: string;
};

type LoadResult =
  | {
      status: "success";
      students: LinkedStudent[];
      practiceRecords: PracticeRecord[];
      reviewTasks: ReviewTask[];
      coursewareProgress: CoursewareProgress[];
      knowledgeMastery: KnowledgeMastery[];
    }
  | { status: "error"; message: string };

type KnowledgeSummary = {
  code: string;
  name: string;
  attempts: number;
  correct: number;
  wrong: number;
  accuracy: number;
  studentCount: number;
  pendingReviews: number;
  completedReviews: number;
  lastPracticedAt: string | null;
};

type StudentSummary = {
  id: string;
  displayName: string;
  attempts: number;
  correct: number;
  accuracy: number;
  pendingReviews: number;
  completedReviews: number;
  coursewareOpened: number;
  coursewareCompleted: number;
  needsWorkCount: number;
  stableCount: number;
  lastActivityAt: string | null;
};

function formatDateTime(iso: string | null) {
  if (!iso) return "暂无";

  return new Date(iso).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  });
}

function toPercent(part: number, total: number) {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

function getStudentName(students: LinkedStudent[], id: string) {
  return students.find((student) => student.id === id)?.display_name ?? "学生";
}

function getMasteryLabel(level: KnowledgeMastery["mastery_level"]) {
  if (level === "stable") return "持续稳定";
  if (level === "basic") return "基本掌握";
  return "待巩固";
}

function getMasteryBadgeClass(level: KnowledgeMastery["mastery_level"]) {
  if (level === "stable") return "bg-emerald-100 text-emerald-700";
  if (level === "basic") return "bg-sky-100 text-sky-700";
  return "bg-rose-100 text-rose-700";
}

function getCoursewareLibraryHref(code: string) {
  return `/teacher/courseware-library?q=${encodeURIComponent(code)}`;
}

function getCoursewareGenerateHref(code: string) {
  return `/teacher/courseware?knowledgePointCode=${encodeURIComponent(code)}&source=analytics`;
}

function getTeacherCoursewarePracticeHref(record: PracticeRecord) {
  if (!record.courseware_id) return null;

  return `/teacher/courseware-history/${record.courseware_id}?practice=${
    record.practice_item_index
  }#practice-${record.practice_item_index + 1}`;
}

function buildKnowledgeSummaries(
  records: PracticeRecord[],
  tasks: ReviewTask[]
): KnowledgeSummary[] {
  const map = new Map<
    string,
    KnowledgeSummary & {
      studentIds: Set<string>;
    }
  >();

  for (const record of records) {
    const summary =
      map.get(record.knowledge_point_code) ??
      {
        code: record.knowledge_point_code,
        name: record.knowledge_point_name,
        attempts: 0,
        correct: 0,
        wrong: 0,
        accuracy: 0,
        studentCount: 0,
        pendingReviews: 0,
        completedReviews: 0,
        lastPracticedAt: null,
        studentIds: new Set<string>(),
      };

    summary.attempts += 1;
    summary.correct += record.is_correct ? 1 : 0;
    summary.wrong += record.is_correct ? 0 : 1;
    summary.studentIds.add(record.user_id);
    if (!summary.lastPracticedAt || record.created_at > summary.lastPracticedAt) {
      summary.lastPracticedAt = record.created_at;
    }

    map.set(record.knowledge_point_code, summary);
  }

  for (const task of tasks) {
    const summary =
      map.get(task.knowledge_point_code) ??
      {
        code: task.knowledge_point_code,
        name: task.knowledge_point_name,
        attempts: 0,
        correct: 0,
        wrong: 0,
        accuracy: 0,
        studentCount: 0,
        pendingReviews: 0,
        completedReviews: 0,
        lastPracticedAt: null,
        studentIds: new Set<string>(),
      };

    if (task.status === "pending") {
      summary.pendingReviews += 1;
    } else {
      summary.completedReviews += 1;
    }

    map.set(task.knowledge_point_code, summary);
  }

  return Array.from(map.values())
    .map(({ studentIds, ...summary }) => ({
      ...summary,
      studentCount: studentIds.size,
      accuracy: toPercent(summary.correct, summary.attempts),
    }))
    .sort((a, b) => b.wrong - a.wrong || b.pendingReviews - a.pendingReviews);
}

function buildStudentSummaries(
  students: LinkedStudent[],
  records: PracticeRecord[],
  tasks: ReviewTask[],
  progressRows: CoursewareProgress[],
  masteryRows: KnowledgeMastery[]
): StudentSummary[] {
  return students
    .map((student) => {
      const studentRecords = records.filter((record) => record.user_id === student.id);
      const studentTasks = tasks.filter((task) => task.user_id === student.id);
      const studentProgress = progressRows.filter((progress) => progress.user_id === student.id);
      const studentMastery = masteryRows.filter((mastery) => mastery.user_id === student.id);
      const correct = studentRecords.filter((record) => record.is_correct).length;
      const lastPracticeAt = studentRecords[0]?.created_at ?? null;
      const lastReviewAt = studentTasks[0]?.created_at ?? null;
      const lastCoursewareAt = studentProgress[0]?.last_viewed_at ?? null;
      const lastActivityAt = [lastPracticeAt, lastReviewAt, lastCoursewareAt]
        .filter((value): value is string => Boolean(value))
        .sort()
        .at(-1) ?? null;

      return {
        id: student.id,
        displayName: student.display_name,
        attempts: studentRecords.length,
        correct,
        accuracy: toPercent(correct, studentRecords.length),
        pendingReviews: studentTasks.filter((task) => task.status === "pending").length,
        completedReviews: studentTasks.filter((task) => task.status === "completed").length,
        coursewareOpened: studentProgress.length,
        coursewareCompleted: studentProgress.filter((progress) => progress.status === "completed")
          .length,
        needsWorkCount: studentMastery.filter((mastery) => mastery.mastery_level === "needs_work")
          .length,
        stableCount: studentMastery.filter((mastery) => mastery.mastery_level === "stable").length,
        lastActivityAt,
      };
    })
    .sort((a, b) => b.pendingReviews - a.pendingReviews || a.accuracy - b.accuracy);
}

async function loadTeacherLearningData(): Promise<LoadResult> {
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
      return {
        status: "success",
        students: [],
        practiceRecords: [],
        reviewTasks: [],
        coursewareProgress: [],
        knowledgeMastery: [],
      };
    }

    const { data: students, error: studentsError } = await supabase
      .from("profiles")
      .select("id, display_name, created_at")
      .in("id", studentIds)
      .order("created_at", { ascending: false });

    if (studentsError) {
      return { status: "error", message: studentsError.message };
    }

    const { data: practiceRecords, error: practiceError } = await supabase
      .from("student_practice_records")
      .select(
        "id, user_id, courseware_id, knowledge_point_code, knowledge_point_name, practice_item_index, question, expected_answer, student_answer, is_correct, error_reason, difficulty, created_at"
      )
      .order("created_at", { ascending: false });

    if (practiceError) {
      return { status: "error", message: practiceError.message };
    }

    const { data: reviewTasks, error: reviewError } = await supabase
      .from("student_review_tasks")
      .select(
        "id, user_id, source_practice_record_id, knowledge_point_code, knowledge_point_name, task_type, status, due_date, created_at, completed_at"
      )
      .order("status", { ascending: false })
      .order("due_date", { ascending: true })
      .order("created_at", { ascending: false });

    if (reviewError) {
      return { status: "error", message: reviewError.message };
    }

    const { data: coursewareProgress, error: progressError } = await supabase
      .from("student_courseware_progress")
      .select(
        "id, user_id, courseware_id, knowledge_point_code, knowledge_point_name, last_slide_index, slide_count, status, first_opened_at, last_viewed_at, completed_at, created_at"
      )
      .order("last_viewed_at", { ascending: false });

    if (progressError) {
      return { status: "error", message: progressError.message };
    }

    const { data: knowledgeMastery, error: masteryError } = await supabase
      .from("student_knowledge_mastery")
      .select(
        "id, user_id, knowledge_point_code, knowledge_point_name, courseware_opened_count, courseware_completed_count, practice_attempts, correct_attempts, wrong_attempts, accuracy, pending_review_count, completed_review_count, mastery_score, mastery_level, reasons, last_activity_at, calculated_at"
      )
      .order("mastery_score", { ascending: true })
      .order("calculated_at", { ascending: false });

    if (masteryError) {
      return { status: "error", message: masteryError.message };
    }

    return {
      status: "success",
      students: (students ?? []) as LinkedStudent[],
      practiceRecords: (practiceRecords ?? []) as PracticeRecord[],
      reviewTasks: (reviewTasks ?? []) as ReviewTask[],
      coursewareProgress: (coursewareProgress ?? []) as CoursewareProgress[],
      knowledgeMastery: (knowledgeMastery ?? []) as KnowledgeMastery[],
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "学习数据查询失败",
    };
  }
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">{value}</p>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">{hint}</p>
    </div>
  );
}

export default async function AnalyticsPage() {
  const result = await loadTeacherLearningData();

  if (result.status === "error") {
    return (
      <div className="min-h-screen bg-slate-50">
        <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <Link
            href="/teacher"
            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
          >
            <span aria-hidden>←</span>
            返回教师工作台
          </Link>
          <section className="mt-8 rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
            <h1 className="text-lg font-semibold">学习数据查询失败</h1>
            <p className="mt-2 break-words text-sm">{result.message}</p>
          </section>
        </main>
      </div>
    );
  }

  const { students, practiceRecords, reviewTasks, coursewareProgress, knowledgeMastery } =
    result;
  const correctCount = practiceRecords.filter((record) => record.is_correct).length;
  const pendingReviews = reviewTasks.filter((task) => task.status === "pending");
  const pendingMistakeReviews = pendingReviews.filter(
    (task) => task.task_type === "mistake_review"
  );
  const completedCoursewareProgress = coursewareProgress.filter(
    (progress) => progress.status === "completed"
  );
  const needsWorkMastery = knowledgeMastery.filter(
    (mastery) => mastery.mastery_level === "needs_work"
  );
  const stableMastery = knowledgeMastery.filter((mastery) => mastery.mastery_level === "stable");
  const knowledgeSummaries = buildKnowledgeSummaries(practiceRecords, reviewTasks);
  const studentSummaries = buildStudentSummaries(
    students,
    practiceRecords,
    reviewTasks,
    coursewareProgress,
    knowledgeMastery
  );
  const latestPracticeRecords = practiceRecords.slice(0, 8);
  const latestCoursewareProgress = coursewareProgress.slice(0, 8);
  const weakestMastery = knowledgeMastery.slice(0, 8);
  const practiceRecordById = new Map(practiceRecords.map((record) => [record.id, record]));

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
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
                学习数据
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
                查看已关联学生的基础练习与复习任务，先确认知识点数据闭环，再进入完整学情分析。
              </p>
            </div>
            <span className="w-fit rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
              P2 阶段12 · 掌握信号 MVP
            </span>
            <Link
              href="/teacher/students"
              className="w-fit rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
            >
              管理学生范围
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {students.length === 0 ? (
          <section className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <h2 className="text-lg font-semibold text-slate-900">暂无关联学生</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
              当前教师账号还没有 `teacher_student_links` 关联记录。添加关联后，这里会显示学生练习、复习与知识点维度统计。
            </p>
            <Link
              href="/teacher/students"
              className="mt-5 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              去添加学生
            </Link>
          </section>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
              <MetricCard
                label="关联学生"
                value={`${students.length}`}
                hint="当前教师可查看的数据范围"
              />
              <MetricCard
                label="练习提交"
                value={`${practiceRecords.length}`}
                hint="来自学生端基础练习记录"
              />
              <MetricCard
                label="正确率"
                value={`${toPercent(correctCount, practiceRecords.length)}%`}
                hint={`${correctCount} 题正确，${practiceRecords.length - correctCount} 题需复盘`}
              />
              <MetricCard
                label="待复习"
                value={`${pendingReviews.length}`}
                hint={`${pendingMistakeReviews.length} 个错题复习任务`}
              />
              <MetricCard
                label="课件学习"
                value={`${completedCoursewareProgress.length}/${coursewareProgress.length}`}
                hint="已完成 / 已打开的课件学习记录"
              />
              <MetricCard
                label="待巩固"
                value={`${needsWorkMastery.length}`}
                hint={`${stableMastery.length} 个知识点已持续稳定`}
              />
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      知识点基础掌握信号
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      按错误次数和待复习任务排序，帮助老师先定位需要重讲的基础知识。
                    </p>
                  </div>
                </div>

                {knowledgeSummaries.length === 0 ? (
                  <p className="mt-6 rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    已有关联学生，但暂无练习或复习数据。
                  </p>
                ) : (
                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="pb-3 pr-4 font-medium">知识点</th>
                          <th className="pb-3 pr-4 font-medium">提交</th>
                          <th className="pb-3 pr-4 font-medium">正确率</th>
                          <th className="pb-3 pr-4 font-medium">待复习</th>
                          <th className="pb-3 pr-4 font-medium">最近练习</th>
                          <th className="pb-3 font-medium">资源</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {knowledgeSummaries.map((item) => (
                          <tr key={item.code} className="align-top">
                            <td className="py-4 pr-4">
                              <p className="font-medium text-slate-900">{item.name}</p>
                              <code className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-600">
                                {item.code}
                              </code>
                            </td>
                            <td className="py-4 pr-4 tabular-nums text-slate-700">
                              {item.attempts}
                              <span className="ml-1 text-xs text-slate-400">
                                / {item.studentCount}人
                              </span>
                            </td>
                            <td className="py-4 pr-4">
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  item.accuracy >= 80
                                    ? "bg-emerald-100 text-emerald-700"
                                    : item.accuracy >= 60
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-rose-100 text-rose-700"
                                }`}
                              >
                                {item.accuracy}%
                              </span>
                            </td>
                            <td className="py-4 pr-4 tabular-nums text-slate-700">
                              {item.pendingReviews}
                            </td>
                            <td className="py-4 pr-4 text-slate-500">
                              {formatDateTime(item.lastPracticedAt)}
                            </td>
                            <td className="py-4">
                              <div className="flex flex-wrap gap-2">
                                <Link
                                  href={getCoursewareLibraryHref(item.code)}
                                  className="rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50"
                                >
                                  查课件
                                </Link>
                                <Link
                                  href={getCoursewareGenerateHref(item.code)}
                                  className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
                                >
                                  生成
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">学生概览</h2>
                <p className="mt-1 text-sm text-slate-500">
                  当前仅展示已关联学生，不跨班级读取。
                </p>
                <ul className="mt-5 space-y-3">
                  {studentSummaries.map((student) => (
                    <li
                      key={student.id}
                      className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-900">{student.displayName}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            最近活动：{formatDateTime(student.lastActivityAt)}
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                          {student.accuracy}%
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500 sm:grid-cols-4">
                        <span>提交 {student.attempts}</span>
                        <span>待复习 {student.pendingReviews}</span>
                        <span>练习复习 {student.completedReviews}</span>
                        <span>
                          课件 {student.coursewareCompleted}/{student.coursewareOpened}
                        </span>
                        <span>弱项 {student.needsWorkCount}</span>
                        <span>稳定 {student.stableCount}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">基础掌握快照</h2>
              <p className="mt-1 text-sm text-slate-500">
                基于课件学习、基础练习和复习任务计算的轻量信号，只用于定位需要继续巩固的知识点。
              </p>

              {weakestMastery.length === 0 ? (
                <p className="mt-5 rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  暂无掌握度快照。学生完成课件学习、练习或复习后会自动生成。
                </p>
              ) : (
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="pb-3 pr-4 font-medium">学生</th>
                        <th className="pb-3 pr-4 font-medium">知识点</th>
                        <th className="pb-3 pr-4 font-medium">掌握信号</th>
                        <th className="pb-3 pr-4 font-medium">练习</th>
                        <th className="pb-3 pr-4 font-medium">复习</th>
                        <th className="pb-3 pr-4 font-medium">依据</th>
                        <th className="pb-3 font-medium">资源</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {weakestMastery.map((mastery) => (
                        <tr key={mastery.id} className="align-top">
                          <td className="py-4 pr-4 font-medium text-slate-900">
                            {getStudentName(students, mastery.user_id)}
                          </td>
                          <td className="py-4 pr-4">
                            <p className="font-medium text-slate-800">
                              {mastery.knowledge_point_name}
                            </p>
                            <code className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-600">
                              {mastery.knowledge_point_code}
                            </code>
                          </td>
                          <td className="py-4 pr-4">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getMasteryBadgeClass(
                                mastery.mastery_level
                              )}`}
                            >
                              {getMasteryLabel(mastery.mastery_level)} · {mastery.mastery_score}
                            </span>
                          </td>
                          <td className="py-4 pr-4 text-slate-700">
                            {mastery.correct_attempts}/{mastery.practice_attempts} 正确
                            <span className="ml-1 text-xs text-slate-400">
                              正确率 {mastery.accuracy}%
                            </span>
                          </td>
                          <td className="py-4 pr-4 text-slate-700">
                            待 {mastery.pending_review_count} / 完成{" "}
                            {mastery.completed_review_count}
                          </td>
                          <td className="max-w-xs py-4 pr-4 text-slate-500">
                            <span className="line-clamp-2">
                              {mastery.reasons.join("，")}
                            </span>
                          </td>
                          <td className="py-4">
                            <Link
                              href={getCoursewareLibraryHref(mastery.knowledge_point_code)}
                              className="rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50"
                            >
                              查看资源
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">最近练习记录</h2>
              <p className="mt-1 text-sm text-slate-500">
                保留题目、学生答案和标准答案，便于老师快速判断基础错误来源。
              </p>

              {latestPracticeRecords.length === 0 ? (
                <p className="mt-5 rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  暂无学生练习记录。
                </p>
              ) : (
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="pb-3 pr-4 font-medium">学生</th>
                        <th className="pb-3 pr-4 font-medium">知识点</th>
                        <th className="pb-3 pr-4 font-medium">结果</th>
                        <th className="pb-3 pr-4 font-medium">学生答案</th>
                        <th className="pb-3 pr-4 font-medium">标准答案</th>
                        <th className="pb-3 pr-4 font-medium">时间</th>
                        <th className="pb-3 font-medium">资源</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {latestPracticeRecords.map((record) => {
                        const coursewarePracticeHref = getTeacherCoursewarePracticeHref(record);

                        return (
                          <tr key={record.id} className="align-top">
                            <td className="py-4 pr-4 font-medium text-slate-900">
                              {getStudentName(students, record.user_id)}
                            </td>
                            <td className="py-4 pr-4">
                              <p className="font-medium text-slate-800">
                                {record.knowledge_point_name}
                              </p>
                              <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                                {record.question}
                              </p>
                              {record.error_reason ? (
                                <p className="mt-1 max-w-xs text-xs text-rose-600">
                                  {record.error_reason}
                                </p>
                              ) : null}
                            </td>
                            <td className="py-4 pr-4">
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  record.is_correct
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-rose-100 text-rose-700"
                                }`}
                              >
                                {record.is_correct ? "正确" : "需复盘"}
                              </span>
                            </td>
                            <td className="max-w-[10rem] py-4 pr-4 text-slate-700">
                              <span className="line-clamp-2 break-words">
                                {record.student_answer}
                              </span>
                            </td>
                            <td className="max-w-[10rem] py-4 pr-4 text-slate-700">
                              <span className="line-clamp-2 break-words">
                                {record.expected_answer}
                              </span>
                            </td>
                            <td className="py-4 pr-4 text-slate-500">
                              {formatDateTime(record.created_at)}
                            </td>
                            <td className="py-4">
                              {coursewarePracticeHref ? (
                                <Link
                                  href={coursewarePracticeHref}
                                  className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
                                >
                                  看课件题
                                </Link>
                              ) : (
                                <span className="text-xs text-slate-400">无课件</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">最近课件学习</h2>
              <p className="mt-1 text-sm text-slate-500">
                记录学生打开、浏览和完成课件的情况，作为后续知识点掌握判断的基础信号。
              </p>

              {latestCoursewareProgress.length === 0 ? (
                <p className="mt-5 rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  暂无学生课件学习记录。
                </p>
              ) : (
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="pb-3 pr-4 font-medium">学生</th>
                        <th className="pb-3 pr-4 font-medium">知识点</th>
                        <th className="pb-3 pr-4 font-medium">学习进度</th>
                        <th className="pb-3 pr-4 font-medium">状态</th>
                        <th className="pb-3 font-medium">最近学习</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {latestCoursewareProgress.map((progress) => (
                        <tr key={progress.id} className="align-top">
                          <td className="py-4 pr-4 font-medium text-slate-900">
                            {getStudentName(students, progress.user_id)}
                          </td>
                          <td className="py-4 pr-4">
                            <p className="font-medium text-slate-800">
                              {progress.knowledge_point_name}
                            </p>
                            <code className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-600">
                              {progress.knowledge_point_code}
                            </code>
                          </td>
                          <td className="py-4 pr-4 tabular-nums text-slate-700">
                            第 {Math.min(progress.last_slide_index + 1, progress.slide_count)} /{" "}
                            {progress.slide_count} 页
                          </td>
                          <td className="py-4 pr-4">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                progress.status === "completed"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-sky-100 text-sky-700"
                              }`}
                            >
                              {progress.status === "completed" ? "已完成" : "学习中"}
                            </span>
                          </td>
                          <td className="py-4 text-slate-500">
                            {formatDateTime(progress.last_viewed_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">待复习任务</h2>
              <p className="mt-1 text-sm text-slate-500">
                用于提醒老师哪些知识点还需要学生继续巩固。
              </p>

              {pendingReviews.length === 0 ? (
                <p className="mt-5 rounded-lg bg-emerald-50 px-4 py-6 text-center text-sm text-emerald-700">
                  当前没有待复习任务。
                </p>
              ) : (
                <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {pendingReviews.slice(0, 9).map((task) => {
                    const sourcePractice = task.source_practice_record_id
                      ? practiceRecordById.get(task.source_practice_record_id) ?? null
                      : null;
                    const coursewarePracticeHref = sourcePractice
                      ? getTeacherCoursewarePracticeHref(sourcePractice)
                      : null;

                    return (
                      <div
                        key={task.id}
                        className="rounded-lg border border-slate-100 bg-slate-50 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              task.task_type === "mistake_review"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-indigo-100 text-indigo-700"
                            }`}
                          >
                            {task.task_type === "mistake_review" ? "错题复习" : "一周回顾"}
                          </span>
                          <span className="text-xs text-slate-500">
                            {formatDate(task.due_date)}
                          </span>
                        </div>
                        <p className="mt-3 font-medium text-slate-900">
                          {task.knowledge_point_name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {getStudentName(students, task.user_id)}
                        </p>
                        {sourcePractice ? (
                          <div className="mt-3 rounded-lg border border-rose-100 bg-white p-3 text-xs leading-5 text-slate-600">
                            <p className="font-semibold text-slate-800">错题来源</p>
                            <p className="mt-1 line-clamp-2">{sourcePractice.question}</p>
                            <p className="mt-1">学生答案：{sourcePractice.student_answer}</p>
                            <p className="mt-1">标准答案：{sourcePractice.expected_answer}</p>
                          </div>
                        ) : null}
                        {coursewarePracticeHref ? (
                          <Link
                            href={coursewarePracticeHref}
                            className="mt-3 inline-flex rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
                          >
                            重看课件题目
                          </Link>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
