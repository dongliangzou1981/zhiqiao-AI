import assert from "node:assert/strict";
import test from "node:test";
import { getCoursewareImproveButtonLabel } from "./courseware-improve-ui";

test("getCoursewareImproveButtonLabel shows loading state first", () => {
  assert.equal(
    getCoursewareImproveButtonLabel({ loading: true, issueCount: 3, passedRequired: false }),
    "正在生成优化候选版..."
  );
});

test("getCoursewareImproveButtonLabel shows issue count when quality issues exist", () => {
  assert.equal(
    getCoursewareImproveButtonLabel({ loading: false, issueCount: 3, passedRequired: false }),
    "按 3 个问题生成优化候选版"
  );
});

test("getCoursewareImproveButtonLabel still allows another candidate after required checks pass", () => {
  assert.equal(
    getCoursewareImproveButtonLabel({ loading: false, issueCount: 0, passedRequired: true }),
    "再生成一个优化候选版"
  );
});
