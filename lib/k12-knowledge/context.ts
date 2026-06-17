import type { K12KnowledgeContext, KnowledgePoint } from "./types";

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

export function findKnowledgePointByText(
  text: string,
  knowledgePoints: KnowledgePoint[]
) {
  const normalizedText = normalizeText(text);
  return [...knowledgePoints]
    .sort((a, b) => b.name.length - a.name.length)
    .find((point) => normalizedText.includes(normalizeText(point.name))) ?? null;
}

function present(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function formatK12KnowledgeContext(context: K12KnowledgeContext | null) {
  if (!context) return "";

  const point = context.knowledgePoint;
  const lines = [
    "国家课程标准驱动知识库上下文：",
    `- 知识点：${point.name}（${point.code}）`,
  ];

  const summary = present(point.summary ?? point.description);
  if (summary) lines.push(`- 知识点概述：${summary}`);
  if (present(point.standard_reference)) {
    lines.push(`- 课标依据：${point.standard_reference}`);
  }
  if (present(point.core_competency)) {
    lines.push(`- 核心素养：${point.core_competency}`);
  }
  if (present(point.learning_objective)) {
    lines.push(`- 学习目标：${point.learning_objective}`);
  }
  if (present(point.teaching_focus)) {
    lines.push(`- 教学重点：${point.teaching_focus}`);
  }
  if (present(point.teaching_difficulty)) {
    lines.push(`- 教学难点：${point.teaching_difficulty}`);
  }

  if (context.commonMistakes.length > 0) {
    lines.push(
      `- 常见错误：${context.commonMistakes
        .map((mistake) => `${mistake.mistake_type}${mistake.description ? `：${mistake.description}` : ""}`)
        .join("；")}`
    );
  }

  if (context.relatedKnowledgePoints.length > 0) {
    lines.push(
      `- 相关知识点：${context.relatedKnowledgePoints
        .map((related) => `${related.name}（${related.code}）`)
        .join("、")}`
    );
  }

  return lines.join("\n");
}
