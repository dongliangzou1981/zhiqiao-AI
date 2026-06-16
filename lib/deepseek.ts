import OpenAI from "openai";
import { getAIClient, getAIModel } from "@/lib/ai";
import {
  generateLessonPlan,
  type GenerateLessonPlanParams,
} from "@/lib/lesson-plan";

export type { GenerateLessonPlanParams };
export { generateLessonPlan };

/** 兼容旧调用名：实际走统一 AI 模型网关。 */
export async function getDeepSeekClient(): Promise<OpenAI> {
  return getAIClient();
}

export function getDeepSeekModel(): string {
  return getAIModel();
}
