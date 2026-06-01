"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
};

const SUGGESTED_QUESTIONS = [
  "负数与减号有什么区别？",
  "有理数加减法怎么去括号？",
  "为什么两个负数相乘得正数？",
];

const WELCOME_TEXT = `你好，我是知桥AI学习助手。

我可以帮你理清课本概念、梳理解题思路，并提醒常见易错点。请尽量说明学科和知识点，我会用清晰的方式分步讲解。

今天想先了解哪一部分？`;

const EXAMPLE_NEGATIVE_MINUS = `负数表示一个小于0的数，例如 -3。
减号表示运算符，例如 5 - 3 = 2。
虽然符号相同，但含义不同。`;

const CHAT_CONTAINER = "mx-auto w-full max-w-[900px] px-4";

function formatTime(date = new Date()) {
  return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createWelcomeMessage(): ChatMessage {
  return {
    id: "welcome",
    role: "assistant",
    content: WELCOME_TEXT,
    time: formatTime(),
  };
}

function generateMockResponse(question: string): string {
  const normalized = question.replace(/\s/g, "");

  if (
    (normalized.includes("负数") && normalized.includes("减号")) ||
    (normalized.includes("负数") && normalized.includes("负号")) ||
    (normalized.includes("负号") && normalized.includes("减号"))
  ) {
    return EXAMPLE_NEGATIVE_MINUS;
  }

  if (normalized.includes("去括号") || normalized.includes("括号")) {
    return `去括号时记住口诀：括号前是「+」，去括号不变号；括号前是「−」，去括号要变号。

例如：+(a + b) = a + b，-(a + b) = -a - b。

你可以先标出括号前的符号，再逐项检查每一项是否变号。`;
  }

  if (normalized.includes("负数") && normalized.includes("相乘")) {
    return `有理数乘法法则：同号得正，异号得负。

所以两个负数相乘：负 × 负 = 正。例如 (-2) × (-3) = 6。

建议用具体数字多算几组，体会规律后再记结论。`;
  }

  return `关于「${question.length > 20 ? `${question.slice(0, 20)}…` : question}」：

建议你先回顾课本中相关定义，把已知条件写下来；再判断是概念理解问题还是计算步骤问题。

如果是概念题，可以各举一个例子对比；如果是计算题，分步书写并验算。仍有疑问可以继续追问具体哪一步不理解。`;
}

function AssistantIcon() {
  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white"
      aria-hidden
    >
      桥
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <AssistantIcon />
      <div className="rounded-2xl rounded-bl-md border border-slate-200/80 bg-slate-100 px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="flex max-w-[80%] flex-col items-end">
          <div className="rounded-2xl rounded-br-md bg-teal-600 px-4 py-2.5 text-[15px] leading-relaxed text-white shadow-sm">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
          <time className="mt-1 px-1 text-[11px] text-slate-400" dateTime={message.time}>
            {message.time}
          </time>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end justify-start gap-2">
      <AssistantIcon />
      <div className="flex max-w-[80%] flex-col items-start">
        <span className="mb-1 px-1 text-xs font-medium text-slate-500">知桥AI</span>
        <div className="rounded-2xl rounded-bl-md border border-slate-200/80 bg-slate-100 px-4 py-2.5 text-[15px] leading-relaxed text-slate-800 shadow-sm">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        <time className="mt-1 px-1 text-[11px] text-slate-400" dateTime={message.time}>
          {message.time}
        </time>
      </div>
    </div>
  );
}

export function QaChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(() => [createWelcomeMessage()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const hasUserMessages = messages.some((m) => m.role === "user");

  const scrollToLatest = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  useLayoutEffect(() => {
    scrollToLatest();
  }, [messages, loading]);

  useEffect(() => {
    const t = window.setTimeout(scrollToLatest, 50);
    return () => window.clearTimeout(t);
  }, [messages, loading]);

  const sendMessage = (text: string) => {
    const question = text.trim();
    if (!question || loading) {
      if (!question) {
        setError("请输入你的问题");
        inputRef.current?.focus();
      }
      return;
    }

    setError(null);
    setInput("");

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: question,
      time: formatTime(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    window.setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: createId(),
        role: "assistant",
        content: generateMockResponse(question),
        time: formatTime(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setLoading(false);
    }, 800);
  };

  const handleSuggestedClick = (q: string) => {
    sendMessage(q);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!input.trim()) {
      setError("请输入你的问题");
      return;
    }
    sendMessage(input);
  };

  return (
    <div className="min-h-screen w-full bg-[#f7f7f8]">
      <header className="border-b border-slate-200/80 bg-white">
        <div className={`${CHAT_CONTAINER} flex h-14 items-center gap-3`}>
          <Link
            href="/student"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="返回学生学习中心"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-slate-900">知桥AI 学习答疑</h1>
            <p className="truncate text-xs text-slate-500">你的 K12 学习助手</p>
          </div>
        </div>
      </header>

      <main className={`${CHAT_CONTAINER} py-4`}>
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div
            ref={scrollRef}
            className="h-[min(520px,calc(100vh-15rem))] overflow-y-auto overflow-x-hidden px-4 py-4"
            role="log"
            aria-live="polite"
            aria-label="对话记录"
          >
            <div className="space-y-4">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {loading && <TypingIndicator />}
              <div ref={bottomRef} className="h-px shrink-0" aria-hidden />
            </div>
          </div>

          <div className="border-t border-slate-200/80 bg-white px-4 py-3">
            {!hasUserMessages && !loading && (
              <div className="mb-3">
                <p className="mb-2 text-xs text-slate-500">推荐问题</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      disabled={loading}
                      onClick={() => handleSuggestedClick(q)}
                      className="rounded-xl border border-slate-200 bg-[#f7f7f8] px-3 py-2 text-left text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <p className="mb-2 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <form
              onSubmit={handleSubmit}
              className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-[#f7f7f8] px-3 py-2 shadow-sm focus-within:border-teal-500/50 focus-within:ring-2 focus-within:ring-teal-500/15"
            >
              <label htmlFor="qa-input" className="sr-only">
                输入你的问题
              </label>
              <textarea
                id="qa-input"
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!loading && input.trim()) sendMessage(input);
                  }
                }}
                rows={1}
                placeholder="输入学习问题…"
                disabled={loading}
                className="max-h-32 min-h-[24px] flex-1 resize-none bg-transparent py-2 text-[15px] text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                aria-label="发送"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                </svg>
              </button>
            </form>

            <p className="mt-2 text-center text-[11px] text-slate-400">
              知桥AI 解答仅供参考，重要内容请以教材与老师讲解为准
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
