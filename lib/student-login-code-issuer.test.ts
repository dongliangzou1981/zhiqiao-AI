import test from "node:test";
import assert from "node:assert/strict";
import {
  buildStudentAccessCodeTeacherPayload,
  issueStudentAccessCode,
} from "./student-login-code-issuer";
import { verifyStudentLoginCodeHash } from "./student-login-code";

const teacherId = "11111111-1111-4111-8111-111111111111";
const studentId = "22222222-2222-4222-8222-222222222222";
const secret = "server-side-test-secret";
const now = new Date("2026-06-18T00:00:00.000Z");

function issue(overrides = {}) {
  return issueStudentAccessCode({
    teacherId,
    studentId,
    secret,
    now,
    ...overrides,
  });
}

test("issueStudentAccessCode generates a plaintext access code", () => {
  const result = issue();

  assert.notEqual(result.plaintextCode, "");
  assert.match(result.plaintextCode, /^[A-Z2-9]+(?:-[A-Z2-9]+)*$/);
});

test("issueStudentAccessCode generates an HMAC hash for the access code", () => {
  const result = issue();

  assert.match(result.codeHash, /^hmac-sha256:[a-f0-9]{64}$/);
  assert.equal(
    verifyStudentLoginCodeHash(result.plaintextCode, result.codeHash, secret),
    true
  );
});

test("issueStudentAccessCode does not make the plaintext code equal to the hash", () => {
  const result = issue();

  assert.notEqual(result.plaintextCode, result.codeHash);
});

test("issueStudentAccessCode throws when the secret is missing", () => {
  assert.throws(
    () => issueStudentAccessCode({ teacherId, studentId, secret: "", now }),
    /secret is required/i
  );
});

test("issueStudentAccessCode builds a draft student access QR URL", () => {
  const result = issue({
    baseUrl: "https://example.com",
    codeOptions: { segmentLength: 4, segmentCount: 1, alphabet: "ABCD2345" },
  });

  assert.match(result.qrUrl, /^https:\/\/example\.com\/auth\/student-code\?code=/);
  assert.match(result.qrUrl, /code=/);
});

test("issueStudentAccessCode allows configurable expiration", () => {
  assert.equal(
    issue({ ttlMinutes: 30 }).expiresAt,
    "2026-06-18T00:30:00.000Z"
  );
  assert.equal(
    issue({ expiresAt: "2026-06-20T08:00:00.000Z" }).expiresAt,
    "2026-06-20T08:00:00.000Z"
  );
});

test("issueStudentAccessCode does not return password or secret fields", () => {
  const serialized = JSON.stringify(issue());

  assert.doesNotMatch(serialized, /password/i);
  assert.doesNotMatch(serialized, /server-side-test-secret/);
});

test("buildStudentAccessCodeTeacherPayload does not expose code hash fields", () => {
  const payload = buildStudentAccessCodeTeacherPayload(issue());
  const serialized = JSON.stringify(payload);

  assert.equal("codeHash" in payload, false);
  assert.equal("code_hash" in payload, false);
  assert.doesNotMatch(serialized, /codeHash|code_hash/);
});

test("issueStudentAccessCode validates teacher and student profile ids", () => {
  assert.throws(
    () => issueStudentAccessCode({ teacherId: "bad-id", studentId, secret, now }),
    /teacherId must be a valid profile id/
  );
  assert.throws(
    () => issueStudentAccessCode({ teacherId, studentId: teacherId, secret, now }),
    /must be different/
  );
});
