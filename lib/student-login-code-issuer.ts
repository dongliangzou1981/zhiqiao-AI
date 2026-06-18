import {
  generateStudentLoginCode,
  hashStudentLoginCode,
  type GenerateStudentLoginCodeOptions,
} from "./student-login-code";

export type StudentAccessCodeIssueInput = {
  teacherId: string;
  studentId: string;
  secret: string;
  now?: Date;
  ttlMinutes?: number;
  expiresAt?: string | Date;
  accessPath?: string;
  baseUrl?: string;
  codeOptions?: GenerateStudentLoginCodeOptions;
};

export type StudentAccessCodeIssue = {
  teacherId: string;
  studentId: string;
  plaintextCode: string;
  codeHash: string;
  qrUrl: string;
  expiresAt: string;
};

export type StudentAccessCodeTeacherPayload = {
  plaintextCode: string;
  qrUrl: string;
  expiresAt: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DEFAULT_ACCESS_PATH = "/auth/student-code";
const DEFAULT_TTL_MINUTES = 60 * 24 * 7;

function clean(value: string) {
  return value.trim();
}

function assertUuid(value: string, label: string) {
  if (!UUID_RE.test(value)) {
    throw new Error(`${label} must be a valid profile id.`);
  }
}

function assertPositiveInteger(value: number, label: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive integer.`);
  }
}

function normalizeAccessPath(path: string | undefined) {
  const cleaned = path?.trim() || DEFAULT_ACCESS_PATH;
  return cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
}

function resolveExpiresAt({
  expiresAt,
  now,
  ttlMinutes,
}: {
  expiresAt: string | Date | undefined;
  now: Date;
  ttlMinutes: number;
}) {
  if (expiresAt) {
    const explicitDate = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
    if (Number.isNaN(explicitDate.getTime())) {
      throw new Error("expiresAt must be a valid date.");
    }
    return explicitDate.toISOString();
  }

  assertPositiveInteger(ttlMinutes, "ttlMinutes");
  return new Date(now.getTime() + ttlMinutes * 60 * 1000).toISOString();
}

function buildQrUrl(code: string, accessPath: string, baseUrl: string | undefined) {
  if (baseUrl?.trim()) {
    const url = new URL(accessPath, baseUrl);
    url.searchParams.set("code", code);
    return url.toString();
  }

  return `${accessPath}?code=${encodeURIComponent(code)}`;
}

export function issueStudentAccessCode({
  teacherId,
  studentId,
  secret,
  now = new Date(),
  ttlMinutes = DEFAULT_TTL_MINUTES,
  expiresAt,
  accessPath,
  baseUrl,
  codeOptions,
}: StudentAccessCodeIssueInput): StudentAccessCodeIssue {
  const normalizedTeacherId = clean(teacherId);
  const normalizedStudentId = clean(studentId);
  assertUuid(normalizedTeacherId, "teacherId");
  assertUuid(normalizedStudentId, "studentId");

  if (normalizedTeacherId === normalizedStudentId) {
    throw new Error("teacherId and studentId must be different profile ids.");
  }

  const plaintextCode = generateStudentLoginCode(codeOptions);
  const codeHash = hashStudentLoginCode(plaintextCode, secret);
  const normalizedAccessPath = normalizeAccessPath(accessPath);

  return {
    teacherId: normalizedTeacherId,
    studentId: normalizedStudentId,
    plaintextCode,
    codeHash,
    qrUrl: buildQrUrl(plaintextCode, normalizedAccessPath, baseUrl),
    expiresAt: resolveExpiresAt({ expiresAt, now, ttlMinutes }),
  };
}

export function buildStudentAccessCodeTeacherPayload(
  issue: StudentAccessCodeIssue
): StudentAccessCodeTeacherPayload {
  return {
    plaintextCode: issue.plaintextCode,
    qrUrl: issue.qrUrl,
    expiresAt: issue.expiresAt,
  };
}
