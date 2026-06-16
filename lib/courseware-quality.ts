export type CoursewareQualitySeverity = "required" | "recommended";

export type CoursewareQualityCheck = {
  id: string;
  label: string;
  passed: boolean;
  severity: CoursewareQualitySeverity;
  detail: string;
};

export type CoursewareQualityReport = {
  version: "courseware_quality_v1";
  score: number;
  passedRequired: boolean;
  checks: CoursewareQualityCheck[];
  generatedAt: string;
};

type CoursewareQualityLike = {
  knowledge_point_code: string;
  learning_goals?: unknown[];
  prerequisite_knowledge?: unknown[];
  slides?: Array<{
    title?: string;
    content?: string;
    knowledge_point_code?: string;
  }>;
  examples?: Array<{
    question?: string;
    solution_steps?: unknown[];
    answer?: string;
    knowledge_point_code?: string;
  }>;
  common_mistakes?: Array<{
    mistake?: string;
    reason?: string;
    correction?: string;
    knowledge_point_code?: string;
  }>;
  practice_items?: Array<{
    question?: string;
    difficulty?: string;
    answer?: string;
    explanation?: string;
    knowledge_point_code?: string;
    target_storyboard_step?: number;
  }>;
  review_plan?: unknown[];
  dynamic_storyboards?: Array<{
    steps?: Array<{
      step_title?: string;
      narration?: string;
      visual_state?: string;
      formula_or_state?: string;
      operation?: string;
      operation_reason?: string;
      emphasis_points?: unknown[];
      student_check?: string;
    }>;
  }>;
  interactive_html?: {
    html?: string;
  };
};

const genericPhrases = [
  "第 1 步",
  "第 2 步",
  "第 3 步",
  "按顺序完成本步变形",
  "完成本步操作",
  "把本知识点讲清楚",
  "这里必须是模型根据知识点设计",
  "AI 画面",
  "focus",
  "header",
  "numbers",
];

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function addCheck(
  checks: CoursewareQualityCheck[],
  id: string,
  label: string,
  passed: boolean,
  severity: CoursewareQualitySeverity,
  detail: string
) {
  checks.push({ id, label, passed, severity, detail });
}

function countSlides(html: string) {
  return (html.match(/<section\b[^>]*class=["'][^"']*\bslide\b/gi) ?? []).length;
}

function countUniqueSlideLayouts(html: string) {
  const matches = [...html.matchAll(/<section\b[^>]*class=["'][^"']*\bslide\b[^"']*["'][^>]*>/gi)];
  const layouts = new Set<string>();

  for (const match of matches) {
    const tag = match[0];
    const dataLayout = tag.match(/\bdata-layout=["']([^"']+)["']/i)?.[1];
    if (dataLayout) {
      layouts.add(dataLayout);
      continue;
    }

    const className = tag.match(/\bclass=["']([^"']+)["']/i)?.[1] ?? "";
    for (const item of className.split(/\s+/)) {
      if (item.startsWith("layout-") || item.endsWith("-slide")) {
        layouts.add(item);
      }
    }
  }

  return layouts.size;
}

export function getCoursewareQualityIssues(report: CoursewareQualityReport) {
  return report.checks.filter((check) => !check.passed);
}

export function formatCoursewareQualityFeedback(report: CoursewareQualityReport) {
  const issues = getCoursewareQualityIssues(report);

  if (issues.length === 0) {
    return "";
  }

  return issues
    .map((issue) => {
      const level = issue.severity === "required" ? "必须修正" : "建议优化";
      return `- ${level}：${issue.label}。${issue.detail}`;
    })
    .join("\n");
}

export function assessCoursewareQuality(
  courseware: CoursewareQualityLike,
  now: string = new Date().toISOString()
): CoursewareQualityReport {
  const checks: CoursewareQualityCheck[] = [];
  const code = courseware.knowledge_point_code;
  const slides = courseware.slides ?? [];
  const examples = courseware.examples ?? [];
  const mistakes = courseware.common_mistakes ?? [];
  const practiceItems = courseware.practice_items ?? [];
  const storyboards = courseware.dynamic_storyboards ?? [];
  const storyboardSteps = storyboards.flatMap((storyboard) => storyboard.steps ?? []);
  const html = text(courseware.interactive_html?.html);
  const allText = [
    ...slides.flatMap((slide) => [slide.title, slide.content]),
    ...examples.flatMap((example) => [
      example.question,
      ...(example.solution_steps ?? []),
      example.answer,
    ]),
    ...practiceItems.flatMap((item) => [item.question, item.answer, item.explanation]),
    ...storyboardSteps.flatMap((step) => [
      step.step_title,
      step.narration,
      step.visual_state,
      step.formula_or_state,
      step.operation,
      step.operation_reason,
      ...(step.emphasis_points ?? []),
      step.student_check,
    ]),
  ]
    .map(text)
    .filter(Boolean)
    .join("\n");

  addCheck(
    checks,
    "knowledge-trace",
    "知识点主线清晰",
    slides.length > 0 &&
      practiceItems.length > 0 &&
      slides.every((slide) => slide.knowledge_point_code === code) &&
      practiceItems.every((item) => item.knowledge_point_code === code),
    "required",
    "每页课件和每道练习都必须绑定同一个 knowledge_point_code，方便学生复习和后续学情分析。"
  );

  addCheck(
    checks,
    "prerequisite",
    "前置知识完整",
    (courseware.prerequisite_knowledge?.length ?? 0) >= 2,
    "required",
    "至少需要 2 条前置知识，让老师知道学生听不懂时要先补哪里。"
  );

  addCheck(
    checks,
    "learning-goals",
    "学习目标可检查",
    (courseware.learning_goals?.length ?? 0) >= 3,
    "recommended",
    "建议提供 3 条可观察、可检查的学习目标。"
  );

  addCheck(
    checks,
    "complete-example",
    "典型例题过程完整",
    examples.some((example) => (example.solution_steps?.length ?? 0) >= 4 && text(example.answer)),
    "required",
    "至少 1 道例题要有 4 步以上解题过程和明确答案，不能只给结论。"
  );

  addCheck(
    checks,
    "step-reasoning",
    "关键步骤说明依据",
    /(为什么|依据|因为|所以|等式|两边|变号|检验|方向|距离)/.test(allText),
    "required",
    "讲解中要说明每一步为什么成立，尤其数学推导不能只展示变化结果。"
  );

  addCheck(
    checks,
    "mistakes",
    "易错点可纠正",
    mistakes.length >= 3 &&
      mistakes.every((item) => text(item.mistake) && text(item.reason) && text(item.correction)),
    "required",
    "至少 3 个易错点，并写清错在哪里、为什么错、怎么改。"
  );

  addCheck(
    checks,
    "practice-layering",
    "练习分层且有解析",
    ["基础", "易错纠正", "拓展挑战"].every((difficulty) =>
      practiceItems.some(
        (item) =>
          item.difficulty === difficulty &&
          text(item.question) &&
          text(item.answer) &&
          text(item.explanation)
      )
    ),
    "required",
    "必须包含基础、易错纠正、拓展挑战 3 类题，并提供答案和解析。"
  );

  addCheck(
    checks,
    "practice-replay",
    "错题可回到讲解步骤",
    practiceItems.length > 0 &&
      practiceItems.every(
        (item) => typeof item.target_storyboard_step === "number" && item.target_storyboard_step > 0
      ),
    "recommended",
    "每道题最好指向一个动态讲解步骤，学生做错后能回看对应知识点。"
  );

  addCheck(
    checks,
    "storyboard-complete",
    "动态分镜保留完整过程",
    storyboardSteps.length >= 8 &&
      storyboardSteps.every(
        (step) =>
          text(step.step_title) &&
          text(step.narration) &&
          text(step.visual_state) &&
          text(step.operation_reason) &&
          (step.emphasis_points?.length ?? 0) > 0
      ),
    "required",
    "动态课件需要 8 步以上，并且每步包含画面、讲解、依据和重点提示。"
  );

  addCheck(
    checks,
    "html-projection",
    "投屏课件无滚动",
    Boolean(html) &&
      countSlides(html) >= 6 &&
      /\.deck\s*{[\s\S]*?width\s*:\s*100vw[\s\S]*?height\s*:\s*100vh/i.test(html) &&
      /\.slide\s*{[\s\S]*?width\s*:\s*100%[\s\S]*?height\s*:\s*100%/i.test(html) &&
      /body\s*{[\s\S]*?overflow\s*:\s*hidden/i.test(html) &&
      !/(overflow|overflow-y)\s*:\s*(auto|scroll)/i.test(html),
    "required",
    "HTML 必须是 16:9 幻灯片舞台，不能依赖页面或内部滚动。"
  );

  addCheck(
    checks,
    "html-rich-layout",
    "幻灯片版式有变化",
    Boolean(html) && countUniqueSlideLayouts(html) >= 3,
    "recommended",
    "建议每套课件至少标记 3 种页面版式，避免整套课件都像同一张模板。"
  );

  addCheck(
    checks,
    "student-friendly",
    "慢学生也能跟上",
    /(注意|别漏|易错|重点|高亮|标红|检查|回看|再看一遍)/.test(allText + html),
    "required",
    "关键变化、易错点和检查问题必须显性提示，帮助反应慢的学生补上过程。"
  );

  addCheck(
    checks,
    "not-ai-template",
    "避免 AI 模板痕迹",
    !genericPhrases.some((phrase) => allText.includes(phrase) || html.includes(phrase)),
    "recommended",
    "不要出现技术标签、模板占位句或空泛步骤标题。"
  );

  addCheck(
    checks,
    "review-reuse",
    "学生复习可复用",
    (courseware.review_plan?.length ?? 0) >= 2 && practiceItems.length >= 3,
    "required",
    "需要有当天和一周后复习任务，并配套基础练习，学生端才能形成复习闭环。"
  );

  const passedCount = checks.filter((check) => check.passed).length;
  const passedRequired = checks.every(
    (check) => check.severity !== "required" || check.passed
  );

  return {
    version: "courseware_quality_v1",
    score: Math.round((passedCount / checks.length) * 100),
    passedRequired,
    checks,
    generatedAt: now,
  };
}
