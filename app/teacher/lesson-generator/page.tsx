import type { Metadata } from "next";
import { LessonGeneratorForm } from "./lesson-generator-form";

export const metadata: Metadata = {
  title: "AI教案生成 · 知桥AI",
  description: "从知识库选择知识点，生成结构化教案（Mock 演示）",
};

export default function LessonGeneratorPage() {
  return <LessonGeneratorForm />;
}
