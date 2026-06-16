import type { Metadata } from "next";
import { getAIModelConfig } from "@/lib/ai";
import { LessonGeneratorForm } from "./lesson-generator-form";

export const metadata: Metadata = {
  title: "AI教案生成 | 知桥AI",
  description: "根据知识点生成结构化教案",
};

export default function LessonGeneratorPage() {
  const config = getAIModelConfig("lesson-plan");
  return <LessonGeneratorForm modelLabel={`${config.provider} / ${config.model}`} />;
}
