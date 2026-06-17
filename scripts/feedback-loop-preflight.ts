import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  buildFeedbackLoopPreflightChecks,
  formatFeedbackLoopPreflightSummary,
  type FeedbackLoopPreflightCheck,
} from "../lib/feedback-loop-preflight";

function parseEnvFile(filePath: string) {
  if (!existsSync(filePath)) return {};

  return Object.fromEntries(
    readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        const key = line.slice(0, index).trim();
        const value = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
        return [key, value];
      })
  );
}

function loadEnv() {
  return {
    ...parseEnvFile(path.join(process.cwd(), ".env.local")),
    ...process.env,
  } as Record<string, string | undefined>;
}

async function getStatus(url: string) {
  try {
    const response = await fetch(url, { redirect: "manual" });
    return response.status;
  } catch {
    return undefined;
  }
}

async function canQueryTable(
  url: string,
  serviceRoleKey: string,
  table: string,
  columns: string
) {
  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await supabase.from(table).select(columns).limit(1);
  return !error;
}

function printCheck(check: FeedbackLoopPreflightCheck) {
  const prefix =
    check.status === "pass" ? "[PASS]" : check.status === "fail" ? "[FAIL]" : "[SKIP]";
  console.log(`${prefix} ${check.name}: ${check.detail}`);
}

async function main() {
  const env = loadEnv();
  const appUrl = env.FEEDBACK_LOOP_APP_URL || "http://127.0.0.1:3000";
  const loginStatus = await getStatus(`${appUrl}/auth/login`);
  const analyticsStatus = await getStatus(`${appUrl}/teacher/analytics`);
  const hasSupabaseUrl = Boolean(env.NEXT_PUBLIC_SUPABASE_URL?.trim());
  const hasServiceRole = Boolean(env.SUPABASE_SERVICE_ROLE_KEY?.trim());
  const supabase =
    hasSupabaseUrl && hasServiceRole
      ? {
          coursewareRevisions: await canQueryTable(
            env.NEXT_PUBLIC_SUPABASE_URL!,
            env.SUPABASE_SERVICE_ROLE_KEY!,
            "courseware_revisions",
            "id"
          ),
          studentCoursewareFeedback: await canQueryTable(
            env.NEXT_PUBLIC_SUPABASE_URL!,
            env.SUPABASE_SERVICE_ROLE_KEY!,
            "student_courseware_feedback",
            "id"
          ),
          teacherReviewTasks: await canQueryTable(
            env.NEXT_PUBLIC_SUPABASE_URL!,
            env.SUPABASE_SERVICE_ROLE_KEY!,
            "student_review_tasks",
            "id, task_type"
          ),
        }
      : undefined;

  const checks = buildFeedbackLoopPreflightChecks({
    env,
    docs: {
      acceptanceChecklist: existsSync(
        path.join(process.cwd(), "docs", "feedback-loop-acceptance-checklist.md")
      ),
      teacherTrialGuide: existsSync(
        path.join(process.cwd(), "docs", "teacher-trial-feedback-loop-guide.md")
      ),
    },
    http: {
      loginStatus,
      analyticsStatus,
    },
    supabase,
  });

  console.log(`Feedback loop preflight: ${formatFeedbackLoopPreflightSummary(checks)}`);
  checks.forEach(printCheck);

  if (checks.some((check) => check.status === "fail")) {
    process.exitCode = 1;
  }
}

void main();
