import { getDeepSeekClient, getDeepSeekModel } from "@/lib/deepseek";

export type GenerateStudentAnswerParams = {
  question: string;
};

function buildUserPrompt(question: string): string {
  return `学生问题：

${question.trim()}

请用 Markdown 格式作答。`;
}

const SYSTEM_PROMPT = `你是一位 K12 学习助手，面向中国初中生答疑解惑。

请遵守以下规则：
- 使用中文回答
- 分步骤讲解，层次清晰
- 鼓励理解思路，而非死记硬背
- 语言适合初中生阅读，亲切但不幼稚
- 若涉及数学，写出推理过程与关键算式，步骤完整
- 最后用「## 小结」做一两句话的简短总结

仅输出 Markdown 正文，不要多余寒暄。`;

/**
 * 调用 DeepSeek 生成学生答疑 Markdown。
 */
export async function generateStudentAnswer(
  params: GenerateStudentAnswerParams
): Promise<string> {
  const question = params.question?.trim();
  if (!question) {
    throw new Error("question is required");
  }

  const client = getDeepSeekClient();
  const model = getDeepSeekModel();

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(question) },
    ],
    temperature: 0.7,
  });

  const markdown = response.choices[0]?.message?.content?.trim();
  if (!markdown) {
    throw new Error("DeepSeek API returned an empty answer");
  }

  return markdown;
}
