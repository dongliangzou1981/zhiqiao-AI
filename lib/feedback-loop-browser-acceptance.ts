export type FeedbackLoopBrowserAcceptanceStatus = "ready" | "blocked";

export type FeedbackLoopBrowserAcceptanceActor = "student" | "teacher";

export type FeedbackLoopBrowserAcceptanceStep = {
  id: string;
  actor: FeedbackLoopBrowserAcceptanceActor;
  name: string;
  url: string;
  action: string;
  expected: string;
  evidence: string;
  writesData: boolean;
};

export type FeedbackLoopBrowserAcceptancePlan = {
  status: FeedbackLoopBrowserAcceptanceStatus;
  appUrl: string;
  teacherEmail?: string;
  studentEmail?: string;
  coursewareId?: string;
  knowledgePointCode?: string;
  feedbackText: string;
  missingConfig: string[];
  blocker?: string;
  steps: FeedbackLoopBrowserAcceptanceStep[];
};

const REQUIRED_CONFIG = [
  "FEEDBACK_LOOP_TEACHER_EMAIL",
  "FEEDBACK_LOOP_TEACHER_PASSWORD",
  "FEEDBACK_LOOP_STUDENT_EMAIL",
  "FEEDBACK_LOOP_STUDENT_PASSWORD",
  "FEEDBACK_LOOP_COURSEWARE_ID",
  "FEEDBACK_LOOP_KNOWLEDGE_POINT_CODE",
] as const;

function clean(value: string | undefined) {
  return value?.trim() ?? "";
}

function normalizeAppUrl(value: string | undefined) {
  return (clean(value) || "http://127.0.0.1:3000").replace(/\/+$/, "");
}

function coursewarePath(appUrl: string, coursewareId: string) {
  return `${appUrl}/student/courseware/${encodeURIComponent(coursewareId)}`;
}

function improvePath(appUrl: string, coursewareId: string) {
  return `${appUrl}/teacher/courseware-history/${encodeURIComponent(
    coursewareId
  )}?feedback=student#courseware-quality-instruction`;
}

export function buildFeedbackLoopBrowserAcceptancePlan(input: {
  env: Record<string, string | undefined>;
}): FeedbackLoopBrowserAcceptancePlan {
  const appUrl = normalizeAppUrl(input.env.FEEDBACK_LOOP_APP_URL);
  const feedbackText =
    clean(input.env.FEEDBACK_LOOP_FEEDBACK_TEXT) ||
    "这一步没看懂，希望老师再讲一次。";
  const missingConfig = REQUIRED_CONFIG.filter((key) => !clean(input.env[key]));

  if (missingConfig.length > 0) {
    return {
      status: "blocked",
      appUrl,
      feedbackText,
      missingConfig,
      blocker:
        "缺少真实账号浏览器验收配置。请通过环境变量提供教师账号、学生账号、课件 id 和知识点，不要在脚本或文档中硬编码密码。",
      steps: [],
    };
  }

  const teacherEmail = clean(input.env.FEEDBACK_LOOP_TEACHER_EMAIL);
  const studentEmail = clean(input.env.FEEDBACK_LOOP_STUDENT_EMAIL);
  const coursewareId = clean(input.env.FEEDBACK_LOOP_COURSEWARE_ID);
  const knowledgePointCode = clean(input.env.FEEDBACK_LOOP_KNOWLEDGE_POINT_CODE);

  return {
    status: "ready",
    appUrl,
    teacherEmail,
    studentEmail,
    coursewareId,
    knowledgePointCode,
    feedbackText,
    missingConfig: [],
    steps: [
      {
        id: "student-submit-feedback",
        actor: "student",
        name: "学生提交课件负反馈",
        url: coursewarePath(appUrl, coursewareId),
        action:
          "使用学生账号登录，打开已发布课件，提交“没看懂”和“希望老师再讲一次”，反馈文本使用脚本输出的 feedbackText。",
        expected: "反馈保存成功，页面显示学生已提交的理解反馈。",
        evidence: "记录页面反馈状态和网络请求结果。",
        writesData: true,
      },
      {
        id: "teacher-check-analytics",
        actor: "teacher",
        name: "教师学习数据页出现反馈",
        url: `${appUrl}/teacher/analytics`,
        action: "切换到教师账号，打开学习数据页，定位学生请求老师再讲区域。",
        expected: "出现该学生、知识点、反馈文本，跟进状态为“待跟进”。",
        evidence: "记录学生邮箱、知识点和跟进状态。",
        writesData: false,
      },
      {
        id: "teacher-open-improve",
        actor: "teacher",
        name: "进入课件详情并预填优化要求",
        url: improvePath(appUrl, coursewareId),
        action: "点击或直接打开课件详情反馈入口，检查优化要求文本框。",
        expected: "优化要求已包含学生反馈摘要，并提示候选版采用前不覆盖正式课件。",
        evidence: "记录预填摘要和页面保护提示。",
        writesData: false,
      },
      {
        id: "teacher-generate-candidate",
        actor: "teacher",
        name: "生成优化候选版",
        url: improvePath(appUrl, coursewareId),
        action: "点击生成优化候选版，等待接口返回候选版对比区。",
        expected: "候选版生成成功，响应包含 stage/timings，学生端正式课件在采用前不变化。",
        evidence: "记录候选版 id、stage、timings 和学生端采用前状态。",
        writesData: true,
      },
      {
        id: "teacher-apply-publish",
        actor: "teacher",
        name: "采用新版并发布",
        url: improvePath(appUrl, coursewareId),
        action: "采用候选版后发布到学生端。",
        expected: "候选版状态变为已采用，课件发布状态为已发布。",
        evidence: "记录发布后的页面状态或数据库 `is_published=true`。",
        writesData: true,
      },
      {
        id: "teacher-assign-review",
        actor: "teacher",
        name: "老师布置复习",
        url: `${appUrl}/teacher/analytics`,
        action: "在反馈列表或弱项知识点处给学生布置复习。",
        expected: "创建 `teacher_review` 任务成功。",
        evidence: "记录 API 结果、任务知识点和到期日。",
        writesData: true,
      },
      {
        id: "student-complete-review",
        actor: "student",
        name: "学生完成老师布置复习",
        url: `${appUrl}/student/review?code=${encodeURIComponent(knowledgePointCode)}`,
        action: "切回学生账号，打开复习页并完成老师布置的复习任务。",
        expected: "任务状态变为 `completed`，掌握度刷新没有阻断完成流程。",
        evidence: "记录完成后的页面状态和任务状态。",
        writesData: true,
      },
    ],
  };
}

export function formatFeedbackLoopBrowserAcceptanceSummary(
  plan: FeedbackLoopBrowserAcceptancePlan
) {
  if (plan.status === "blocked") {
    return `blocked: ${plan.missingConfig.length} missing config values`;
  }

  return `ready: ${plan.steps.length} browser steps`;
}
