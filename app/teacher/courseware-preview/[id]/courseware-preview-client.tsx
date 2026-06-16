"use client";

import Link from "next/link";
import { useMemo } from "react";
import { buildCoursewareSandboxedHtml } from "@/lib/courseware-sandbox";
import type { CoursewareInteractiveHtml } from "@/lib/courseware-types";

type CoursewarePreviewClientProps = {
  coursewareId: string;
  detailHref: string;
  regenerateHref: string;
  title: string;
  metadata: string;
  interactiveHtml: CoursewareInteractiveHtml;
};

function sanitizeFilename(value: string) {
  return `${value || "courseware"}.html`.replace(/[\\/:*?"<>|]/g, "-");
}

export function CoursewarePreviewClient({
  coursewareId,
  detailHref,
  regenerateHref,
  title,
  metadata,
  interactiveHtml,
}: CoursewarePreviewClientProps) {
  const srcDoc = useMemo(
    () => buildCoursewareSandboxedHtml(interactiveHtml.html),
    [interactiveHtml.html]
  );

  function closeWindow() {
    window.close();
    window.setTimeout(() => {
      if (!window.closed) {
        window.location.href = detailHref;
      }
    }, 180);
  }

  function printCourseware() {
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.open();
    printWindow.document.write(srcDoc);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => printWindow.print(), 500);
  }

  function downloadHtml() {
    const blob = new Blob([srcDoc], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = sanitizeFilename(interactiveHtml.title || title);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="preview-toolbar sticky top-0 z-20 border-b border-white/10 bg-slate-950/95 backdrop-blur">
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-6">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-300">
              知桥AI 课堂投屏预览
            </p>
            <h1 className="mt-1 truncate text-base font-semibold md:text-lg">{title}</h1>
            <p className="mt-0.5 truncate text-xs text-slate-400">{metadata}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={detailHref}
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              返回课件详情
            </Link>
            <button
              type="button"
              onClick={closeWindow}
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              关闭窗口
            </button>
            <button
              type="button"
              onClick={printCourseware}
              className="rounded-full border border-cyan-300/25 px-4 py-2 text-sm font-semibold text-cyan-50 transition hover:bg-cyan-300/10"
            >
              打印/保存 PDF
            </button>
            <button
              type="button"
              onClick={downloadHtml}
              className="rounded-full border border-cyan-300/25 px-4 py-2 text-sm font-semibold text-cyan-50 transition hover:bg-cyan-300/10"
            >
              下载 HTML
            </button>
            <Link
              href={regenerateHref}
              className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              重新生成动态课件
            </Link>
          </div>
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-80px)] items-center justify-center px-3 py-4">
        <section
          className="w-full"
          style={{ maxWidth: "min(96vw, calc((100vh - 112px) * 16 / 9))" }}
        >
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-2 shadow-2xl">
            <iframe
              title={`${title} 投屏预览`}
              sandbox="allow-scripts"
              srcDoc={srcDoc}
              className="block aspect-video w-full rounded-xl border border-white/10 bg-slate-950"
            />
          </div>
          <p className="mt-3 text-center text-xs text-slate-500">
            课件编号：{coursewareId}
          </p>
        </section>
      </main>
    </div>
  );
}
