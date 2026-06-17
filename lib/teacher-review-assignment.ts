export type TeacherReviewAssignment = {
  knowledgePointCode: string;
  studentIds: string[];
  dueDate: string;
};

export type TeacherReviewAssignmentValidation =
  | {
      ok: true;
      value: TeacherReviewAssignment;
    }
  | {
      ok: false;
      status: 400;
      error: string;
    };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function isValidStudentId(value: string) {
  return UUID_RE.test(value);
}

export function isValidDueDate(value: string, today = new Date()) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return false;
  }

  const todayUtc = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );
  return date >= todayUtc;
}

export function normalizeTeacherReviewAssignmentRequest(
  body: unknown,
  today = new Date()
): TeacherReviewAssignmentValidation {
  const source = isObject(body) ? body : {};
  const knowledgePointCode = clean(source.knowledgePointCode);

  if (!knowledgePointCode) {
    return { ok: false, status: 400, error: "缺少知识点编号" };
  }

  const studentIds = Array.isArray(source.studentIds)
    ? [...new Set(source.studentIds.map(clean).filter(Boolean))]
    : [];

  if (studentIds.length === 0) {
    return { ok: false, status: 400, error: "请选择要布置复习的学生" };
  }

  if (studentIds.some((studentId) => !isValidStudentId(studentId))) {
    return { ok: false, status: 400, error: "学生ID无效" };
  }

  const dueDate = clean(source.dueDate);
  if (!isValidDueDate(dueDate, today)) {
    return { ok: false, status: 400, error: "请选择今天或之后的有效到期日" };
  }

  return {
    ok: true,
    value: {
      knowledgePointCode,
      studentIds,
      dueDate,
    },
  };
}
