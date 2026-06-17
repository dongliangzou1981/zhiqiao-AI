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
