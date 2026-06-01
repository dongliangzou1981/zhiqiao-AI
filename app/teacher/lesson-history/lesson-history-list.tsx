"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getLessonHistory, type LessonHistoryRecord } from "@/lib/lesson-history";

function formatCreatedAt(iso: string): string {
  return new Date(iso).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LessonHistoryList() {
  const [records, setRecords] = useState<LessonHistoryRecord[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setRecords(getLessonHistory());
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center">
        <p className="text-sm font-medium text-slate-600">暂无教案历史</p>
        <p className="mt-1 text-xs text-slate-400">生成教案后将自动保存在本地</p>
        <Link
          href="/teacher/lesson-generator"
          className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          去生成第一份教案 →
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="pb-3 pr-4 font-medium">知识点名称</th>
              <th className="pb-3 pr-4 font-medium">知识点编码</th>
              <th className="pb-3 pr-4 font-medium">创建时间</th>
              <th className="pb-3 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((record) => (
              <tr key={record.id} className="transition hover:bg-slate-50/80">
                <td className="py-4 pr-4 font-medium text-slate-900">
                  {record.knowledgePointName}
                </td>
                <td className="py-4 pr-4">
                  <code className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
                    {record.knowledgePointCode}
                  </code>
                </td>
                <td className="py-4 pr-4 tabular-nums text-slate-600">
                  {formatCreatedAt(record.createdAt)}
                </td>
                <td className="py-4 text-right">
                  <Link
                    href={`/teacher/lesson-history/${record.id}`}
                    className="inline-flex items-center rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100"
                  >
                    查看
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {records.map((record) => (
          <li
            key={record.id}
            className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/30"
          >
            <p className="font-semibold text-slate-900">{record.knowledgePointName}</p>
            <code className="mt-2 inline-block rounded-md bg-white px-2 py-0.5 font-mono text-xs text-slate-600 ring-1 ring-slate-200/80">
              {record.knowledgePointCode}
            </code>
            <p className="mt-2 text-xs text-slate-500">
              创建时间：{formatCreatedAt(record.createdAt)}
            </p>
            <Link
              href={`/teacher/lesson-history/${record.id}`}
              className="mt-3 inline-flex items-center rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
            >
              查看
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export function LessonHistoryCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(getLessonHistory().length);
  }, []);

  return <span className="font-semibold text-indigo-600">{count}</span>;
}
