import type { Metadata } from "next";
import { TeacherPlaceholder } from "../_components/teacher-placeholder";

export const metadata: Metadata = {
  title: "AI知识点讲解 · 知桥AI",
};

export default function KnowledgeExplainPage() {
  return (
    <TeacherPlaceholder
      title="AI知识点讲解"
      description="针对单个知识点生成分步讲解、例题演示与易错点提示，可用于课堂演示或学生自学。"
    />
  );
}
