import Link from "next/link";

const todos = [
  {
    id: "lesson",
    label: "待生成教案",
    count: 3,
    hint: "七年级数学 · 有理数",
    href: "/teacher/lesson-generator",
  },
  {
    id: "homework",
    label: "待批改作业",
    count: 12,
    hint: "昨日练习册",
    href: null,
  },
  {
    id: "analytics",
    label: "待查看学情",
    count: 2,
    hint: "期中测验反馈",
    href: "/teacher/analytics",
  },
];

const aiTools = [
  {
    id: "knowledge-base",
    title: "知识库",
    description: "查看教材、章节与知识点结构",
    accent: "from-cyan-600 to-indigo-600",
    href: "/teacher/knowledge-base",
  },
  {
    id: "lesson-plan",
    title: "AI教案生成",
    description: "按知识点一键生成教学目标与课堂流程",
    accent: "from-violet-500 to-indigo-600",
    href: "/teacher/lesson-generator",
  },
  {
    id: "slides",
    title: "AI课件生成",
    description: "结构化大纲转课件要点与互动页",
    accent: "from-sky-500 to-blue-600",
    href: "/teacher/courseware",
  },
  {
    id: "explain",
    title: "AI知识点讲解",
    description: "分步讲解、例题与易错点提示",
    accent: "from-emerald-500 to-teal-600",
    href: "/teacher/knowledge-explain",
  },
  {
    id: "analytics",
    title: "学情分析",
    description: "班级掌握度、完成率与薄弱知识点",
    accent: "from-amber-500 to-orange-600",
    href: "/teacher/analytics",
  },
];

const classOverview = {
  className: "七年级（3）班",
  subject: "数学",
  studentCount: 42,
  completionRate: 78,
  mastery: 72,
};

const recentActivities = [
  {
    id: "1",
    time: "今天 10:32",
    title: "生成了教案《有理数的加减法》",
    type: "教案",
  },
  {
    id: "2",
    time: "今天 09:15",
    title: "查看了班级学情报告",
    type: "学情",
  },
  {
    id: "3",
    time: "昨天 16:40",
    title: "批改了 18 份周末作业",
    type: "作业",
  },
  {
    id: "4",
    time: "昨天 14:20",
    title: "使用 AI 讲解「数轴与相反数」",
    type: "讲解",
  },
  {
    id: "5",
    time: "昨天 11:05",
    title: "发布了课堂练习：有理数比较大小",
    type: "练习",
  },
];

const typeStyles: Record<string, string> = {
  教案: "bg-violet-100 text-violet-700",
  学情: "bg-amber-100 text-amber-700",
  作业: "bg-sky-100 text-sky-700",
  讲解: "bg-emerald-100 text-emerald-700",
  练习: "bg-indigo-100 text-indigo-700",
};

function IconClipboard() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v9.75c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
    </svg>
  );
}

function IconSparkles() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
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

export default function TeacherDashboardPage() {
  const today = new Date().toLocaleDateString("zh-CN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-indigo-600">
              知桥AI
            </p>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              知桥AI 教师工作台
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">{today}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20 sm:inline">
              在线
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
              王
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* 今日待办 */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 lg:col-span-1">
            <div className="mb-5 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <IconClipboard />
              </span>
              <h2 className="text-lg font-semibold text-slate-900">今日待办</h2>
            </div>
            <ul className="space-y-3">
              {todos.map((item) => {
                const content = (
                  <>
                    <div>
                      <p className="font-medium text-slate-800">{item.label}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{item.hint}</p>
                    </div>
                    <span className="flex h-8 min-w-[2rem] items-center justify-center rounded-full bg-indigo-600 px-2 text-sm font-bold text-white">
                      {item.count}
                    </span>
                  </>
                );
                const className =
                  "group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 transition hover:border-indigo-200 hover:bg-indigo-50/50";

                return (
                  <li key={item.id}>
                    {item.href ? (
                      <Link href={item.href} className={className}>
                        {content}
                      </Link>
                    ) : (
                      <div className={className}>{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          {/* AI 教学助手 */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 lg:col-span-2">
            <div className="mb-5 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                <IconSparkles />
              </span>
              <h2 className="text-lg font-semibold text-slate-900">AI教学助手</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {aiTools.map((tool) => (
                <Link
                  key={tool.id}
                  href={tool.href}
                  className="group flex flex-col rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-left transition hover:border-transparent hover:shadow-lg hover:shadow-indigo-200/40"
                >
                  <span
                    className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${tool.accent} text-white shadow-sm`}
                  >
                    <IconSparkles />
                  </span>
                  <span className="font-semibold text-slate-900 group-hover:text-indigo-700">
                    {tool.title}
                  </span>
                  <span className="mt-1 text-xs leading-relaxed text-slate-500">
                    {tool.description}
                  </span>
                  <span className="mt-3 text-xs font-medium text-indigo-600 opacity-0 transition group-hover:opacity-100">
                    立即使用 →
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* 班级概览 */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 lg:col-span-2">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                  <IconUsers />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">班级概览</h2>
                  <p className="text-sm text-slate-500">
                    {classOverview.className} · {classOverview.subject}
                  </p>
                </div>
              </div>
              <Link
                href="/teacher/analytics"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                学情分析
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-5">
                <p className="text-sm font-medium text-slate-500">学生人数</p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
                  {classOverview.studentCount}
                  <span className="ml-1 text-base font-normal text-slate-500">人</span>
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-emerald-50/80 to-white p-5">
                <p className="text-sm font-medium text-slate-500">今日完成率</p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-emerald-600">
                  {classOverview.completionRate}%
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${classOverview.completionRate}%` }}
                  />
                </div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-indigo-50/80 to-white p-5">
                <p className="text-sm font-medium text-slate-500">平均掌握度</p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-indigo-600">
                  {classOverview.mastery}%
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-indigo-100">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${classOverview.mastery}%` }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 最近活动 */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 lg:col-span-1">
            <div className="mb-5 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <IconClock />
              </span>
              <h2 className="text-lg font-semibold text-slate-900">最近活动</h2>
            </div>
            <ul className="space-y-4">
              {recentActivities.map((activity, index) => (
                <li key={activity.id} className="relative flex gap-3 pl-1">
                  {index < recentActivities.length - 1 && (
                    <span
                      className="absolute left-[11px] top-8 h-[calc(100%+4px)] w-px bg-slate-200"
                      aria-hidden
                    />
                  )}
                  <span className="relative z-[1] mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-white bg-indigo-500 ring-2 ring-indigo-100" />
                  <div className="min-w-0 flex-1 pb-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase ${typeStyles[activity.type] ?? "bg-slate-100 text-slate-600"}`}
                      >
                        {activity.type}
                      </span>
                      <time className="text-xs text-slate-400">{activity.time}</time>
                    </div>
                    <p className="mt-1 text-sm leading-snug text-slate-700">
                      {activity.title}
                    </p>
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
