import type { Metadata } from "next";
import { StudentPlaceholder } from "../_components/student-placeholder";

export const metadata: Metadata = {
  title: "知识点讲解 · 知桥AI",
};

export default function StudentKnowledgePage() {
  return (
    <StudentPlaceholder
      title="知识点讲解"
      description="分步讲解教材知识点，配合例题与易错提示，支持课前预习与课后巩固。"
    />
  );
}
