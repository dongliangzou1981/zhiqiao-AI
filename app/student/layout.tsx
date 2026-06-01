import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "知桥AI 学生学习中心",
  description: "学生复习、AI 答疑与知识点学习",
};

export default function StudentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
