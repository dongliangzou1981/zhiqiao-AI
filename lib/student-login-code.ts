import { createHash, randomInt, timingSafeEqual } from "node:crypto";

export type StudentLoginCodeRecord = {
  code_hash?: string | null;
  expires_at?: string | Date | null;
  revoked_at?: string | Date | null;
};

export type StudentLoginCodeReadinessStatus =
  | "usable"
  | "missing_hash"
  | "expired"
  | "revoked";

export type StudentLoginCodeReadiness = {
  usable: boolean;
  status: StudentLoginCodeReadinessStatus;
  reason: string;
};

export type GenerateStudentLoginCodeOptions = {
  segmentLength?: number;
  segmentCount?: number;
  alphabet?: string;
};

const DEFAULT_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const DEFAULT_SEGMENT_LENGTH = 4;
const DEFAULT_SEGMENT_COUNT = 3;
const HASH_PREFIX = "sha256:";

function assertPositiveInteger(value: number, label: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive integer.`);
  }
}

export function generateStudentLoginCode({
  segmentLength = DEFAULT_SEGMENT_LENGTH,
  segmentCount = DEFAULT_SEGMENT_COUNT,
  alphabet = DEFAULT_ALPHABET,
}: GenerateStudentLoginCodeOptions = {}): string {
  assertPositiveInteger(segmentLength, "segmentLength");
  assertPositiveInteger(segmentCount, "segmentCount");

  const normalizedAlphabet = Array.from(new Set(alphabet.split("")));
  if (normalizedAlphabet.length < 2) {
    throw new RangeError("alphabet must contain at least two unique characters.");
  }

  return Array.from({ length: segmentCount }, () =>
    Array.from(
      { length: segmentLength },
      () => normalizedAlphabet[randomInt(normalizedAlphabet.length)]
    ).join("")
  ).join("-");
}

export function normalizeStudentLoginCode(value: unknown): string {
  return typeof value === "string"
    ? value.normalize("NFKC").trim().toUpperCase().replace(/[\s-]+/g, "")
    : "";
}

export function hashStudentLoginCode(code: string): string {
  const normalizedCode = normalizeStudentLoginCode(code);
  const digest = createHash("sha256").update(normalizedCode, "utf8").digest("hex");
  return `${HASH_PREFIX}${digest}`;
}

export function verifyStudentLoginCodeHash(
  code: string,
  expectedHash: string | null | undefined
): boolean {
  if (!expectedHash) return false;

  const actualHash = hashStudentLoginCode(code);
  const actualBuffer = Buffer.from(actualHash, "utf8");
  const expectedBuffer = Buffer.from(expectedHash, "utf8");

  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

function toTime(value: string | Date | null | undefined): number | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? null : time;
}

export function isStudentLoginCodeExpired(
  expiresAt: string | Date | null | undefined,
  now = new Date()
): boolean {
  const expiresAtTime = toTime(expiresAt);
  if (expiresAtTime === null) return false;

  return expiresAtTime <= now.getTime();
}

export function isStudentLoginCodeRevoked(
  revokedAt: string | Date | null | undefined
): boolean {
  return toTime(revokedAt) !== null;
}

export function getStudentLoginCodeReadiness(
  code: StudentLoginCodeRecord,
  now = new Date()
): StudentLoginCodeReadiness {
  if (!code.code_hash?.trim()) {
    return {
      usable: false,
      status: "missing_hash",
      reason: "Login code hash is missing.",
    };
  }

  if (isStudentLoginCodeRevoked(code.revoked_at)) {
    return {
      usable: false,
      status: "revoked",
      reason: "Login code has been revoked.",
    };
  }

  if (isStudentLoginCodeExpired(code.expires_at, now)) {
    return {
      usable: false,
      status: "expired",
      reason: "Login code has expired.",
    };
  }

  return {
    usable: true,
    status: "usable",
    reason: "Login code is usable.",
  };
}
