import { readFile } from "fs/promises";
import path from "path";
import { getAIClient, getAIModel, shouldUseAIJsonResponseFormat } from "@/lib/ai";
import type { CoursewareAssetMetadata } from "@/lib/courseware-asset";
import type { GenerateCoursewareParams } from "@/lib/courseware";

export type CoursewareJson = {
  version: "courseware_json_v1";
  knowledge_point_code: string;
  knowledge_point_name: string;
  subject: string;
  grade: string;
  semester: string;
  chapter: string;
  learning_goals: string[];
  prerequisite_knowledge: Array<{
    title: string;
    description: string;
  }>;
  core_concept: {
    title: string;
    explanation: string;
  };
  slides: Array<{
    slide_type: string;
    title: string;
    content: string;
    knowledge_point_code: string;
    teacher_notes?: string;
  }>;
  examples: Array<{
    title: string;
    question: string;
    solution_steps: string[];
    answer: string;
    knowledge_point_code: string;
  }>;
  common_mistakes: Array<{
    mistake: string;
    reason: string;
    correction: string;
    knowledge_point_code: string;
  }>;
  practice_items: Array<{
    question: string;
    difficulty: "基础" | "易错纠正" | "拓展挑战";
    answer: string;
    explanation: string;
    knowledge_point_code: string;
    target_storyboard_step?: number;
  }>;
  summary_points: string[];
  review_plan: Array<{
    timing: string;
    task: string;
  }>;
  interactive_html?: CoursewareInteractiveHtml;
  dynamic_storyboards?: DynamicStoryboard[];
  asset_metadata?: CoursewareAssetMetadata;
};

export type CoursewareInteractiveHtml = {
  title: string;
  html: string;
  instructions?: string;
};

type GenerateCoursewareJsonParams = GenerateCoursewareParams & {
  content_markdown: string;
};

export type DynamicStoryboard = {
  title: string;
  scene_type: "derivation" | "number_line" | "concept_evolution" | "process" | "comparison";
  learning_objective: string;
  knowledge_point_code: string;
  steps: DynamicStoryboardStep[];
  summary: string;
};

export type DynamicStoryboardStep = {
  step_title: string;
  narration: string;
  visual_state: string;
  formula_or_state?: string;
  visual_elements?: DynamicVisualElement[];
  operation?: string;
  operation_reason?: string;
  emphasis_points?: string[];
  teacher_prompt?: string;
  student_check?: string;
};

export type DynamicVisualElement = {
  kind:
    | "title"
    | "text"
    | "formula"
    | "badge"
    | "panel"
    | "arrow"
    | "highlight"
    | "number_line"
    | "comparison";
  text: string;
  role?: "primary" | "secondary" | "emphasis" | "success" | "warning" | "muted";
  group?: string;
  items?: string[];
};

const SYSTEM_PROMPT =
  "你是一位教育内容结构化助手，只输出可被 JSON.parse 解析的合法 JSON。";

let cachedPromptTemplate: string | null = null;

async function getPromptTemplate() {
  if (cachedPromptTemplate) {
    return cachedPromptTemplate;
  }

  const promptPath = path.join(process.cwd(), "prompts", "courseware-json.md");
  cachedPromptTemplate = await readFile(promptPath, "utf8");
  return cachedPromptTemplate;
}

function replaceAll(input: string, replacements: Record<string, string>) {
  return Object.entries(replacements).reduce(
    (content, [key, value]) => content.replaceAll(`{${key}}`, value),
    input
  );
}

function normalizeParams(params: GenerateCoursewareJsonParams) {
  return {
    subject: params.subject.trim(),
    grade: params.grade.trim(),
    semester: params.semester.trim(),
    chapter: params.chapter.trim(),
    knowledge_point_code: params.knowledge_point_code.trim(),
    knowledge_point_name: params.knowledge_point_name.trim(),
    description: params.description.trim(),
    content_markdown: params.content_markdown.trim(),
  };
}

function extractJson(raw: string) {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const content = fenced ? fenced[1].trim() : trimmed;
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI model returned JSON without an object body");
  }

  return content.slice(start, end + 1);
}

function assertString(value: unknown, name: string): asserts value is string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Invalid courseware JSON: ${name} is required`);
  }
}

function assertArray(value: unknown, name: string): asserts value is unknown[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Invalid courseware JSON: ${name} must be a non-empty array`);
  }
}

function normalizeText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function splitToTeachingSteps(content: string) {
  return content
    .split(/[。；;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeStringList(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const normalized = value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim());

  return normalized.length > 0 ? normalized : fallback;
}

const visualElementKinds: DynamicVisualElement["kind"][] = [
  "title",
  "text",
  "formula",
  "badge",
  "panel",
  "arrow",
  "highlight",
  "number_line",
  "comparison",
];

const visualElementRoles: NonNullable<DynamicVisualElement["role"]>[] = [
  "primary",
  "secondary",
  "emphasis",
  "success",
  "warning",
  "muted",
];

function normalizeVisualElements(value: unknown): DynamicVisualElement[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const elements = value
    .filter((item) => item && typeof item === "object")
    .map((item): DynamicVisualElement | null => {
      const draft = item as Partial<DynamicVisualElement>;
      const text = normalizeText(draft.text, "");
      if (!text) {
        return null;
      }

      const kind = visualElementKinds.includes(draft.kind as DynamicVisualElement["kind"])
        ? (draft.kind as DynamicVisualElement["kind"])
        : "text";
      const role = visualElementRoles.includes(draft.role as NonNullable<DynamicVisualElement["role"]>)
        ? (draft.role as NonNullable<DynamicVisualElement["role"]>)
        : undefined;

      return {
        kind,
        text,
        ...(role ? { role } : {}),
        ...(typeof draft.group === "string" && draft.group.trim()
          ? { group: draft.group.trim() }
          : {}),
        ...(Array.isArray(draft.items)
          ? { items: normalizeStringList(draft.items, []) }
          : {}),
      };
    })
    .filter((item): item is DynamicVisualElement => Boolean(item));

  return elements.length > 0 ? elements.slice(0, 12) : undefined;
}

function normalizeTargetStoryboardStep(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  const normalized = Math.trunc(value);
  return normalized > 0 ? normalized : undefined;
}

function normalizeInteractiveHtml(value: unknown): CoursewareInteractiveHtml | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const draft = value as Partial<CoursewareInteractiveHtml>;
  const html = normalizeText(draft.html, "");
  if (!html) {
    return undefined;
  }

  return {
    title: normalizeText(draft.title, "AI 互动课件"),
    html,
    ...(typeof draft.instructions === "string" && draft.instructions.trim()
      ? { instructions: draft.instructions.trim() }
      : {}),
  };
}

function buildFallbackStoryboard(
  params: Pick<
    CoursewareJson,
    "knowledge_point_code" | "knowledge_point_name" | "slides" | "examples"
  >
): DynamicStoryboard {
  const exampleSteps = params.examples[0]?.solution_steps ?? [];
  const slideSteps = params.slides.flatMap((slide) => [
    slide.title,
    ...splitToTeachingSteps(slide.content).slice(0, 2),
  ]);
  const sourceSteps = [...exampleSteps, ...slideSteps].filter(Boolean).slice(0, 8);
  const steps = (sourceSteps.length >= 6
    ? sourceSteps
    : [
        `先明确本课研究的是：${params.knowledge_point_name}`,
        "读题或观察材料，圈出已知条件和目标。",
        "把关键条件转化成数学语言或图形信息。",
        "按规则逐步变化，每一步都保留中间结果。",
        "回到目标检查变化是否合理。",
        "用一句话总结本知识点的核心方法。",
      ]
  ).map((item, index) => ({
    step_title: `第 ${index + 1} 步`,
    narration: item,
    visual_state: item,
    formula_or_state: item,
    operation: index === 0 ? "观察并确定目标" : "保留中间过程继续推理",
    operation_reason: "让学生看到完整变化，避免只记结果。",
    emphasis_points: index === 0 ? ["先看清原始条件"] : ["不要跳过中间结果"],
    teacher_prompt: "请学生说出这一步改变了什么，为什么可以这样做。",
    student_check: "能否复述这一步的依据。",
  }));

  return {
    title: `${params.knowledge_point_name}完整演化过程`,
    scene_type: "process",
    learning_objective: `看清 ${params.knowledge_point_name} 的完整过程，不跳步。`,
    knowledge_point_code: params.knowledge_point_code,
    steps,
    summary: `用连续步骤理解 ${params.knowledge_point_name}，每一步都要能说明依据。`,
  };
}

export function normalizeDynamicStoryboards(
  value: unknown,
  params: Pick<
    CoursewareJson,
    "knowledge_point_code" | "knowledge_point_name" | "slides" | "examples"
  >
): DynamicStoryboard[] {
  const storyboards = Array.isArray(value) ? value : [];
  const normalized = storyboards
    .filter((storyboard) => storyboard && typeof storyboard === "object")
    .map((storyboard): DynamicStoryboard | null => {
      const item = storyboard as Partial<DynamicStoryboard>;
      const rawSteps = Array.isArray(item.steps) ? item.steps : [];
      const steps: DynamicStoryboardStep[] = rawSteps
        .filter((step) => step && typeof step === "object")
        .map((step, index) => {
          const draft = step as Partial<DynamicStoryboardStep>;
          const fallback = `第 ${index + 1} 步：保留完整中间过程。`;

          return {
            step_title: normalizeText(draft.step_title, `第 ${index + 1} 步`),
            narration: normalizeText(draft.narration, fallback),
            visual_state: normalizeText(draft.visual_state, normalizeText(draft.narration, fallback)),
            formula_or_state: normalizeText(
              draft.formula_or_state,
              normalizeText(draft.visual_state, fallback)
            ),
            visual_elements: normalizeVisualElements(draft.visual_elements),
            operation: normalizeText(draft.operation, "说明本步变化"),
            operation_reason: normalizeText(draft.operation_reason, "解释为什么可以这样变化。"),
            emphasis_points: normalizeStringList(draft.emphasis_points, [
              "盯住本步变化和依据",
            ]),
            teacher_prompt: normalizeText(
              draft.teacher_prompt,
              "让学生说出这一步的依据和变化结果。"
            ),
            student_check: normalizeText(draft.student_check, "学生能复述本步依据。"),
          };
        });

      if (steps.length < 6) {
        return null;
      }

      const sceneTypes: DynamicStoryboard["scene_type"][] = [
        "derivation",
        "number_line",
        "concept_evolution",
        "process",
        "comparison",
      ];

      return {
        title: normalizeText(item.title, `${params.knowledge_point_name}完整演化过程`),
        scene_type: sceneTypes.includes(item.scene_type as DynamicStoryboard["scene_type"])
          ? (item.scene_type as DynamicStoryboard["scene_type"])
          : "process",
        learning_objective: normalizeText(
          item.learning_objective,
          `看清 ${params.knowledge_point_name} 的完整过程。`
        ),
        knowledge_point_code: params.knowledge_point_code,
        steps,
        summary: normalizeText(
          item.summary,
          `完整复盘 ${params.knowledge_point_name} 的关键变化。`
        ),
      };
    })
    .filter((storyboard): storyboard is DynamicStoryboard => Boolean(storyboard));

  return normalized.length > 0 ? normalized : [buildFallbackStoryboard(params)];
}

function validateCoursewareJson(
  value: unknown,
  params: ReturnType<typeof normalizeParams>
): CoursewareJson {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid courseware JSON: root must be an object");
  }

  const json = value as Partial<CoursewareJson>;
  if (json.version !== "courseware_json_v1") {
    throw new Error("Invalid courseware JSON: version mismatch");
  }

  if (json.knowledge_point_code !== params.knowledge_point_code) {
    throw new Error("Invalid courseware JSON: knowledge_point_code mismatch");
  }

  if (json.knowledge_point_name !== params.knowledge_point_name) {
    throw new Error("Invalid courseware JSON: knowledge_point_name mismatch");
  }

  assertString(json.subject, "subject");
  assertString(json.grade, "grade");
  assertString(json.semester, "semester");
  assertString(json.chapter, "chapter");
  assertArray(json.learning_goals, "learning_goals");
  assertArray(json.slides, "slides");
  assertArray(json.practice_items, "practice_items");
  assertArray(json.summary_points, "summary_points");
  assertArray(json.review_plan, "review_plan");

  if (json.slides.length < 6) {
    throw new Error("Invalid courseware JSON: slides must contain at least 6 items");
  }

  if (json.practice_items.length < 3) {
    throw new Error("Invalid courseware JSON: practice_items must contain at least 3 items");
  }

  const interactiveHtml = normalizeInteractiveHtml(json.interactive_html);

  for (const [index, item] of json.practice_items.entries()) {
    if (!item || typeof item !== "object") {
      throw new Error(`Invalid courseware JSON: practice_items[${index}] must be an object`);
    }
    const practice = item as Partial<CoursewareJson["practice_items"][number]>;
    if (practice.knowledge_point_code !== params.knowledge_point_code) {
      throw new Error(
        `Invalid courseware JSON: practice_items[${index}].knowledge_point_code mismatch`
      );
    }
    if (!["基础", "易错纠正", "拓展挑战"].includes(practice.difficulty ?? "")) {
      throw new Error(`Invalid courseware JSON: practice_items[${index}].difficulty invalid`);
    }

    practice.target_storyboard_step = normalizeTargetStoryboardStep(
      practice.target_storyboard_step
    );
  }

  return {
    ...(json as CoursewareJson),
    ...(interactiveHtml ? { interactive_html: interactiveHtml } : {}),
    dynamic_storyboards: normalizeDynamicStoryboards(json.dynamic_storyboards, {
      knowledge_point_code: params.knowledge_point_code,
      knowledge_point_name: params.knowledge_point_name,
      slides: json.slides as CoursewareJson["slides"],
      examples: Array.isArray(json.examples) ? (json.examples as CoursewareJson["examples"]) : [],
    }),
  };
}

export async function generateCoursewareJson(
  params: GenerateCoursewareJsonParams
): Promise<CoursewareJson> {
  const normalized = normalizeParams(params);

  for (const [key, value] of Object.entries(normalized)) {
    if (!value) {
      throw new Error(`${key} is required`);
    }
  }

  const promptTemplate = await getPromptTemplate();
  const userPrompt = replaceAll(promptTemplate, normalized);
  const client = await getAIClient();
  const model = getAIModel("courseware-json");

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    ...(shouldUseAIJsonResponseFormat()
      ? { response_format: { type: "json_object" as const } }
      : {}),
    temperature: 0.2,
  });

  const content = response.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("AI model returned an empty courseware JSON");
  }

  const parsed = JSON.parse(extractJson(content));
  return validateCoursewareJson(parsed, normalized);
}
