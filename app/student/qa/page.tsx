import type { Metadata } from "next";
import { QaChat } from "./qa-chat";

export const metadata: Metadata = {
  title: "学习答疑 · 知桥AI",
  description: "知桥AI 学生智能答疑助手",
};

export default function StudentQaPage() {
  return <QaChat />;
}
