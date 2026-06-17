import type { CoursewareQualityReport } from "@/lib/courseware-quality";
import type { CoursewareJson } from "@/lib/courseware-types";

export type CoursewareRevisionDiffSummary = {
  scoreDelta: number;
  highlights: string[];
  slideTitleChanges: string[];
};

type BuildCoursewareRevisionDiffSummaryParams = {
  currentCourseware: CoursewareJson;
  candidateCourseware: CoursewareJson;
  qualityBefore: CoursewareQualityReport;
  qualityAfter: CoursewareQualityReport;
};

function countStoryboardSteps(courseware: CoursewareJson) {
  return (courseware.dynamic_storyboards ?? []).reduce(
    (count, storyboard) => count + storyboard.steps.length,
    0
  );
}

function describeCountChange(label: string, before: number, after: number, unit: string) {
  if (before === after) {
    return `${label}保持 ${after} ${unit}。`;
  }

  return after > before
    ? `${label}从 ${before} ${unit}增加到 ${after} ${unit}。`
    : `${label}从 ${before} ${unit}减少到 ${after} ${unit}。`;
}

export function buildCoursewareRevisionDiffSummary({
  currentCourseware,
  candidateCourseware,
  qualityBefore,
  qualityAfter,
}: BuildCoursewareRevisionDiffSummaryParams): CoursewareRevisionDiffSummary {
  const scoreDelta = qualityAfter.score - qualityBefore.score;
  const currentSlideTitles = new Set(currentCourseware.slides.map((slide) => slide.title));
  const addedSlideTitles = candidateCourseware.slides
    .map((slide) => slide.title)
    .filter((title) => title && !currentSlideTitles.has(title));
  const highlights: string[] = [];

  if (scoreDelta > 0) {
    highlights.push(
      `内容质量分提升 ${scoreDelta} 分，${
        qualityAfter.passedRequired ? "必选项已通过" : "仍需老师复核必选项"
      }。`
    );
  } else if (scoreDelta < 0) {
    highlights.push(`内容质量分下降 ${Math.abs(scoreDelta)} 分，建议谨慎采用。`);
  } else {
    highlights.push(
      `内容质量分保持 ${qualityAfter.score} 分，建议重点看讲解节奏和页面表现。`
    );
  }

  highlights.push(
    describeCountChange(
      "幻灯片",
      currentCourseware.slides.length,
      candidateCourseware.slides.length,
      "页"
    )
  );
  highlights.push(
    describeCountChange(
      "动态讲解步骤",
      countStoryboardSteps(currentCourseware),
      countStoryboardSteps(candidateCourseware),
      "步"
    )
  );
  highlights.push(
    describeCountChange(
      "基础练习",
      currentCourseware.practice_items.length,
      candidateCourseware.practice_items.length,
      "道"
    )
  );

  return {
    scoreDelta,
    highlights,
    slideTitleChanges: addedSlideTitles.map((title) => `新增或重写页面：${title}`),
  };
}
