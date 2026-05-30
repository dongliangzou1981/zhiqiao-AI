import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "知桥AI 教师工作台",
  description: "教师备课、AI 教学助手与班级学情概览",
};

export default function TeacherLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
