import { buildFeedbackLoopBrowserAcceptancePlan } from "./feedback-loop-browser-acceptance";

export type FeedbackLoopPreflightStatus = "pass" | "fail" | "skip" | "blocked";

export type FeedbackLoopPreflightCheck = {
  name: string;
  status: FeedbackLoopPreflightStatus;
  detail: string;
};

export type FeedbackLoopPreflightInput = {
  env: Record<string, string | undefined>;
  docs: {
    acceptanceChecklist: boolean;
    teacherTrialGuide: boolean;
  };
  http?: {
    loginStatus?: number;
    analyticsStatus?: number;
  };
  supabase?: {
    coursewareRevisions: boolean;
    studentCoursewareFeedback: boolean;
    teacherReviewTasks: boolean;
  };
};

function hasValue(value: string | undefined) {
  return Boolean(value?.trim());
}

function checkHttpStatus(
  name: string,
  status: number | undefined,
  allowed: number[]
): FeedbackLoopPreflightCheck {
  if (!status) {
    return {
      name,
      status: "skip",
      detail: "No HTTP result was provided.",
    };
  }

  if (allowed.includes(status)) {
    return {
      name,
      status: "pass",
      detail: `HTTP ${status}`,
    };
  }

  return {
    name,
    status: "fail",
    detail: `Expected ${allowed.join(" or ")}, got HTTP ${status}.`,
  };
}

export function buildFeedbackLoopPreflightChecks(
  input: FeedbackLoopPreflightInput
): FeedbackLoopPreflightCheck[] {
  const hasSupabaseUrl = hasValue(input.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasAnonKey = hasValue(input.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const hasServiceRole = hasValue(input.env.SUPABASE_SERVICE_ROLE_KEY);
  const canCheckSupabase = hasSupabaseUrl && hasServiceRole;
  const docsReady = input.docs.acceptanceChecklist && input.docs.teacherTrialGuide;
  const browserAcceptancePlan = buildFeedbackLoopBrowserAcceptancePlan({ env: input.env });

  const checks: FeedbackLoopPreflightCheck[] = [
    {
      name: "Acceptance docs",
      status: docsReady ? "pass" : "fail",
      detail: docsReady
        ? "Acceptance checklist and teacher trial guide are present."
        : "Missing acceptance checklist or teacher trial guide.",
    },
    {
      name: "Supabase environment",
      status: hasSupabaseUrl && hasAnonKey && hasServiceRole ? "pass" : "fail",
      detail: "Requires NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY.",
    },
    checkHttpStatus("Login route", input.http?.loginStatus, [200]),
    checkHttpStatus("Teacher analytics route", input.http?.analyticsStatus, [200, 307, 308]),
    {
      name: "Browser acceptance readiness",
      status: browserAcceptancePlan.status === "ready" ? "pass" : "blocked",
      detail:
        browserAcceptancePlan.status === "ready"
          ? `ready: ${browserAcceptancePlan.steps.length} browser acceptance steps configured.`
          : `blocked: missing config ${browserAcceptancePlan.missingConfig.join(", ")}.`,
    },
  ];

  if (!canCheckSupabase || !input.supabase) {
    checks.push({
      name: "Supabase remote tables",
      status: "skip",
      detail: "Set Supabase URL and service role key to check remote tables.",
    });
    return checks;
  }

  const tablesReady =
    input.supabase.coursewareRevisions &&
    input.supabase.studentCoursewareFeedback &&
    input.supabase.teacherReviewTasks;
  checks.push({
    name: "Supabase remote tables",
    status: tablesReady ? "pass" : "fail",
    detail: tablesReady
      ? "Required feedback loop tables are queryable."
      : "Missing courseware_revisions, student_courseware_feedback or teacher_review task support.",
  });

  return checks;
}

export function formatFeedbackLoopPreflightSummary(
  checks: FeedbackLoopPreflightCheck[]
) {
  const passed = checks.filter((check) => check.status === "pass").length;
  const failed = checks.filter((check) => check.status === "fail").length;
  const skipped = checks.filter((check) => check.status === "skip").length;
  const blocked = checks.filter((check) => check.status === "blocked").length;
  const blockedText = blocked > 0 ? `, ${blocked} blocked` : "";
  return `${passed} passed, ${failed} failed, ${skipped} skipped${blockedText}`;
}
