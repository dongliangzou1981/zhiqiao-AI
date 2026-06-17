import type { CoursewareQualityReport } from "@/lib/courseware-quality";
import { formatCoursewareQualityFeedback } from "@/lib/courseware-quality";

const REFERENCE_MAX_LENGTH = 16000;

export function buildCoursewareJsonReference(value: unknown, maxLength = REFERENCE_MAX_LENGTH) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "";
  }

  const reference = JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
  const interactiveHtml = reference.interactive_html;

  if (interactiveHtml && typeof interactiveHtml === "object" && !Array.isArray(interactiveHtml)) {
    reference.interactive_html = {
      ...(interactiveHtml as Record<string, unknown>),
      html: "[HTML 已省略，请重新生成更适合 16:9 投屏的互动幻灯片]",
    };
  }

  const content = JSON.stringify(reference, null, 2);
  return content.length > maxLength
    ? `${content.slice(0, maxLength)}\n... [当前课件 JSON 过长，后文已截断]`
    : content;
}

export function buildCoursewareQualityImprovementFeedback(
  report: CoursewareQualityReport | null,
  extraInstruction?: string
) {
  const qualityFeedback = report ? formatCoursewareQualityFeedback(report) : "";
  const sections = [
    "请重做一版更适合真实课堂投屏、老师讲解和学生自学复习的课件。",
    "不要只微调局部文字，要重新审视讲解顺序、例题过程、学生检查点、练习分层和幻灯片节奏。",
    "数学推导不能跳步，关键变形必须说明依据，并用显性提示帮助反应慢的学生跟上。",
    "动态幻灯片必须是 16:9 投屏体验，一页一重点，无内部滚动，不同页面根据内容选择不同版式。",
  ];

  if (qualityFeedback) {
    sections.push("本次必须优先修正以下质量问题：", qualityFeedback);
  } else {
    sections.push(
      "当前规则检查未发现必修问题，但仍要继续提升课堂可用性、画面节奏和学生可理解性。"
    );
  }

  if (extraInstruction?.trim()) {
    sections.push("老师补充要求：", extraInstruction.trim());
  }

  return sections.join("\n\n");
}
