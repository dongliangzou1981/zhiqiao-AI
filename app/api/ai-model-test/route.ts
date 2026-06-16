import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth/profile";
import { AI_TASKS, getAIClient, getAIModelConfig, type AITask } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

type RequestBody = {
  prompt?: string;
  task?: string;
};

const DEFAULT_TEST_PROMPT =
  "请用一句中文说明你可以帮助初中数学老师把知识点讲清楚。只输出一句话。";

function isAITask(value: string | undefined): value is AITask {
  return Boolean(value && AI_TASKS.includes(value as AITask));
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const profile = await getProfile(supabase, user.id);
    if (!profile || profile.role !== "teacher") {
      return NextResponse.json({ error: "仅教师账号可查看模型配置" }, { status: 403 });
    }

    return NextResponse.json({
      config: getAIModelConfig(),
      tasks: AI_TASKS.map((task) => ({
        task,
        config: getAIModelConfig(task),
      })),
    });
  } catch (error) {
    console.error("[ai-model-test:get]", error);
    return NextResponse.json({ error: "读取模型配置失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const profile = await getProfile(supabase, user.id);
    if (!profile || profile.role !== "teacher") {
      return NextResponse.json({ error: "仅教师账号可测试模型" }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as RequestBody;
    const prompt = body.prompt?.trim() || DEFAULT_TEST_PROMPT;
    const task = isAITask(body.task) ? body.task : undefined;
    const config = getAIModelConfig(task);
    const client = await getAIClient();

    const response = await client.chat.completions.create({
      model: config.model,
      messages: [
        {
          role: "system",
          content: "你是知桥AI的模型连通性测试助手。回答必须简短、中文、可读。",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 120,
    });

    const output = response.choices[0]?.message?.content?.trim();
    if (!output) {
      throw new Error("AI model returned an empty test response");
    }

    return NextResponse.json({ config, output, task: task ?? "default" });
  } catch (error) {
    console.error("[ai-model-test:post]", error);
    return NextResponse.json({ error: "模型测试失败" }, { status: 500 });
  }
}
