import type { CoursewareQualityReport } from "@/lib/courseware-quality";

export type CoursewareRevisionApplyGuard = {
  canApply: boolean;
  requiresRiskConfirmation: boolean;
  message: string | null;
};

export function getCoursewareRevisionApplyGuard(
  qualityAfter: CoursewareQualityReport,
  teacherConfirmedRisk: boolean
): CoursewareRevisionApplyGuard {
  const requiresRiskConfirmation = !qualityAfter.passedRequired;

  if (!requiresRiskConfirmation) {
    return {
      canApply: true,
      requiresRiskConfirmation: false,
      message: null,
    };
  }

  return {
    canApply: teacherConfirmedRisk,
    requiresRiskConfirmation: true,
    message: teacherConfirmedRisk
      ? null
      : "优化版仍有必选质量项未通过，请先复核后再采用。",
  };
}
