import type { Metadata } from "next";
import { StudentPlaceholder } from "../_components/student-placeholder";

export const metadata: Metadata = {
  title: "智能复习 · 知桥AI",
};

export default function StudentReviewPage() {
  return (
    <StudentPlaceholder
      title="智能复习"
      description="根据掌握度与错题记录，推送每日复习任务与巩固练习，帮助你高效回顾薄弱知识点。"
    />
  );
}
