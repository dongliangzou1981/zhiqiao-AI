import { buildCoursewareHumanReviewChecklist } from "@/lib/courseware-human-review";
import type { CoursewareQualityReport } from "@/lib/courseware-quality";

type CoursewareHumanReviewChecklistProps = {
  report: CoursewareQualityReport;
};

export function CoursewareHumanReviewChecklist({ report }: CoursewareHumanReviewChecklistProps) {
  const items = buildCoursewareHumanReviewChecklist(report);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          教师人工验收
        </p>
        <h3 className="mt-2 text-base font-semibold text-slate-900">
          上课前建议重点看这 4 件事
        </h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          自动检查只能发现结构和规则问题，最终仍要由老师确认是否适合真实课堂。
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
            <div className="flex items-start justify-between gap-3">
              <h4 className="text-sm font-semibold text-slate-900">{item.title}</h4>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  item.status === "重点复核"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {item.status}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">依据：{item.reason}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
