import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDiscardPendingRevisionUpdates,
  getLatestPendingCoursewareRevision,
  normalizeCoursewareRevisionStatus,
} from "./courseware-revisions";

test("normalizeCoursewareRevisionStatus accepts only known revision states", () => {
  assert.equal(normalizeCoursewareRevisionStatus("pending"), "pending");
  assert.equal(normalizeCoursewareRevisionStatus("applied"), "applied");
  assert.equal(normalizeCoursewareRevisionStatus("discarded"), "discarded");
  assert.equal(normalizeCoursewareRevisionStatus("draft"), null);
  assert.equal(normalizeCoursewareRevisionStatus(null), null);
});

test("getLatestPendingCoursewareRevision returns newest pending revision only", () => {
  const latest = getLatestPendingCoursewareRevision([
    { id: "old-pending", status: "pending", created_at: "2026-06-16T08:00:00.000Z" },
    { id: "applied", status: "applied", created_at: "2026-06-16T10:00:00.000Z" },
    { id: "new-pending", status: "pending", created_at: "2026-06-16T09:00:00.000Z" },
  ]);

  assert.equal(latest?.id, "new-pending");
});

test("buildDiscardPendingRevisionUpdates marks previous pending revisions as discarded", () => {
  const updates = buildDiscardPendingRevisionUpdates([
    { id: "old-pending", status: "pending", created_at: "2026-06-16T08:00:00.000Z" },
    { id: "applied", status: "applied", created_at: "2026-06-16T10:00:00.000Z" },
    { id: "new-pending", status: "pending", created_at: "2026-06-16T09:00:00.000Z" },
  ]);

  assert.deepEqual(updates, [
    { id: "old-pending", status: "discarded" },
    { id: "new-pending", status: "discarded" },
  ]);
});
