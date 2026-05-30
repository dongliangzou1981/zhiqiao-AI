import type { Metadata } from "next";
import { TeacherPlaceholder } from "../_components/teacher-placeholder";

export const metadata: Metadata = {
  title: "AI课件生成 · 知桥AI",
};

export default function CoursewarePage() {
  return (
    <TeacherPlaceholder
      title="AI课件生成"
      description="将教案大纲转化为课件要点、分页结构与课堂互动页，辅助快速备课。"
    />
  );
}
