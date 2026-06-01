import Link from "next/link";

const todayTasks = [
  {
    id: "math-review",
    label: "数学复习",
    hint: "有理数加减法 · 约 15 分钟",
    status: "进行中",
    href: "/student/review",
  },
  {
    id: "mistakes",
    label: "错题整理",
    hint: "待订正 5 道",
    status: "待完成",
    href: "/student/review",
  },
  {
    id: "qa",
    label: "AI答疑",
    hint: "昨日提问 1 条未读回复",
    status: "新消息",
    href: "/student/qa",
  },
];

const progress = {
  weekDays: 4,
  weekTarget: 7,
  completedPoints: 12,
  totalPoints: 18,
  mastery: 68,
};

const aiTools = [
  {
    id: "qa",
    title: "AI答疑",
    description: "随时提问，获得分步解析与思路引导",
    accent: "from-teal-500 to-emerald-600",
    href: "/student/qa",
  },
  {
    id: "knowledge",
    title: "知识点讲解",
    description: "分步讲解、例题演示与易错提醒",
    accent: "from-sky-500 to-cyan-600",
    href: "/student/knowledge",
  },
  {
    id: "review",
    title: "智能复习",
    description: "按掌握度推送复习与巩固练习",
    accent: "from-violet-500 to-purple-600",
    href: "/student/review",
  },
];

const recentRecords = [
  {
    id: "1",
    time: "今天 19:20",
    title: "完成了「有理数加减法」巩固练习",
    type: "练习",
  },
  {
    id: "2",
    time: "今天 17:05",
    title: "向 AI 提问：负号与减号有什么区别？",
    type: "答疑",
  },
  {
    id: "3",
    time: "昨天 20:30",
    title: "学习了知识点「数轴与相反数」",
    type: "讲解",
  },
  {
    id: "4",
    time: "昨天 18:15",
    title: "智能复习：整式运算（正确率 75%）",
    type: "复习",
  },
  {
    id: "5",
    time: "昨天 16:00",
    title: "订正错题 3 道",
    type: "错题",
  },
];

const typeStyles: Record<string, string> = {
  练习: "bg-teal-100 text-teal-700",
  答疑: "bg-sky-100 text-sky-700",
  讲解: "bg-violet-100 text-violet-700",
  复习: "bg-indigo-100 text-indigo-700",
  错题: "bg-amber-100 text-amber-700",
};

const statusStyles: Record<string, string> = {
  进行中: "bg-teal-100 text-teal-700",
  待完成: "bg-amber-100 text-amber-700",
  新消息: "bg-rose-100 text-rose-700",
};

function IconTasks() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function IconSparkles() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export default function StudentDashboardPage() {
  const today = new Date().toLocaleDateString("zh-CN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const weekProgress = Math.round((progress.weekDays / progress.weekTarget) * 100);
  const pointsProgress = Math.round(
    (progress.completedPoints / progress.totalPoints) * 100
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/40">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-teal-600">
              知桥AI
            </p>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              知桥AI 学生学习中心
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">{today}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700 ring-1 ring-teal-600/20 sm:inline">
              七年级 · 数学
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white">
              李
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* 今日任务 */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 lg:col-span-1">
            <div className="mb-5 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
                <IconTasks />
              </span>
              <h2 className="text-lg font-semibold text-slate-900">今日任务</h2>
            </div>
            <ul className="space-y-3">
              {todayTasks.map((task) => (
                <li key={task.id}>
                  <Link
                    href={task.href}
                    className="group flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 transition hover:border-teal-200 hover:bg-teal-50/50"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 group-hover:text-teal-700">
                        {task.label}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">{task.hint}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusStyles[task.status] ?? "bg-slate-100 text-slate-600"}`}
                    >
                      {task.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* AI 学习助手 */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 lg:col-span-2">
            <div className="mb-5 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <IconSparkles />
              </span>
              <h2 className="text-lg font-semibold text-slate-900">AI学习助手</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {aiTools.map((tool) => (
                <Link
                  key={tool.id}
                  href={tool.href}
                  className="group flex flex-col rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-left transition hover:border-transparent hover:shadow-lg hover:shadow-teal-200/40"
                >
                  <span
                    className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${tool.accent} text-white shadow-sm`}
                  >
                    <IconSparkles />
                  </span>
                  <span className="font-semibold text-slate-900 group-hover:text-teal-700">
                    {tool.title}
                  </span>
                  <span className="mt-1 text-xs leading-relaxed text-slate-500">
                    {tool.description}
                  </span>
                  <span className="mt-3 text-xs font-medium text-teal-600 opacity-0 transition group-hover:opacity-100">
                    进入学习 →
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* 学习进度 */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 lg:col-span-2">
            <div className="mb-5 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                <IconChart />
              </span>
              <h2 className="text-lg font-semibold text-slate-900">学习进度</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-teal-50/80 to-white p-5">
                <p className="text-sm font-medium text-slate-500">本周学习天数</p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-teal-600">
                  {progress.weekDays}
                  <span className="text-base font-normal text-slate-500">
                    / {progress.weekTarget} 天
                  </span>
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-teal-100">
                  <div
                    className="h-full rounded-full bg-teal-500 transition-all"
                    style={{ width: `${weekProgress}%` }}
                  />
                </div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-sky-50/80 to-white p-5">
                <p className="text-sm font-medium text-slate-500">已完成知识点</p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-sky-600">
                  {progress.completedPoints}
                  <span className="text-base font-normal text-slate-500">
                    / {progress.totalPoints}
                  </span>
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-sky-100">
                  <div
                    className="h-full rounded-full bg-sky-500 transition-all"
                    style={{ width: `${pointsProgress}%` }}
                  />
                </div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-violet-50/80 to-white p-5">
                <p className="text-sm font-medium text-slate-500">当前掌握度</p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-violet-600">
                  {progress.mastery}%
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-violet-100">
                  <div
                    className="h-full rounded-full bg-violet-500 transition-all"
                    style={{ width: `${progress.mastery}%` }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 最近学习记录 */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 lg:col-span-1">
            <div className="mb-5 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <IconClock />
              </span>
              <h2 className="text-lg font-semibold text-slate-900">最近学习记录</h2>
            </div>
            <ul className="space-y-4">
              {recentRecords.map((record, index) => (
                <li key={record.id} className="relative flex gap-3 pl-1">
                  {index < recentRecords.length - 1 && (
                    <span
                      className="absolute left-[11px] top-8 h-[calc(100%+4px)] w-px bg-slate-200"
                      aria-hidden
                    />
                  )}
                  <span className="relative z-[1] mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-white bg-teal-500 ring-2 ring-teal-100" />
                  <div className="min-w-0 flex-1 pb-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${typeStyles[record.type] ?? "bg-slate-100 text-slate-600"}`}
                      >
                        {record.type}
                      </span>
                      <time className="text-xs text-slate-400">{record.time}</time>
                    </div>
                    <p className="mt-1 text-sm leading-snug text-slate-700">{record.title}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          原型数据仅供演示 · 知桥AI V1.0
        </p>
      </main>
    </div>
  );
}
