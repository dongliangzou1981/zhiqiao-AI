import type { CoursewareQualityReport } from "@/lib/courseware-quality";

export type CoursewareAdoptionAdviceLevel = "adopt" | "trial" | "hold";

export type CoursewareAdoptionAdvice = {
  level: CoursewareAdoptionAdviceLevel;
  title: string;
  reasons: string[];
};

type BuildCoursewareAdoptionAdviceParams = {
  before: CoursewareQualityReport;
  after: CoursewareQualityReport;
};

export function buildCoursewareAdoptionAdvice({
  before,
  after,
}: BuildCoursewareAdoptionAdviceParams): CoursewareAdoptionAdvice {
  const scoreDelta = after.score - before.score;
  const reasons: string[] = [];

  if (scoreDelta > 0) {
    reasons.push(`质量分提升 ${scoreDelta} 分。`);
  } else if (scoreDelta < 0) {
    reasons.push(`质量分下降 ${Math.abs(scoreDelta)} 分。`);
  } else {
    reasons.push(`质量分保持 ${after.score} 分。`);
  }

  if (after.passedRequired) {
    reasons.push("必选质量项已通过，适合进入老师人工确认。");
  } else {
    reasons.push("仍有必选质量项未通过，需要先复核关键教学内容。");
  }

  if (scoreDelta < 0) {
    return {
      level: "hold",
      title: "建议暂缓采用",
      reasons,
    };
  }

  if (after.passedRequired && after.score >= 85) {
    return {
      level: "adopt",
      title: "建议采用新版",
      reasons,
    };
  }

  return {
    level: "trial",
    title: "可试讲，但需先复核",
    reasons,
  };
}
