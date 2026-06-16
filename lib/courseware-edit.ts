import { getCoursewareAssetMetadata } from "@/lib/courseware-asset";
import type { CoursewareJson } from "@/lib/courseware-types";
import {
  normalizeDynamicStoryboards,
} from "@/lib/courseware-storyboard";

type ExpectedCoursewareMeta = {
  knowledge_point_code: string;
  knowledge_point_name: string;
  subject: string;
  grade: string;
  semester: string;
  chapter: string;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeStringArray(value: unknown, fallback: string): string[] {
  if (!Array.isArray(value)) {
    return [fallback];
  }

  const normalized = value.filter(isNonEmptyString).map((item) => item.trim());
  return normalized.length > 0 ? normalized : [fallback];
}

function normalizeTargetStoryboardStep(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  const normalized = Math.trunc(value);
  return normalized > 0 ? normalized : undefined;
}

function isGenericStepTitle(value: string) {
  return /^第\s*\d+\s*步$/.test(value.trim());
}

function getStoryboardStepLabel(
  step: NonNullable<CoursewareJson["dynamic_storyboards"]>[number]["steps"][number],
  index: number
) {
  const stepTitle = isNonEmptyString(step.step_title) ? step.step_title.trim() : "";
  const fallbackLabel = [
    step.operation,
    step.formula_or_state,
    step.visual_state,
  ].find(isNonEmptyString);
  if (stepTitle.length > 0 && !isGenericStepTitle(stepTitle)) {
    return stepTitle;
  }

  if (fallbackLabel) {
    return fallbackLabel.trim();
  }

  return stepTitle || `第 ${index + 1} 步`;
}

export function getPracticeTargetStepOptions(
  storyboards: CoursewareJson["dynamic_storyboards"]
) {
  const steps = storyboards?.[0]?.steps ?? [];

  return steps.map((step, index) => ({
    value: index + 1,
    label: `${index + 1}. ${getStoryboardStepLabel(step, index)}`,
  }));
}

export function normalizeEditedCoursewareJson(
  value: unknown,
  expected: ExpectedCoursewareMeta
): CoursewareJson {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("课件结构无效");
  }

  const draft = value as Partial<CoursewareJson>;
  if (draft.version !== "courseware_json_v1") {
    throw new Error("课件版本无效");
  }

  if (draft.knowledge_point_code !== expected.knowledge_point_code) {
    throw new Error("知识点编码不匹配");
  }

  const slides = Array.isArray(draft.slides)
    ? draft.slides
        .filter((slide) => slide && typeof slide === "object")
        .map((slide) => {
          const item = slide as Partial<CoursewareJson["slides"][number]>;
          return {
            slide_type: isNonEmptyString(item.slide_type) ? item.slide_type.trim() : "concept",
            title: isNonEmptyString(item.title) ? item.title.trim() : "未命名页面",
            content: isNonEmptyString(item.content) ? item.content.trim() : "请补充页面内容。",
            knowledge_point_code: expected.knowledge_point_code,
            teacher_notes: isNonEmptyString(item.teacher_notes)
              ? item.teacher_notes.trim()
              : undefined,
          };
        })
    : [];

  const practiceItems = Array.isArray(draft.practice_items)
    ? draft.practice_items
        .filter((item) => item && typeof item === "object")
        .map((item) => {
          const practice = item as Partial<CoursewareJson["practice_items"][number]>;
          const difficulty = ["基础", "易错纠正", "拓展挑战"].includes(
            practice.difficulty ?? ""
          )
            ? practice.difficulty
            : "基础";

          return {
            question: isNonEmptyString(practice.question)
              ? practice.question.trim()
              : "请补充题目。",
            difficulty: difficulty as CoursewareJson["practice_items"][number]["difficulty"],
            answer: isNonEmptyString(practice.answer) ? practice.answer.trim() : "请补充答案。",
            explanation: isNonEmptyString(practice.explanation)
              ? practice.explanation.trim()
              : "请补充解析。",
            knowledge_point_code: expected.knowledge_point_code,
            target_storyboard_step: normalizeTargetStoryboardStep(
              practice.target_storyboard_step
            ),
          };
        })
    : [];

  if (slides.length === 0 || practiceItems.length === 0) {
    throw new Error("课件至少需要 1 页内容和 1 道练习");
  }

  return {
    version: "courseware_json_v1",
    knowledge_point_code: expected.knowledge_point_code,
    knowledge_point_name: expected.knowledge_point_name,
    subject: expected.subject,
    grade: expected.grade,
    semester: expected.semester,
    chapter: expected.chapter,
    learning_goals: normalizeStringArray(draft.learning_goals, "掌握本课基础知识。"),
    prerequisite_knowledge: Array.isArray(draft.prerequisite_knowledge)
      ? draft.prerequisite_knowledge
      : [],
    core_concept:
      draft.core_concept && typeof draft.core_concept === "object"
        ? draft.core_concept
        : { title: expected.knowledge_point_name, explanation: "请补充核心概念。" },
    slides,
    examples: Array.isArray(draft.examples) ? draft.examples : [],
    common_mistakes: Array.isArray(draft.common_mistakes) ? draft.common_mistakes : [],
    practice_items: practiceItems,
    summary_points: normalizeStringArray(draft.summary_points, "回顾本课核心知识点。"),
    review_plan: Array.isArray(draft.review_plan) ? draft.review_plan : [],
    dynamic_storyboards: normalizeDynamicStoryboards(draft.dynamic_storyboards, {
      knowledge_point_code: expected.knowledge_point_code,
      knowledge_point_name: expected.knowledge_point_name,
      slides,
      examples: Array.isArray(draft.examples)
        ? (draft.examples as CoursewareJson["examples"])
        : [],
    }),
    asset_metadata: getCoursewareAssetMetadata(draft),
  };
}
