import { readFile } from "fs/promises";
import path from "path";
import {
  getAIClient,
  getAIModel,
  shouldUseAIJsonResponseFormat,
} from "@/lib/ai";
import { assessCoursewareQuality, formatCoursewareQualityFeedback } from "@/lib/courseware-quality";
import type { CoursewareJson, CoursewareInteractiveHtml } from "@/lib/courseware-json";
import type { GenerateCoursewareParams } from "@/lib/courseware";

type GenerateCoursewareHtmlParams = GenerateCoursewareParams & {
  content_markdown: string;
  structured_courseware: CoursewareJson;
};

const SYSTEM_PROMPT =
  "你是一名优秀的一线数学教师、PPT课件设计师和课堂互动设计师。只输出可以 JSON.parse 的 JSON 对象，不要输出 Markdown 代码围栏或解释。";

let cachedPromptTemplate: string | null = null;

async function getPromptTemplate() {
  if (cachedPromptTemplate) {
    return cachedPromptTemplate;
  }

  cachedPromptTemplate = await readFile(
    path.join(process.cwd(), "prompts", "courseware-html.md"),
    "utf8"
  );
  return cachedPromptTemplate;
}

function normalizeText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
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

function normalizeInteractiveHtml(value: unknown): CoursewareInteractiveHtml {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid courseware HTML: root must be an object");
  }

  const draft = value as Partial<CoursewareInteractiveHtml>;
  const html = normalizeText(draft.html, "");

  if (!html || !/<!doctype html>/i.test(html) || !/<html[\s>]/i.test(html)) {
    throw new Error("Invalid courseware HTML: complete HTML document is required");
  }

  return {
    title: normalizeText(draft.title, "课堂互动课件"),
    instructions: normalizeText(
      draft.instructions,
      "老师可按页面节奏投屏讲解，并根据课堂反馈暂停提问。"
    ),
    html,
  };
}

function assessInteractiveHtml(html: string, structuredCourseware: CoursewareJson) {
  const issues: string[] = [];
  const slideCount = (html.match(/<section\b[^>]*class=["'][^"']*\bslide\b/gi) ?? []).length;
  const layoutCount = new Set(
    [...html.matchAll(/\bdata-layout=["']([^"']+)["']/gi)].map((match) => match[1])
  ).size;

  if (slideCount < 6) {
    issues.push("幻灯片页数不足，至少需要 6 页，避免把内容挤在少数页面里。");
  }

  if (!/\.deck\s*{[\s\S]*?width\s*:\s*100vw[\s\S]*?height\s*:\s*100vh/i.test(html)) {
    issues.push("缺少固定 16:9 投屏舞台：.deck 必须使用 width:100vw 和 height:100vh。");
  }

  if (!/\.slide\s*{[\s\S]*?width\s*:\s*100%[\s\S]*?height\s*:\s*100%/i.test(html)) {
    issues.push("缺少单页幻灯片舞台：.slide 必须使用 width:100% 和 height:100%。");
  }

  if (!/body\s*{[\s\S]*?overflow\s*:\s*hidden/i.test(html)) {
    issues.push("body 必须 overflow:hidden，课堂投屏不能依赖网页滚动。");
  }

  if (/(overflow|overflow-y)\s*:\s*(auto|scroll)/i.test(html)) {
    issues.push("HTML 中出现内部滚动设置，必须拆页而不是让老师滚动。");
  }

  if (!/(下一页|下一步|next)/i.test(html) || !/(上一页|上一步|prev)/i.test(html)) {
    issues.push("缺少清晰的上一页/下一页课堂推进按钮。");
  }

  if (!/(回看|总结|完整过程|板书总结|检验)/.test(html)) {
    issues.push("缺少完整过程回看、板书总结或回代检验页面。");
  }

  if (layoutCount < 3) {
    issues.push("幻灯片版式变化不足：每套课件至少需要 3 种 data-layout，避免固定左右模板。");
  }

  if (/(AI 画面|header|focus|numbers|脚本|JSON|HTML 代码)/i.test(html)) {
    issues.push("课件画面中出现技术标签或实现痕迹，老师和学生不应该看到这些内容。");
  }

  if (!/(注意|别漏|易错|重点|高亮|标红|检查|回看|为什么|依据)/.test(html)) {
    issues.push("缺少面向学生的重点提示、依据说明或易错提醒。");
  }

  const qualityReport = assessCoursewareQuality({
    ...structuredCourseware,
    interactive_html: { html },
  });
  const requiredQualityIssues = qualityReport.checks.filter(
    (check) =>
      !check.passed &&
      check.severity === "required" &&
      ["html-projection", "student-friendly"].includes(check.id)
  );

  issues.push(...requiredQualityIssues.map((issue) => `${issue.label}：${issue.detail}`));

  return issues;
}

function compactStructuredCourseware(courseware: CoursewareJson) {
  return {
    knowledge_point_code: courseware.knowledge_point_code,
    knowledge_point_name: courseware.knowledge_point_name,
    learning_goals: courseware.learning_goals,
    core_concept: courseware.core_concept,
    slides: courseware.slides.map((slide) => ({
      slide_type: slide.slide_type,
      title: slide.title,
      content: slide.content,
      teacher_notes: slide.teacher_notes,
    })),
    examples: courseware.examples,
    common_mistakes: courseware.common_mistakes,
    practice_items: courseware.practice_items,
    summary_points: courseware.summary_points,
  };
}

function escapeHtml(value: string | undefined) {
  return (value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toListItems(values: string[] | undefined) {
  const items = (values ?? []).filter(Boolean).slice(0, 5);

  if (items.length === 0) {
    return "<li>请教师结合课堂情况补充讲解重点。</li>";
  }

  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderSlide(title: string, body: string, layout: string, extra = "") {
  return `<section class="slide" data-layout="${layout}">
  <div class="slide-inner">
    <p class="eyebrow">课堂投屏 · 优化候选版</p>
    <h1>${escapeHtml(title)}</h1>
    <p class="body">${escapeHtml(body)}</p>
    ${extra}
  </div>
</section>`;
}

export function buildCoursewareTemplateInteractiveHtml(
  courseware: CoursewareJson
): CoursewareInteractiveHtml {
  const slides = courseware.slides.slice(0, 8);
  const firstExample = courseware.examples[0];
  const mistakes = courseware.common_mistakes.slice(0, 3);
  const practiceItems = courseware.practice_items.slice(0, 3);
  const storyboard = courseware.dynamic_storyboards?.[0];
  const storyboardSteps = storyboard?.steps.slice(0, 4) ?? [];
  const renderedSlides = [
    renderSlide(
      courseware.knowledge_point_name,
      courseware.core_concept?.explanation || "围绕本知识点完成概念理解、例题推导和练习巩固。",
      "cover-visual",
      `<ul>${toListItems(courseware.learning_goals)}</ul>`
    ),
    ...slides.slice(0, 3).map((slide, index) =>
      renderSlide(
        slide.title,
        slide.content,
        ["concept-board", "derivation-focus", "teacher-check"][index % 3],
        slide.teacher_notes
          ? `<p class="note">教师提示：${escapeHtml(slide.teacher_notes)}</p>`
          : ""
      )
    ),
    renderSlide(
      firstExample?.title || "例题讲解",
      firstExample?.question || "请选择一道能暴露关键步骤的例题进行讲解。",
      "example-steps",
      `<ol>${toListItems(firstExample?.solution_steps)}</ol>`
    ),
    renderSlide(
      "易错点提醒",
      mistakes[0]?.mistake || "关注学生容易跳步或符号处理错误的环节。",
      "mistake-contrast",
      `<ul>${mistakes
        .map(
          (item) =>
            `<li><strong>${escapeHtml(item.mistake)}</strong>：${escapeHtml(
              item.correction
            )}</li>`
        )
        .join("")}</ul>`
    ),
    renderSlide(
      storyboard?.title || "动态讲解步骤",
      storyboard?.learning_objective || "把关键推导拆成学生能跟上的连续步骤。",
      "storyboard",
      `<ol>${toListItems(
        storyboardSteps.map((step) => `${step.step_title}：${step.narration}`)
      )}</ol>`
    ),
    renderSlide(
      "课堂练习",
      "用分层练习确认学生是否已经理解关键步骤。",
      "practice",
      `<ul>${practiceItems
        .map(
          (item) =>
            `<li><strong>${escapeHtml(item.question)}</strong><br/><span>${escapeHtml(
              item.explanation
            )}</span></li>`
        )
        .join("")}</ul>`
    ),
    renderSlide(
      "复习安排",
      "课后用短任务回看关键步骤，避免只会模仿、不懂理由。",
      "review-plan",
      `<ul>${toListItems(courseware.review_plan.map((item) => `${item.timing}：${item.task}`))}</ul>`
    ),
  ];
  const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(courseware.knowledge_point_name)} 互动课件</title>
  <style>
    *{box-sizing:border-box}
    html,body{margin:0;width:100%;height:100%;overflow:hidden;font-family:"Microsoft YaHei",Arial,sans-serif;background:#0f172a;color:#f8fafc}
    body{overflow:hidden}
    .deck{width:100vw;height:100vh;overflow:hidden;position:relative;background:linear-gradient(135deg,#0f172a,#172554 58%,#111827)}
    .slide{width:100%;height:100%;overflow:hidden;position:absolute;inset:0;display:none;padding:5vh 6vw}
    .slide.active{display:flex}
    .slide-inner{width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;gap:2.4vh;border:1px solid rgba(255,255,255,.14);border-radius:24px;padding:5vh 5vw;background:rgba(15,23,42,.76);box-shadow:0 24px 80px rgba(0,0,0,.32)}
    .eyebrow{margin:0;color:#67e8f9;font-size:1.8vh;font-weight:700;letter-spacing:.08em}
    h1{margin:0;font-size:clamp(30px,5vw,74px);line-height:1.05}
    .body{margin:0;max-width:70ch;font-size:clamp(18px,2.2vw,30px);line-height:1.55;color:#dbeafe}
    .note{margin:0;border-left:5px solid #facc15;padding:1.4vh 1.5vw;background:rgba(250,204,21,.12);font-size:clamp(15px,1.7vw,23px);line-height:1.5;color:#fef9c3}
    ul,ol{margin:0;padding-left:1.5em;display:grid;gap:1.1vh;font-size:clamp(16px,1.8vw,25px);line-height:1.45;color:#e0f2fe}
    li strong{color:#fff}
    li span{color:#cbd5e1}
    .controls{position:absolute;left:50%;bottom:3vh;transform:translateX(-50%);display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:999px;background:rgba(15,23,42,.78);border:1px solid rgba(255,255,255,.14)}
    button{border:0;border-radius:999px;padding:10px 18px;background:#22d3ee;color:#082f49;font-weight:800;cursor:pointer}
    .count{min-width:72px;text-align:center;color:#e2e8f0;font-weight:700}
  </style>
</head>
<body>
  <main class="deck">
    ${renderedSlides.join("\n")}
    <div class="controls">
      <button type="button" id="prev">上一页</button>
      <span class="count" id="count">1 / ${renderedSlides.length}</span>
      <button type="button" id="next">下一页</button>
    </div>
  </main>
  <script>
    const slides = Array.from(document.querySelectorAll('.slide'));
    const count = document.getElementById('count');
    let index = 0;
    function show(nextIndex) {
      index = Math.max(0, Math.min(slides.length - 1, nextIndex));
      slides.forEach((slide, slideIndex) => slide.classList.toggle('active', slideIndex === index));
      count.textContent = (index + 1) + ' / ' + slides.length;
    }
    document.getElementById('prev').addEventListener('click', () => show(index - 1));
    document.getElementById('next').addEventListener('click', () => show(index + 1));
    window.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') show(index - 1);
      if (event.key === 'ArrowRight' || event.key === ' ') show(index + 1);
    });
    show(0);
  </script>
</body>
</html>`;

  return {
    title: `${courseware.knowledge_point_name} 互动课件`,
    instructions: "本候选版由结构化课件内容生成投屏页，老师采用前仍需预览确认。",
    html,
  };
}

export async function generateCoursewareInteractiveHtml(
  params: GenerateCoursewareHtmlParams
): Promise<CoursewareInteractiveHtml> {
  const promptTemplate = await getPromptTemplate();
  const buildUserPrompt = (qualityFeedback?: string) => `${promptTemplate}

## 本次课件输入

学科：${params.subject}
年级：${params.grade}
学期：${params.semester}
章节：${params.chapter}
知识点编码：${params.knowledge_point_code}
知识点名称：${params.knowledge_point_name}
知识点说明：${params.description}

## 老师确认后的文本课件

${params.content_markdown}

## 结构化课件内容

${JSON.stringify(compactStructuredCourseware(params.structured_courseware), null, 2)}

## 输出格式

只输出 JSON 对象：

{
  "title": "中文课件标题",
  "instructions": "给老师的一句话使用说明",
  "html": "完整 HTML 文档字符串"
}
${qualityFeedback ? `\n## 上一版质量检查未通过\n\n${qualityFeedback}\n\n请重新生成完整 JSON。不要修补局部字符串，直接重做一版更适合教室投屏的幻灯片。` : ""}
`;

  const client = await getAIClient();
  const model = getAIModel("courseware-html");

  async function createDraft(qualityFeedback?: string) {
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(qualityFeedback) },
      ],
      ...(shouldUseAIJsonResponseFormat()
        ? { response_format: { type: "json_object" as const } }
        : {}),
      temperature: qualityFeedback ? 0.82 : 0.75,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error("AI model returned an empty courseware HTML");
    }

    return normalizeInteractiveHtml(JSON.parse(extractJson(content)));
  }

  const firstDraft = await createDraft();
  const firstIssues = assessInteractiveHtml(firstDraft.html, params.structured_courseware);

  if (firstIssues.length === 0) {
    return firstDraft;
  }

  const secondDraft = await createDraft(firstIssues.map((issue) => `- ${issue}`).join("\n"));
  const secondIssues = assessInteractiveHtml(secondDraft.html, params.structured_courseware);

  if (secondIssues.length > 0) {
    const report = assessCoursewareQuality({
      ...params.structured_courseware,
      interactive_html: secondDraft,
    });
    const feedback = formatCoursewareQualityFeedback(report);

    return {
      ...secondDraft,
      instructions: `${secondDraft.instructions}（系统已做内容效果检查，仍建议老师课前预览一遍。${feedback ? " 待关注：" + feedback.replace(/\n/g, " ") : ""}）`,
    };
  }

  return secondDraft;
}
