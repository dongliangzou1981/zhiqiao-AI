export type CoursewareFeedbackLevel =
  | "understood"
  | "partly_understood"
  | "not_understood";

export type CoursewareFeedbackTone = "positive" | "warning" | "critical";

export type CoursewareFeedbackStatus = {
  label: string;
  tone: CoursewareFeedbackTone;
  summary: string;
};

export type CoursewareFeedbackImprovementInput = {
  understanding_level: CoursewareFeedbackLevel;
  need_teacher_help: boolean;
  feedback_text?: string | null;
};

export type CoursewareFeedbackFollowUpTone =
  | "pending"
  | "review"
  | "revision"
  | "applied"
  | "published";

export type CoursewareFeedbackFollowUpStatus = {
  label: string;
  tone: CoursewareFeedbackFollowUpTone;
  summary: string;
};

export type CoursewareFeedbackFollowUpInput = {
  hasTeacherReviewAfterFeedback?: boolean;
  hasPendingRevisionAfterFeedback?: boolean;
  hasAppliedRevisionAfterFeedback?: boolean;
  hasPublishedAfterFeedback?: boolean;
};

export type CoursewareFeedbackFollowUpFeedback = {
  user_id: string;
  courseware_id: string;
  knowledge_point_code: string;
  updated_at: string;
};

export type CoursewareFeedbackFollowUpTask = {
  user_id: string;
  knowledge_point_code: string;
  task_type: string;
  created_at: string;
};

export type CoursewareFeedbackFollowUpRevision = {
  courseware_id: string;
  status: "pending" | "applied" | "discarded";
  created_at: string;
  applied_at?: string | null;
};

export type CoursewareFeedbackFollowUpCourseware = {
  id: string;
  is_published: boolean;
  published_at?: string | null;
};

export type CoursewareFeedbackFollowUpSignals = {
  tasks: CoursewareFeedbackFollowUpTask[];
  revisions: CoursewareFeedbackFollowUpRevision[];
  coursewares: CoursewareFeedbackFollowUpCourseware[];
};

const FEEDBACK_LEVELS = new Set<CoursewareFeedbackLevel>([
  "understood",
  "partly_understood",
  "not_understood",
]);

export function normalizeCoursewareFeedbackLevel(
  value: unknown
): CoursewareFeedbackLevel | null {
  return typeof value === "string" && FEEDBACK_LEVELS.has(value as CoursewareFeedbackLevel)
    ? (value as CoursewareFeedbackLevel)
    : null;
}

export function shouldRequestTeacherHelp(
  level: CoursewareFeedbackLevel,
  needTeacherHelp: boolean
): boolean {
  return level === "not_understood" || needTeacherHelp;
}

export function buildCoursewareFeedbackStatus(
  level: CoursewareFeedbackLevel,
  needTeacherHelp: boolean
): CoursewareFeedbackStatus {
  if (level === "understood") {
    return {
      label: "已看懂",
      tone: "positive",
      summary: "学生认为这份课件已经讲清楚，可以继续做基础练习巩固。",
    };
  }

  if (level === "partly_understood") {
    return {
      label: needTeacherHelp ? "部分看懂，需要老师跟进" : "部分看懂",
      tone: "warning",
      summary: needTeacherHelp
        ? "学生还有不确定的环节，并主动请求老师再讲一次。"
        : "学生能跟上部分内容，但仍需要回看关键步骤或补做基础练习。",
    };
  }

  return {
    label: needTeacherHelp ? "没看懂，需要老师跟进" : "没看懂",
    tone: "critical",
    summary: needTeacherHelp
      ? "学生反馈当前课件还没有讲明白，并主动请求老师再讲一次。"
      : "学生反馈当前课件还没有讲明白，应优先回看关键步骤或等待老师讲解。",
  };
}

export function buildCoursewareFeedbackFollowUpStatus({
  hasTeacherReviewAfterFeedback = false,
  hasPendingRevisionAfterFeedback = false,
  hasAppliedRevisionAfterFeedback = false,
  hasPublishedAfterFeedback = false,
}: CoursewareFeedbackFollowUpInput): CoursewareFeedbackFollowUpStatus {
  if (hasPublishedAfterFeedback) {
    return {
      label: "已发布新版",
      tone: "published",
      summary: "学生反馈后，老师已经发布新版课件，可继续观察学生复习和后续反馈。",
    };
  }

  if (hasAppliedRevisionAfterFeedback) {
    return {
      label: "已采用新版",
      tone: "applied",
      summary: "学生反馈后，老师已经采用优化候选版，发布给学生前仍需确认发布状态。",
    };
  }

  if (hasPendingRevisionAfterFeedback) {
    return {
      label: "已有优化候选",
      tone: "revision",
      summary: "学生反馈后，老师已经生成优化候选版，下一步是预览、采用并发布。",
    };
  }

  if (hasTeacherReviewAfterFeedback) {
    return {
      label: "已布置复习",
      tone: "review",
      summary: "学生反馈后，老师已经布置复习任务，但课件本身还可以继续优化。",
    };
  }

  return {
    label: "待跟进",
    tone: "pending",
    summary: "还没有看到反馈后的复习布置、优化候选版或新版发布记录。",
  };
}

function isAtOrAfter(value: string | null | undefined, reference: string) {
  return Boolean(value && value >= reference);
}

export function buildCoursewareFeedbackFollowUpFromSignals(
  feedback: CoursewareFeedbackFollowUpFeedback,
  { tasks, revisions, coursewares }: CoursewareFeedbackFollowUpSignals
): CoursewareFeedbackFollowUpStatus {
  const hasTeacherReviewAfterFeedback = tasks.some(
    (task) =>
      task.task_type === "teacher_review" &&
      task.user_id === feedback.user_id &&
      task.knowledge_point_code === feedback.knowledge_point_code &&
      isAtOrAfter(task.created_at, feedback.updated_at)
  );
  const hasPendingRevisionAfterFeedback = revisions.some(
    (revision) =>
      revision.courseware_id === feedback.courseware_id &&
      revision.status === "pending" &&
      isAtOrAfter(revision.created_at, feedback.updated_at)
  );
  const hasAppliedRevisionAfterFeedback = revisions.some(
    (revision) =>
      revision.courseware_id === feedback.courseware_id &&
      revision.status === "applied" &&
      isAtOrAfter(revision.applied_at ?? revision.created_at, feedback.updated_at)
  );
  const publishedCourseware = coursewares.find(
    (courseware) => courseware.id === feedback.courseware_id
  );
  const hasPublishedAfterFeedback = Boolean(
    publishedCourseware?.is_published &&
      isAtOrAfter(publishedCourseware.published_at, feedback.updated_at)
  );

  return buildCoursewareFeedbackFollowUpStatus({
    hasTeacherReviewAfterFeedback,
    hasPendingRevisionAfterFeedback,
    hasAppliedRevisionAfterFeedback,
    hasPublishedAfterFeedback,
  });
}

function cleanFeedbackText(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 1))}…`;
}

function truncateSummary(value: string) {
  return truncateText(value, 280);
}

export function buildCoursewareFeedbackImprovementSummary(
  rows: CoursewareFeedbackImprovementInput[]
): string {
  const actionableRows = rows.filter(
    (row) => row.understanding_level !== "understood" || row.need_teacher_help
  );

  if (actionableRows.length === 0) {
    return "";
  }

  const notUnderstoodCount = actionableRows.filter(
    (row) => row.understanding_level === "not_understood"
  ).length;
  const partlyUnderstoodCount = actionableRows.filter(
    (row) => row.understanding_level === "partly_understood"
  ).length;
  const helpCount = actionableRows.filter((row) => row.need_teacher_help).length;
  const snippets = actionableRows
    .map((row) => cleanFeedbackText(row.feedback_text))
    .filter(Boolean)
    .slice(0, 3)
    .map((text) => `“${truncateText(text, 36)}”`);

  const signals: string[] = [];
  if (notUnderstoodCount > 0) signals.push(`${notUnderstoodCount} 名没看懂`);
  if (partlyUnderstoodCount > 0) signals.push(`${partlyUnderstoodCount} 名部分看懂`);
  if (helpCount > 0) signals.push(`${helpCount} 名希望老师再讲一次`);

  const signalText = signals.length > 0 ? `，其中 ${signals.join("，")}` : "";
  const snippetText =
    snippets.length > 0 ? `。学生说明：${snippets.join("；")}` : "";

  return truncateSummary(
    `${actionableRows.length} 名学生反馈这份课件还没有完全讲透${signalText}${snippetText}。请基于这些反馈补全关键步骤推导，讲慢一点，并减少 AI 套话。`
  );
}
