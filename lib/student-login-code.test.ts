import test from "node:test";
import assert from "node:assert/strict";
import {
  generateStudentLoginCode,
  getStudentLoginCodeReadiness,
  hashStudentLoginCode,
  normalizeStudentLoginCode,
  verifyStudentLoginCodeHash,
} from "./student-login-code";

test("generateStudentLoginCode returns a non-empty login code", () => {
  const code = generateStudentLoginCode();

  assert.notEqual(code, "");
  assert.match(code, /^[A-Z2-9]+(?:-[A-Z2-9]+)*$/);
});

test("normalizeStudentLoginCode is stable across casing, spaces and hyphens", () => {
  const normalized = normalizeStudentLoginCode(" abcd-ef12  gh34 ");

  assert.equal(normalized, "ABCDEF12GH34");
  assert.equal(normalizeStudentLoginCode(normalized), normalized);
});

test("hashStudentLoginCode does not return the plaintext code", () => {
  const code = "ABCD-EF12-GH34";
  const hash = hashStudentLoginCode(code);

  assert.notEqual(hash, code);
  assert.match(hash, /^sha256:[a-f0-9]{64}$/);
});

test("verifyStudentLoginCodeHash accepts the correct login code", () => {
  const hash = hashStudentLoginCode("ABCD-EF12-GH34");

  assert.equal(verifyStudentLoginCodeHash("abcd ef12 gh34", hash), true);
});

test("verifyStudentLoginCodeHash rejects an incorrect login code", () => {
  const hash = hashStudentLoginCode("ABCD-EF12-GH34");

  assert.equal(verifyStudentLoginCodeHash("WRONG-CODE", hash), false);
});

test("getStudentLoginCodeReadiness marks expired codes as unusable", () => {
  const readiness = getStudentLoginCodeReadiness(
    {
      code_hash: hashStudentLoginCode("ABCD-EF12-GH34"),
      expires_at: "2026-06-17T00:00:00.000Z",
      revoked_at: null,
    },
    new Date("2026-06-18T00:00:00.000Z")
  );

  assert.equal(readiness.usable, false);
  assert.equal(readiness.status, "expired");
});

test("getStudentLoginCodeReadiness marks revoked codes as unusable", () => {
  const readiness = getStudentLoginCodeReadiness({
    code_hash: hashStudentLoginCode("ABCD-EF12-GH34"),
    expires_at: null,
    revoked_at: "2026-06-18T00:00:00.000Z",
  });

  assert.equal(readiness.usable, false);
  assert.equal(readiness.status, "revoked");
});

test("getStudentLoginCodeReadiness marks active codes as usable", () => {
  const readiness = getStudentLoginCodeReadiness(
    {
      code_hash: hashStudentLoginCode("ABCD-EF12-GH34"),
      expires_at: "2026-06-19T00:00:00.000Z",
      revoked_at: null,
    },
    new Date("2026-06-18T00:00:00.000Z")
  );

  assert.equal(readiness.usable, true);
  assert.equal(readiness.status, "usable");
});
