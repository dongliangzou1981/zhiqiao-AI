/**
 * 教案历史 · 浏览器 localStorage
 * 仅在客户端组件中调用（函数内已做 typeof window 判断）。
 */

export type LessonHistoryRecord = {
  id: string;
  knowledgePointCode: string;
  knowledgePointName: string;
  createdAt: string;
  content: string;
};

const STORAGE_KEY = "zhiqiao-lesson-history";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function sortNewestFirst(records: LessonHistoryRecord[]): LessonHistoryRecord[] {
  return [...records].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function readAll(): LessonHistoryRecord[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidRecord);
  } catch {
    return [];
  }
}

function isValidRecord(value: unknown): value is LessonHistoryRecord {
  if (!value || typeof value !== "object") return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.knowledgePointCode === "string" &&
    typeof r.knowledgePointName === "string" &&
    typeof r.createdAt === "string" &&
    typeof r.content === "string"
  );
}

function writeAll(records: LessonHistoryRecord[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

/** 读取全部历史记录（最新在前） */
export function getLessonHistory(): LessonHistoryRecord[] {
  return sortNewestFirst(readAll());
}

/** 按 id 查询单条记录 */
export function getLessonHistoryById(id: string): LessonHistoryRecord | undefined {
  return getLessonHistory().find((r) => r.id === id);
}

/** 保存一条历史（插入到列表最前） */
export function saveLessonHistory(record: LessonHistoryRecord): void {
  if (!isBrowser()) return;
  const existing = readAll();
  writeAll([record, ...existing.filter((r) => r.id !== record.id)]);
}

/** 清空全部历史 */
export function clearLessonHistory(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}

/** 生成唯一 id（客户端） */
export function createLessonHistoryId(): string {
  return `lh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
