import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "知桥AI",
  description: "基于教材知识点的 AI 教学平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
