import type {
  CoursewareJson,
  DynamicStoryboard,
  DynamicStoryboardStep,
} from "@/lib/courseware-types";

export type TeachingPanel = {
  title: string;
  body: string;
  emphasis: string[];
};

export type PracticeReplaySuggestion = {
  stepIndex: number;
  stepTitle: string;
  reason: string;
};

const teachingKeywords = [
  "同类项",
  "含 x",
  "常数项",
  "移项",
  "变号",
  "合并",
  "系数",
  "除以",
  "去分母",
  "去括号",
  "等式",
  "相反数",
  "数轴",
  "距离",
  "检查",
];

const builtInStoryboardsByCode: Record<string, DynamicStoryboard> = {
  "J-MATH-RJ-71-05-03": {
    title: "一元一次方程完整演化",
    scene_type: "derivation",
    learning_objective: "看清一元一次方程从观察、分类、变形到检查的完整过程",
    knowledge_point_code: "J-MATH-RJ-71-05-03",
    summary: "解方程不是直接移项，要先看清项的类型，再保证等式两边始终做相同或等价的变形。",
    steps: [
      {
        step_title: "完整读题",
        narration: "先把方程完整读一遍：左边是 4x - 3，右边是 2x + 5。暂时不移动任何项。",
        visual_state: "4x - 3 = 2x + 5",
        formula_or_state: "4x - 3 = 2x + 5",
        operation: "先观察原方程",
        operation_reason: "没有看清原方程就移动，最容易漏掉符号或漏掉某一项。",
        emphasis_points: ["先不移项", "每一项都带着前面的符号看"],
        teacher_prompt: "左边有哪些项？右边有哪些项？每一项前面的符号是什么？",
        student_check: "我能完整说出左边是 4x 和 -3，右边是 2x 和 +5。",
      },
      {
        step_title: "找同类项",
        narration: "把所有项分成两类：含 x 的项是 4x、2x；不含 x 的常数项是 -3、+5。",
        visual_state: "4x - 3 = 2x + 5",
        formula_or_state: "含 x 项：4x、2x；常数项：-3、+5",
        operation: "先分类，再变形",
        operation_reason: "同类项才能合并。先分类，后面才知道谁和谁能合并。",
        emphasis_points: ["4x 和 2x 是同类项", "-3 和 +5 是常数项"],
        teacher_prompt: "为什么 4x 可以和 2x 合并，但不能和 5 合并？",
        student_check: "我能区分含 x 的项和常数项。",
      },
      {
        step_title: "确定整理目标",
        narration: "目标是把含 x 的项集中到等号左边，把常数项集中到等号右边。",
        visual_state: "4x - 3 = 2x + 5",
        formula_or_state: "含 x 项放左边，常数项放右边",
        operation: "确定每类项的去向",
        operation_reason: "先定目标，后操作，能减少随意移项造成的错误。",
        emphasis_points: ["含 x 项归一边", "常数项归另一边"],
        teacher_prompt: "我们为什么不先算 -3 + 5？它们现在在等号两边，不能直接合并。",
        student_check: "我知道本题接下来要把 2x 移到左边，把 -3 移到右边。",
      },
      {
        step_title: "两边同减 2x",
        narration: "为了让右边不再有含 x 项，在等式两边同时减去 2x。",
        visual_state: "4x - 3 - 2x = 2x + 5 - 2x",
        formula_or_state: "4x - 3 - 2x = 2x + 5 - 2x",
        operation: "两边同时减去 2x",
        operation_reason: "等式两边做相同运算，等式仍成立。",
        emphasis_points: ["左右两边都要减 2x", "2x - 2x = 0"],
        teacher_prompt: "如果只在右边减 2x，等式还成立吗？为什么？",
        student_check: "我能说清这是等式性质，不是随便把 2x 拿走。",
      },
      {
        step_title: "合并含 x 项",
        narration: "左边的 4x 和 -2x 是同类项，可以合并成 2x；右边的 2x - 2x 抵消为 0。",
        visual_state: "2x - 3 = 5",
        formula_or_state: "2x - 3 = 5",
        operation: "合并同类项",
        operation_reason: "4x - 2x = 2x，右边只剩常数 5。",
        emphasis_points: ["4x - 2x = 2x", "右边的 2x 被消去"],
        teacher_prompt: "这一步不是把 2x 直接扔掉，而是两边同减后抵消。",
        student_check: "我能解释为什么右边只剩 5。",
      },
      {
        step_title: "两边同加 3",
        narration: "为了让左边只剩含 x 项，在等式两边同时加 3。",
        visual_state: "2x - 3 + 3 = 5 + 3",
        formula_or_state: "2x - 3 + 3 = 5 + 3",
        operation: "两边同时加 3",
        operation_reason: "等式两边做相同运算，等式仍成立。",
        emphasis_points: ["左右两边都要加 3", "-3 + 3 = 0"],
        teacher_prompt: "为什么加的是 3，而不是减 3？",
        student_check: "我能说出加 3 是为了抵消 -3。",
      },
      {
        step_title: "合并常数项",
        narration: "左边 -3 和 +3 抵消，右边 5 + 3 合并成 8。",
        visual_state: "2x = 8",
        formula_or_state: "2x = 8",
        operation: "合并常数项",
        operation_reason: "左边只保留含 x 的项。",
        emphasis_points: ["-3 + 3 = 0", "5 + 3 = 8"],
        teacher_prompt: "现在方程比原来简单在哪里？",
        student_check: "我能看出左边只剩 2x，右边是 8。",
      },
      {
        step_title: "系数化为 1",
        narration: "2x 表示 2 个 x。为了得到 1 个 x，等式两边同时除以 2。",
        visual_state: "2x ÷ 2 = 8 ÷ 2",
        formula_or_state: "2x ÷ 2 = 8 ÷ 2",
        operation: "两边同时除以 2",
        operation_reason: "等式两边同除以非零数，等式仍成立。",
        emphasis_points: ["除以 x 的系数 2", "两边都要除以 2"],
        teacher_prompt: "为什么不能只把左边的 2 去掉？右边也要发生什么变化？",
        student_check: "我能说清 2x 变成 x 的依据。",
      },
      {
        step_title: "得到解",
        narration: "左边 2x ÷ 2 得到 x，右边 8 ÷ 2 得到 4，所以 x = 4。",
        visual_state: "x = 4",
        formula_or_state: "x = 4",
        operation: "完成计算",
        operation_reason: "系数化为 1 后，未知数的值就直接出现。",
        emphasis_points: ["2x ÷ 2 = x", "8 ÷ 2 = 4"],
        teacher_prompt: "现在得到的是解，但还需要检查吗？",
        student_check: "我知道 x = 4 是本方程的候选解。",
      },
      {
        step_title: "代回检查",
        narration: "把 x = 4 代回原方程：左边 4×4 - 3 = 13，右边 2×4 + 5 = 13，左右相等。",
        visual_state: "左边 = 13，右边 = 13",
        formula_or_state: "4×4 - 3 = 2×4 + 5",
        operation: "代回原方程检查",
        operation_reason: "检查能发现移项、合并或计算错误，确认结果是真正的解。",
        emphasis_points: ["必须代回原方程", "左右相等才正确"],
        teacher_prompt: "如果代回后左右不相等，说明哪一步可能出错？",
        student_check: "我能用代回检查说明 x = 4 正确。",
      },
    ],
  },
  "J-MATH-RJ-71-01-03": {
    title: "数轴完整演化",
    scene_type: "number_line",
    learning_objective: "看清数轴如何用原点、正方向和单位长度表示数",
    knowledge_point_code: "J-MATH-RJ-71-01-03",
    summary: "数轴不是一条普通直线，必须同时具备原点、正方向和单位长度。",
    steps: [
      {
        step_title: "认识数轴三要素",
        narration: "先完整观察数轴需要什么：原点、正方向、单位长度，三者缺一不可。",
        visual_state: "一条水平直线，暂时没有标 0、箭头和刻度。",
        formula_or_state: "数轴三要素：原点、正方向、单位长度",
        operation: "先列出数轴必须具备的三个条件",
        operation_reason: "只有三个条件都确定，直线上的点才能和数一一对应。",
        emphasis_points: ["原点", "正方向", "单位长度"],
        teacher_prompt: "如果只画一条直线，它是不是数轴？还缺什么？",
        student_check: "我能说出数轴必须有原点、正方向和单位长度。",
      },
      {
        step_title: "确定原点",
        narration: "在直线上选定一个点表示 0，这个点叫原点。所有数的位置都要以 0 为参照。",
        visual_state: "直线中间标出 0。",
        formula_or_state: "0 是原点",
        operation: "在直线上标出 0",
        operation_reason: "没有原点，就无法判断一个数在左边还是右边，也无法比较距离。",
        emphasis_points: ["0 是参照点", "所有位置从原点出发判断"],
        teacher_prompt: "为什么不能随便从任意位置开始标 1？",
        student_check: "我能指出原点，并知道它表示 0。",
      },
      {
        step_title: "确定正方向",
        narration: "通常规定向右为正方向。正数在原点右边，负数在原点左边。",
        visual_state: "从 0 向右画箭头，标出正方向。",
        formula_or_state: "向右为正，向左为负",
        operation: "给直线加上正方向箭头",
        operation_reason: "正方向确定后，数的正负位置才不会混乱。",
        emphasis_points: ["右边是正数", "左边是负数"],
        teacher_prompt: "如果正方向反过来，正数会在哪一边？",
        student_check: "我能根据箭头判断正数和负数的位置。",
      },
      {
        step_title: "确定单位长度",
        narration: "从 0 到 1 的距离作为 1 个单位长度，后面的刻度要保持一样长。",
        visual_state: "0、1、2、3 等刻度间隔相等；-1、-2、-3 在左侧等距排列。",
        formula_or_state: "相邻整数刻度间隔相等",
        operation: "按相同间隔标出整数刻度",
        operation_reason: "单位长度不统一，点的位置就不能准确表示数。",
        emphasis_points: ["每格长度相等", "0 到 1 是一个单位"],
        teacher_prompt: "如果 0 到 1 和 1 到 2 的距离不一样，会发生什么？",
        student_check: "我能检查数轴上的刻度是否等距。",
      },
      {
        step_title: "在数轴上表示正数",
        narration: "要表示 2，从原点 0 出发，沿正方向走 2 个单位，到达的点就是 2。",
        visual_state: "2 在原点右侧两个单位处。",
        formula_or_state: "0 -> 1 -> 2",
        operation: "从 0 向右数两个单位",
        operation_reason: "正数的位置由正方向和单位长度共同决定。",
        emphasis_points: ["从 0 出发", "向右走 2 个单位"],
        teacher_prompt: "表示 3 时要从哪里出发，走几个单位？",
        student_check: "我能在数轴上准确标出正数 2。",
      },
      {
        step_title: "在数轴上表示负数",
        narration: "要表示 -2，从原点 0 出发，沿正方向的反方向走 2 个单位。",
        visual_state: "-2 在原点左侧两个单位处。",
        formula_or_state: "0 -> -1 -> -2",
        operation: "从 0 向左数两个单位",
        operation_reason: "负数表示在原点左侧，距离仍按单位长度计算。",
        emphasis_points: ["负数在左边", "距离仍然数单位长度"],
        teacher_prompt: "-3 和 -1 谁离原点更远？为什么？",
        student_check: "我能在数轴上准确标出负数 -2。",
      },
      {
        step_title: "理解相反数",
        narration: "2 和 -2 分别在原点两侧，离原点的距离都是 2，所以它们互为相反数。",
        visual_state: "-2 和 2 关于原点左右对称。",
        formula_or_state: "2 与 -2 到原点的距离相等",
        operation: "比较两个点到原点的距离",
        operation_reason: "相反数的特点是符号相反，并且到原点的距离相等。",
        emphasis_points: ["符号相反", "到原点距离相等"],
        teacher_prompt: "5 的相反数在哪里？它到原点的距离是多少？",
        student_check: "我能用数轴解释一个数和它的相反数。",
      },
      {
        step_title: "用数轴比较大小",
        narration: "在数轴上，右边的数总比左边的数大。比较 -2、0、2 时，顺序是 -2 < 0 < 2。",
        visual_state: "从左到右依次显示 -2、0、2。",
        formula_or_state: "-2 < 0 < 2",
        operation: "按从左到右的位置比较大小",
        operation_reason: "数轴把数的大小关系转化成位置关系，越往右数越大。",
        emphasis_points: ["右边的数更大", "负数小于 0"],
        teacher_prompt: "-3 和 -1 哪个大？看数轴怎么判断？",
        student_check: "我能用数轴比较两个有理数的大小。",
      },
    ],
  },
};

export function getBuiltInDynamicStoryboard(knowledgePointCode: string) {
  return builtInStoryboardsByCode[knowledgePointCode];
}

function stepState(step: DynamicStoryboardStep | null | undefined) {
  return step?.formula_or_state || step?.visual_state || step?.narration || "";
}

function cleanList(value: string[] | undefined) {
  return (value ?? []).map((item) => item.trim()).filter(Boolean);
}

export function getInitialPlaybackStepIndex(
  requestedStepIndex: number | null | undefined,
  stepCount: number
) {
  if (
    typeof requestedStepIndex !== "number" ||
    !Number.isFinite(requestedStepIndex) ||
    stepCount <= 0
  ) {
    return 0;
  }

  return Math.min(stepCount - 1, Math.max(0, Math.trunc(requestedStepIndex)));
}

export function getDynamicReplayTargetId(coursewareId: string) {
  const normalized = coursewareId
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `dynamic-courseware-${normalized || "current"}`;
}

export function buildTeachingPanels({
  previousStep,
  currentStep,
}: {
  previousStep?: DynamicStoryboardStep | null;
  currentStep: DynamicStoryboardStep;
}): TeachingPanel[] {
  const currentState = stepState(currentStep);
  const previousState = stepState(previousStep);
  const panels: TeachingPanel[] = [];

  if (previousState && previousState !== currentState) {
    panels.push({
      title: "上一画面",
      body: previousState,
      emphasis: [],
    });
  }

  panels.push(
    {
      title: "当前画面",
      body: currentState,
      emphasis: cleanList(currentStep.emphasis_points),
    },
    {
      title: "本步操作",
      body: currentStep.operation || currentStep.narration,
      emphasis: cleanList(currentStep.emphasis_points),
    },
    {
      title: "为什么可以这样做",
      body: currentStep.operation_reason || "这一步必须能说清依据，不能只记结果。",
      emphasis: [],
    },
    {
      title: "学生自查",
      body:
        currentStep.student_check ||
        currentStep.teacher_prompt ||
        "我能说出这一步做了什么，以及为什么成立。",
      emphasis: [],
    }
  );

  return panels;
}

function searchableText(parts: Array<string | string[] | null | undefined>) {
  return parts.flatMap((part) => (Array.isArray(part) ? part : [part])).join(" ");
}

function extractTeachingKeywords(text: string) {
  const compact = text.replace(/\s+/g, "");
  const keywords = teachingKeywords.filter((keyword) => compact.includes(keyword));
  const formulas = compact.match(/[a-zA-Z]\s*[=+\-×÷*/]|\d+\s*[a-zA-Z]|[a-zA-Z]\s*=/g) ?? [];

  return Array.from(new Set([...keywords, ...formulas]));
}

export function buildPracticeReplaySuggestion({
  knowledgePointCode,
  practiceItem,
  storyboards,
}: {
  knowledgePointCode: string;
  practiceItem: CoursewareJson["practice_items"][number];
  storyboards: DynamicStoryboard[] | undefined;
}): PracticeReplaySuggestion | null {
  const storyboard =
    storyboards?.find(
      (item) => item.knowledge_point_code === knowledgePointCode && item.steps.length > 0
    ) ??
    builtInStoryboardsByCode[knowledgePointCode] ??
    storyboards?.find((item) => item.steps.length > 0);

  if (!storyboard) {
    return null;
  }

  if (
    typeof practiceItem.target_storyboard_step === "number" &&
    Number.isFinite(practiceItem.target_storyboard_step)
  ) {
    const stepIndex = getInitialPlaybackStepIndex(
      practiceItem.target_storyboard_step - 1,
      storyboard.steps.length
    );
    const targetStep = storyboard.steps[stepIndex];

    return {
      stepIndex,
      stepTitle: targetStep.step_title,
      reason: "课件已标注这道题对应的动态讲解步骤，建议先回看这一段再订正。",
    };
  }

  const practiceText = searchableText([
    practiceItem.question,
    practiceItem.answer,
    practiceItem.explanation,
    practiceItem.difficulty,
  ]);
  const practiceKeywords = extractTeachingKeywords(practiceText);

  let best:
    | {
        score: number;
        stepIndex: number;
        step: DynamicStoryboardStep;
        matchedKeywords: string[];
      }
    | null = null;

  for (const [stepIndex, step] of storyboard.steps.entries()) {
    const stepText = searchableText([
      step.step_title,
      step.narration,
      step.visual_state,
      step.formula_or_state,
      step.operation,
      step.operation_reason,
      step.emphasis_points,
      step.student_check,
    ]);
    const matchedKeywords = practiceKeywords.filter((keyword) =>
      stepText.replace(/\s+/g, "").includes(keyword)
    );
    const titleHit = practiceText.includes(step.step_title) ? 2 : 0;
    const score = matchedKeywords.length + titleHit;

    if (score > 0 && (!best || score > best.score)) {
      best = { score, stepIndex, step, matchedKeywords };
    }
  }

  if (!best) {
    const firstStep = storyboard.steps[0];
    return {
      stepIndex: 0,
      stepTitle: firstStep.step_title,
      reason: "先从动态演示第一步重新看，确认题目条件和知识点对象。",
    };
  }

  return {
    stepIndex: best.stepIndex,
    stepTitle: best.step.step_title,
    reason:
      best.matchedKeywords.length > 0
        ? `这道题和“${best.matchedKeywords.slice(0, 3).join("、")}”有关，建议先回看这一段。`
        : "这一步和本题的解法最接近，建议先回看再订正。",
  };
}
