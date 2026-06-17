import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCoursewareJsonReference,
  buildCoursewareQualityImprovementFeedback,
} from "./courseware-improvement";
import type { CoursewareQualityReport } from "./courseware-quality";

const failingReport: CoursewareQualityReport = {
  version: "courseware_quality_v1",
  score: 71,
  passedRequired: false,
  generatedAt: "2026-06-16T00:00:00.000Z",
  checks: [
    {
      id: "storyboard-complete",
      label: "动态分镜保留完整过程",
      passed: false,
      severity: "required",
      detail: "动态课件需要 8 步以上，并且每步包含画面、讲解、依据和重点提示。",
    },
    {
      id: "html-rich-layout",
      label: "幻灯片版式有变化",
      passed: false,
      severity: "recommended",
      detail: "建议每套课件至少标记 3 种页面版式，避免整套课件都像同一张模板。",
    },
    {
      id: "mistakes",
      label: "易错点可纠正",
      passed: true,
      severity: "required",
      detail: "至少 3 个易错点。",
    },
  ],
};

test("buildCoursewareQualityImprovementFeedback turns failed checks into model guidance", () => {
  const feedback = buildCoursewareQualityImprovementFeedback(
    failingReport,
    "把同类项合并过程讲得更慢。"
  );

  assert.match(feedback, /真实课堂投屏/);
  assert.match(feedback, /动态分镜保留完整过程/);
  assert.match(feedback, /幻灯片版式有变化/);
  assert.match(feedback, /把同类项合并过程讲得更慢/);
  assert.doesNotMatch(feedback, /易错点可纠正/);
});

test("buildCoursewareJsonReference strips large html before sending reference back to model", () => {
  const reference = buildCoursewareJsonReference({
    version: "courseware_json_v1",
    interactive_html: {
      title: "一元一次方程",
      html: "<html><body>large html</body></html>",
    },
  });

  assert.match(reference, /courseware_json_v1/);
  assert.match(reference, /HTML 已省略/);
  assert.doesNotMatch(reference, /large html/);
});
