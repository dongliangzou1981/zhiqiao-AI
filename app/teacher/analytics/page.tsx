import type { Metadata } from "next";
import { TeacherPlaceholder } from "../_components/teacher-placeholder";

export const metadata: Metadata = {
  title: "学情分析 · 知桥AI",
};

export default function AnalyticsPage() {
  return (
    <TeacherPlaceholder
      title="学情分析"
      description="查看班级与学生维度的知识点掌握度、练习完成率与薄弱项，支持教学决策与个性化辅导。"
    />
  );
}
