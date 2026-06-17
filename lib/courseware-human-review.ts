import type { CoursewareQualityReport } from "@/lib/courseware-quality";

export type CoursewareHumanReviewStatus = "建议查看" | "重点复核";

export type CoursewareHumanReviewItem = {
  title: string;
  description: string;
  status: CoursewareHumanReviewStatus;
  reason: string;
};

type ReviewDefinition = {
  title: string;
  description: string;
  relatedCheckIds: string[];
};

const reviewDefinitions: ReviewDefinition[] = [
  {
    title: "数学内容正确性",
    description: "核对概念、例题、答案和变形依据，确认没有数学错误。",
    relatedCheckIds: ["knowledge-trace", "step-reasoning"],
  },
  {
    title: "推导过程完整性",
    description: "确认关键步骤没有跳步，弱基础学生也能跟上。",
    relatedCheckIds: ["complete-example", "step-reasoning", "storyboard-complete"],
  },
  {
    title: "课堂投屏可用性",
    description: "确认幻灯片 16:9、无滚动、重点醒目，适合教室大屏。",
    relatedCheckIds: ["html-projection", "html-rich-layout"],
  },
  {
    title: "学生课后复习可用性",
    description: "确认练习、错因、复习任务能回到知识点，学生能独立回看。",
    relatedCheckIds: ["practice-layering", "practice-replay", "review-reuse"],
  },
];

export function buildCoursewareHumanReviewChecklist(
  report: CoursewareQualityReport
): CoursewareHumanReviewItem[] {
  return reviewDefinitions.map((definition) => {
    const failedRelatedChecks = report.checks.filter(
      (check) => !check.passed && definition.relatedCheckIds.includes(check.id)
    );

    return {
      title: definition.title,
      description: definition.description,
      status: failedRelatedChecks.length > 0 ? "重点复核" : "建议查看",
      reason:
        failedRelatedChecks.length > 0
          ? failedRelatedChecks.map((check) => check.label).join("、")
          : "自动检查暂未发现对应硬性问题。",
    };
  });
}
