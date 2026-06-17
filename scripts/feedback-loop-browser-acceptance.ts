import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  buildFeedbackLoopBrowserAcceptancePlan,
  formatFeedbackLoopBrowserAcceptanceSummary,
  type FeedbackLoopBrowserAcceptanceStep,
} from "../lib/feedback-loop-browser-acceptance";

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

function printStep(index: number, step: FeedbackLoopBrowserAcceptanceStep) {
  const writeLabel = step.writesData ? "writes data" : "read only";
  console.log(`${index}. [${step.actor}] ${step.name} (${writeLabel})`);
  console.log(`   URL: ${step.url}`);
  console.log(`   Action: ${step.action}`);
  console.log(`   Expected: ${step.expected}`);
  console.log(`   Evidence: ${step.evidence}`);
}

function main() {
  const plan = buildFeedbackLoopBrowserAcceptancePlan({ env: loadEnv() });

  console.log(`Feedback loop browser acceptance: ${formatFeedbackLoopBrowserAcceptanceSummary(plan)}`);

  if (plan.status === "blocked") {
    console.log(plan.blocker);
    console.log(`Missing config: ${plan.missingConfig.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  console.log(`App URL: ${plan.appUrl}`);
  console.log(`Teacher account: ${plan.teacherEmail}`);
  console.log(`Student account: ${plan.studentEmail}`);
  console.log(`Courseware id: ${plan.coursewareId}`);
  console.log(`Knowledge point: ${plan.knowledgePointCode}`);
  console.log(`Feedback text: ${plan.feedbackText}`);
  plan.steps.forEach((step, index) => printStep(index + 1, step));
}

main();
