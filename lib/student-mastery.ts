import type { SupabaseClient } from "@supabase/supabase-js";

export type MasteryLevel = "needs_work" | "basic" | "stable";

type PracticeRecord = {
  knowledge_point_code: string;
  knowledge_point_name: string;
  is_correct: boolean;
  created_at: string;
};

type ReviewTask = {
  knowledge_point_code: string;
  knowledge_point_name: string;
  status: "pending" | "completed";
  created_at: string;
  completed_at: string | null;
};

type CoursewareProgress = {
  knowledge_point_code: string;
  knowledge_point_name: string;
  status: "in_progress" | "completed";
  last_viewed_at: string;
  completed_at: string | null;
};

export type StudentKnowledgeMastery = {
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
  mastery_level: MasteryLevel;
  reasons: string[];
  last_activity_at: string | null;
  calculated_at: string;
  created_at: string;
  updated_at: string;
};

type MasteryDraft = Omit<StudentKnowledgeMastery, "id" | "created_at" | "updated_at">;

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function maxIso(values: Array<string | null | undefined>) {
  return values.filter((value): value is string => Boolean(value)).sort().at(-1) ?? null;
}

function uniqueKnowledgePoints(
  records: PracticeRecord[],
  tasks: ReviewTask[],
  progressRows: CoursewareProgress[],
  fallbackCode?: string
) {
  const map = new Map<string, string>();

  for (const row of [...records, ...tasks, ...progressRows]) {
    if (row.knowledge_point_code) {
      map.set(row.knowledge_point_code, row.knowledge_point_name);
    }
  }

  if (fallbackCode && !map.has(fallbackCode)) {
    map.set(fallbackCode, fallbackCode);
  }

  return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
}

function buildMasteryDraft({
  userId,
  code,
  name,
  records,
  tasks,
  progressRows,
}: {
  userId: string;
  code: string;
  name: string;
  records: PracticeRecord[];
  tasks: ReviewTask[];
  progressRows: CoursewareProgress[];
}): MasteryDraft {
  const now = new Date().toISOString();
  const practiceAttempts = records.length;
  const correctAttempts = records.filter((record) => record.is_correct).length;
  const wrongAttempts = practiceAttempts - correctAttempts;
  const pendingReviews = tasks.filter((task) => task.status === "pending").length;
  const completedReviews = tasks.filter((task) => task.status === "completed").length;
  const coursewareOpened = progressRows.length;
  const coursewareCompleted = progressRows.filter(
    (progress) => progress.status === "completed"
  ).length;
  const accuracy = practiceAttempts
    ? Math.round((correctAttempts / practiceAttempts) * 100)
    : 0;

  let score = 0;
  const reasons: string[] = [];

  if (coursewareCompleted > 0) {
    score += 20;
    reasons.push("已完成课件学习");
  } else if (coursewareOpened > 0) {
    score += 10;
    reasons.push("已开始课件学习");
  } else {
    reasons.push("尚未打开课件学习");
  }

  if (practiceAttempts === 0) {
    reasons.push("暂无基础练习记录");
  } else if (accuracy >= 80) {
    score += practiceAttempts >= 3 ? 50 : 35;
    reasons.push("基础练习正确率较高");
  } else if (accuracy >= 60) {
    score += practiceAttempts >= 3 ? 35 : 25;
    reasons.push("基础练习正确率中等");
  } else {
    score += 10;
    reasons.push("基础练习错误较多");
  }

  if (completedReviews > 0) {
    score += Math.min(15, completedReviews * 5);
    reasons.push("已完成部分复习任务");
  }

  if (pendingReviews > 0) {
    score -= Math.min(30, pendingReviews * 10);
    reasons.push("仍有待复习任务");
  }

  if (wrongAttempts > 0) {
    score -= Math.min(20, wrongAttempts * 5);
    reasons.push("存在错题记录");
  }

  const masteryScore = clampScore(score);
  const masteryLevel: MasteryLevel =
    masteryScore >= 80 && pendingReviews === 0 && practiceAttempts >= 2
      ? "stable"
      : masteryScore >= 55 && (practiceAttempts > 0 || coursewareOpened > 0)
        ? "basic"
        : "needs_work";

  return {
    user_id: userId,
    knowledge_point_code: code,
    knowledge_point_name: name,
    courseware_opened_count: coursewareOpened,
    courseware_completed_count: coursewareCompleted,
    practice_attempts: practiceAttempts,
    correct_attempts: correctAttempts,
    wrong_attempts: wrongAttempts,
    accuracy,
    pending_review_count: pendingReviews,
    completed_review_count: completedReviews,
    mastery_score: masteryScore,
    mastery_level: masteryLevel,
    reasons,
    last_activity_at: maxIso([
      records[0]?.created_at,
      tasks[0]?.completed_at,
      tasks[0]?.created_at,
      progressRows[0]?.completed_at,
      progressRows[0]?.last_viewed_at,
    ]),
    calculated_at: now,
  };
}

export async function refreshStudentKnowledgeMastery(
  supabase: SupabaseClient,
  userId: string,
  knowledgePointCode?: string
): Promise<StudentKnowledgeMastery[]> {
  const practiceQuery = supabase
    .from("student_practice_records")
    .select("knowledge_point_code, knowledge_point_name, is_correct, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const reviewQuery = supabase
    .from("student_review_tasks")
    .select("knowledge_point_code, knowledge_point_name, status, created_at, completed_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const progressQuery = supabase
    .from("student_courseware_progress")
    .select("knowledge_point_code, knowledge_point_name, status, last_viewed_at, completed_at")
    .eq("user_id", userId)
    .order("last_viewed_at", { ascending: false });

  if (knowledgePointCode) {
    practiceQuery.eq("knowledge_point_code", knowledgePointCode);
    reviewQuery.eq("knowledge_point_code", knowledgePointCode);
    progressQuery.eq("knowledge_point_code", knowledgePointCode);
  }

  const [practiceResult, reviewResult, progressResult] = await Promise.all([
    practiceQuery,
    reviewQuery,
    progressQuery,
  ]);

  if (practiceResult.error) throw practiceResult.error;
  if (reviewResult.error) throw reviewResult.error;
  if (progressResult.error) throw progressResult.error;

  const records = (practiceResult.data ?? []) as PracticeRecord[];
  const tasks = (reviewResult.data ?? []) as ReviewTask[];
  const progressRows = (progressResult.data ?? []) as CoursewareProgress[];
  const points = uniqueKnowledgePoints(records, tasks, progressRows, knowledgePointCode);
  const savedRows: StudentKnowledgeMastery[] = [];

  for (const point of points) {
    const pointRecords = records.filter((record) => record.knowledge_point_code === point.code);
    const pointTasks = tasks.filter((task) => task.knowledge_point_code === point.code);
    const pointProgressRows = progressRows.filter(
      (progress) => progress.knowledge_point_code === point.code
    );
    const draft = buildMasteryDraft({
      userId,
      code: point.code,
      name: point.name,
      records: pointRecords,
      tasks: pointTasks,
      progressRows: pointProgressRows,
    });

    const { data: existing, error: existingError } = await supabase
      .from("student_knowledge_mastery")
      .select("id")
      .eq("user_id", userId)
      .eq("knowledge_point_code", point.code)
      .maybeSingle();

    if (existingError) throw existingError;

    const selectFields =
      "id, user_id, knowledge_point_code, knowledge_point_name, courseware_opened_count, courseware_completed_count, practice_attempts, correct_attempts, wrong_attempts, accuracy, pending_review_count, completed_review_count, mastery_score, mastery_level, reasons, last_activity_at, calculated_at, created_at, updated_at";
    const { user_id: _userId, knowledge_point_code: _code, ...updateDraft } = draft;
    const updatePayload = {
      ...updateDraft,
      updated_at: draft.calculated_at,
    };
    const { data: saved, error: saveError } = existing
      ? await supabase
          .from("student_knowledge_mastery")
          .update(updatePayload)
          .eq("id", existing.id)
          .select(selectFields)
          .single()
      : await supabase
          .from("student_knowledge_mastery")
          .insert({
            ...draft,
            updated_at: draft.calculated_at,
          })
          .select(selectFields)
          .single();

    if (saveError) throw saveError;
    savedRows.push(saved as StudentKnowledgeMastery);
  }

  return savedRows;
}
