import Link from "next/link";
import type { CoursewareJson } from "@/lib/courseware-types";
import { getCoursewareById } from "@/lib/coursewares";
import { createClient } from "@/lib/supabase/server";
import { CoursewarePreviewClient } from "./courseware-preview-client";

type CoursewarePreviewPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function isCoursewareJson(value: unknown): value is CoursewareJson {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      (value as { version?: unknown }).version === "courseware_json_v1"
  );
}

export default async function CoursewarePreviewPage({ params }: CoursewarePreviewPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const record = await getCoursewareById(supabase, id);
  const structured = record && isCoursewareJson(record.content_json) ? record.content_json : null;
  const interactiveHtml = structured?.interactive_html;
  const detailHref = `/teacher/courseware-history/${id}`;

  if (!record) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl">
          <p className="text-base font-semibold">未找到该课件记录</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            该课件可能不存在，或当前账号没有访问权限。
          </p>
          <Link
            href="/teacher/courseware-history"
            className="mt-5 inline-flex rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            返回课件历史
          </Link>
        </div>
      </main>
    );
  }

  if (!interactiveHtml?.html) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl">
          <p className="text-base font-semibold">这份课件还没有动态预览</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            请先回到课件详情，生成或重新生成动态互动课件。
          </p>
          <Link
            href={`${detailHref}#dynamic-courseware-generator`}
            className="mt-5 inline-flex rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            返回并生成动态课件
          </Link>
        </div>
      </main>
    );
  }

  return (
    <CoursewarePreviewClient
      coursewareId={record.id}
      detailHref={detailHref}
      regenerateHref={`${detailHref}#dynamic-courseware-generator`}
      title={interactiveHtml.title || record.knowledge_point_name}
      metadata={`${record.subject} · ${record.grade} · ${record.semester} · ${record.chapter} · ${record.knowledge_point_code}`}
      interactiveHtml={interactiveHtml}
    />
  );
}
