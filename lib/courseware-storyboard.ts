import type {
  CoursewareJson,
  DynamicStoryboard,
  DynamicStoryboardStep,
  DynamicVisualElement,
} from "@/lib/courseware-types";

function normalizeText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function isGenericStepTitle(value: string) {
  return /^第\s*\d+\s*步$/.test(value.trim());
}

function isGenericOperation(value: string) {
  return ["完成本步操作", "按顺序完成本步变形", "保留中间过程继续推理"].includes(
    value.trim()
  );
}

function deriveStepTitle(
  draft: Partial<DynamicStoryboardStep>,
  index: number,
  knowledgePointName: string
) {
  const stepTitle = normalizeText(draft.step_title, "");
  if (stepTitle && !isGenericStepTitle(stepTitle)) {
    return stepTitle;
  }

  const operation = normalizeText(draft.operation, "");
  if (operation && !isGenericOperation(operation)) {
    return operation;
  }

  return normalizeText(
    draft.formula_or_state,
    normalizeText(
      draft.visual_state,
      normalizeText(draft.narration, `第 ${index + 1} 步：继续完成 ${knowledgePointName} 的推导。`)
    )
  );
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

  const normalized = value
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

  return normalized.length > 0 ? normalized.slice(0, 12) : undefined;
}

function splitToTeachingSteps(content: string) {
  return content
    .split(/[；。;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
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
  const fallbackSteps = [
    `先观察本节知识点：${params.knowledge_point_name}`,
    "把题目或概念中的已知条件逐条圈出来。",
    "找到本步骤真正要处理的对象，不跳过中间过程。",
    "每做一次变形，都说明为什么可以这样做。",
    "检查结果是否仍然符合原来的条件。",
    "用一句话总结这一类问题的基本方法。",
  ];

  const steps = (sourceSteps.length >= 6 ? sourceSteps : fallbackSteps).map(
    (item, index) => ({
      step_title: `第 ${index + 1} 步`,
      narration: item,
      visual_state: item,
      formula_or_state: item,
      operation: index === 0 ? "观察题目或概念" : "按顺序完成本步变形",
      operation_reason: "让学生看清每一步为什么成立，避免跳步。",
      emphasis_points: index === 0 ? ["先看清对象"] : ["不能跳过中间过程"],
      teacher_prompt: "请学生复述这一步处理了什么，以及为什么能这样处理。",
      student_check: "我能说出这一步做了什么，也能说明原因。",
    })
  );

  return {
    title: `${params.knowledge_point_name}完整演化过程`,
    scene_type: "process",
    learning_objective: `看清 ${params.knowledge_point_name} 的完整推导过程`,
    knowledge_point_code: params.knowledge_point_code,
    steps,
    summary: `按顺序理解 ${params.knowledge_point_name}，每一步都要能说明理由。`,
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
          const fallback = `第 ${index + 1} 步：继续完成 ${params.knowledge_point_name} 的推导。`;

          return {
            step_title: deriveStepTitle(draft, index, params.knowledge_point_name),
            narration: normalizeText(draft.narration, fallback),
            visual_state: normalizeText(
              draft.visual_state,
              normalizeText(draft.narration, fallback)
            ),
            formula_or_state: normalizeText(
              draft.formula_or_state,
              normalizeText(draft.visual_state, fallback)
            ),
            visual_elements: normalizeVisualElements(draft.visual_elements),
            operation: normalizeText(draft.operation, "完成本步操作"),
            operation_reason: normalizeText(
              draft.operation_reason,
              "帮助学生理解本步骤的依据。"
            ),
            emphasis_points: normalizeStringList(draft.emphasis_points, [
              "注意这一步的依据",
            ]),
            teacher_prompt: normalizeText(
              draft.teacher_prompt,
              "请学生说出这一步为什么成立。"
            ),
            student_check: normalizeText(
              draft.student_check,
              "我能说出这一步的操作和原因。"
            ),
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
          `看清 ${params.knowledge_point_name} 的完整过程`
        ),
        knowledge_point_code: params.knowledge_point_code,
        steps,
        summary: normalizeText(
          item.summary,
          `总结 ${params.knowledge_point_name} 的关键步骤。`
        ),
      };
    })
    .filter((storyboard): storyboard is DynamicStoryboard => Boolean(storyboard));

  return normalized.length > 0 ? normalized : [buildFallbackStoryboard(params)];
}

export function normalizeCoursewareStoryboardsForDisplay(courseware: CoursewareJson): CoursewareJson {
  return {
    ...courseware,
    dynamic_storyboards: normalizeDynamicStoryboards(courseware.dynamic_storyboards, {
      knowledge_point_code: courseware.knowledge_point_code,
      knowledge_point_name: courseware.knowledge_point_name,
      slides: courseware.slides,
      examples: courseware.examples,
    }),
  };
}
