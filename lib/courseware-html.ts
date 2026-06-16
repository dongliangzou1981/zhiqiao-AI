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
