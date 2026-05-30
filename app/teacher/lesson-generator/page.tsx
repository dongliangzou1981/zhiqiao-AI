import type { Metadata } from "next";
import { LessonGeneratorForm } from "./lesson-generator-form";

export const metadata: Metadata = {
  title: "AI教案生成 · 知桥AI",
  description: "根据学科、年级、教材版本与知识点生成结构化教案",
};

export default function LessonGeneratorPage() {
  return <LessonGeneratorForm />;
}
