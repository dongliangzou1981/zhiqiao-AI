import type { CoursewareQualityReport } from "@/lib/courseware-quality";

export type CoursewarePublishGuard = {
  canPublishChange: boolean;
  requiresRiskConfirmation: boolean;
  message: string | null;
};

type GetCoursewarePublishGuardParams = {
  publishing: boolean;
  quality: CoursewareQualityReport;
  teacherConfirmedRisk: boolean;
};

export function getCoursewarePublishGuard({
  publishing,
  quality,
  teacherConfirmedRisk,
}: GetCoursewarePublishGuardParams): CoursewarePublishGuard {
  if (!publishing || quality.passedRequired) {
    return {
      canPublishChange: true,
      requiresRiskConfirmation: false,
      message: null,
    };
  }

  return {
    canPublishChange: teacherConfirmedRisk,
    requiresRiskConfirmation: true,
    message: teacherConfirmedRisk
      ? null
      : "课件仍有必选质量项未通过，请先复核后再发布给学生。",
  };
}
