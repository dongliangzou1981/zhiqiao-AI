import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeCreateExternalImportJobInput,
  normalizeExternalReviewInput,
} from "./k12-knowledge/external-queries";

test("normalizeCreateExternalImportJobInput trims required import fields", () => {
  assert.deepEqual(
    normalizeCreateExternalImportJobInput({
      sourceId: " source-1 ",
      importType: " csv_knowledge_points ",
      fileName: " points.csv ",
    }),
    {
      source_id: "source-1",
      import_type: "csv_knowledge_points",
      file_name: "points.csv",
    }
  );
});

test("normalizeCreateExternalImportJobInput rejects missing source", () => {
  assert.throws(
    () => normalizeCreateExternalImportJobInput({ sourceId: " ", importType: "csv" }),
    /sourceId is required/
  );
});

test("normalizeExternalReviewInput preserves optional reviewer and target", () => {
  assert.deepEqual(
    normalizeExternalReviewInput({
      itemId: " item-1 ",
      reviewerId: " reviewer-1 ",
      targetId: " target-1 ",
      note: " looks clean ",
    }),
    {
      itemId: "item-1",
      reviewerId: "reviewer-1",
      targetId: "target-1",
      note: "looks clean",
    }
  );
});
