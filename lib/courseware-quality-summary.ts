import type { CoursewareQualityReport } from "@/lib/courseware-quality";

export type CoursewareQualityReviewSummary = {
  statusLabel: "可进入人工确认" | "仍需复核";
  requiredItems: string[];
  recommendedItems: string[];
};

function formatIssue(label: string, detail: string) {
  return `${label}：${detail}`;
}

export function buildCoursewareQualityReviewSummary(
  report: CoursewareQualityReport,
  limit: number = 4
): CoursewareQualityReviewSummary {
  const failedRequired = report.checks.filter(
    (check) => !check.passed && check.severity === "required"
  );
  const failedRecommended = report.checks.filter(
    (check) => !check.passed && check.severity === "recommended"
  );

  return {
    statusLabel: report.passedRequired ? "可进入人工确认" : "仍需复核",
    requiredItems: failedRequired
      .slice(0, limit)
      .map((check) => formatIssue(check.label, check.detail)),
    recommendedItems: failedRecommended
      .slice(0, limit)
      .map((check) => formatIssue(check.label, check.detail)),
  };
}
