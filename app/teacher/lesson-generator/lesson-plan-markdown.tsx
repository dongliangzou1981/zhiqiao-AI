import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h2 className="mb-3 mt-6 text-xl font-bold text-slate-900 first:mt-0">{children}</h2>
  ),
  h2: ({ children }) => (
    <h3 className="mb-2 mt-5 text-lg font-semibold text-slate-900 first:mt-0">{children}</h3>
  ),
  h3: ({ children }) => (
    <h4 className="mb-2 mt-4 text-base font-semibold text-slate-800">{children}</h4>
  ),
  p: ({ children }) => <p className="mb-3 leading-relaxed text-slate-700">{children}</p>,
  ul: ({ children }) => <ul className="mb-4 list-disc space-y-1.5 pl-5 text-slate-700">{children}</ul>,
  ol: ({ children }) => (
    <ol className="mb-4 list-decimal space-y-1.5 pl-5 text-slate-700">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
  code: ({ children }) => (
    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-violet-800">
      {children}
    </code>
  ),
};

export function LessonPlanMarkdown({ content }: { content: string }) {
  return (
    <div className="text-sm">
      <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
    </div>
  );
}
