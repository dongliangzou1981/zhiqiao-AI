# 知桥 AI 数据库设计（Supabase / PostgreSQL）

## 概述

V1 使用 Supabase 托管 PostgreSQL。表结构定义见 [`supabase/schema.sql`](../supabase/schema.sql)。

当前 Next.js 应用仍使用本地数据（`data/junior-math.ts`、`localStorage` 教案历史）。接入 Supabase Auth 与 API 后，将迁移至本 Schema。

## ER 关系（简图）

```
auth.users (Supabase Auth)
    │
    └── 1:1 ── profiles
                  │
                  ├── 1:N ── lesson_plans   (教师)
                  └── 1:N ── qa_records     (学生)

knowledge_points  (独立主数据，供教案/答疑引用 code)
```

## 表说明

### 1. `profiles`

用户档案，与 `auth.users.id` 一对一。

| 列 | 类型 | 说明 |
|----|------|------|
| `id` | `uuid` PK, FK → `auth.users` | 用户 ID |
| `role` | `user_role` enum | `teacher` \| `student` |
| `display_name` | `text` | 显示名称 |
| `created_at` | `timestamptz` | 创建时间 |

**索引：** `profiles_role_idx (role)`

---

### 2. `lesson_plans`

教师通过 AI 生成的教案历史。

| 列 | 类型 | 说明 |
|----|------|------|
| `id` | `uuid` PK | 记录 ID |
| `user_id` | `uuid` FK → `profiles` | 教师用户 |
| `knowledge_point_code` | `text` | 知识点编码，如 `J-MATH-RJ-71-01-01` |
| `knowledge_point_name` | `text` | 知识点名称 |
| `content` | `text` | 教案正文（Markdown） |
| `created_at` | `timestamptz` | 创建时间 |

**索引：**

- `lesson_plans_user_id_created_at_idx (user_id, created_at desc)` — 教师历史列表
- `lesson_plans_knowledge_point_code_idx (knowledge_point_code)` — 按知识点检索

**对应应用：** `/teacher/lesson-generator`、`/teacher/lesson-history`（当前为 localStorage）

---

### 3. `qa_records`

学生学习答疑记录。

| 列 | 类型 | 说明 |
|----|------|------|
| `id` | `uuid` PK | 记录 ID |
| `user_id` | `uuid` FK → `profiles` | 学生用户 |
| `question` | `text` | 学生提问 |
| `answer` | `text` | AI 回答（Markdown） |
| `created_at` | `timestamptz` | 创建时间 |

**索引：**

- `qa_records_user_id_created_at_idx (user_id, created_at desc)` — 学生答疑历史

**对应应用：** `/student/qa`（当前仅会话内展示，未持久化）

---

### 4. `knowledge_points`

教材知识点主数据，可替代或同步 `data/junior-math.ts`。

| 列 | 类型 | 说明 |
|----|------|------|
| `id` | `uuid` PK | 内部 ID |
| `code` | `text` UNIQUE | 知识点编码 |
| `name` | `text` | 名称 |
| `description` | `text` | 课标/教学说明 |
| `subject` | `text` | 学科，如「数学」 |
| `grade` | `text` | 年级，如「七年级」 |
| `semester` | `text` | 学期，如「上册」 |
| `chapter` | `text` | 章节，如「有理数」 |

**索引：**

- `knowledge_points_unique_code` — 唯一约束（自动索引）
- `knowledge_points_subject_grade_semester_idx` — 级联选择器
- `knowledge_points_chapter_idx` — 按章筛选

**对应应用：** `/teacher/knowledge-base`、教案生成知识点下拉

## 枚举

| 类型 | 值 |
|------|-----|
| `user_role` | `teacher`, `student` |

## Row Level Security（RLS）

V1 **未在 schema 中启用 RLS**，仅在 `schema.sql` 末尾以注释记录未来策略方向：

| 表 | 策略要点 |
|----|----------|
| `profiles` | 用户仅读写自己的档案 |
| `lesson_plans` | 仅 `teacher` 且 `user_id = auth.uid()` |
| `qa_records` | 仅 `student` 且 `user_id = auth.uid()` |
| `knowledge_points` | 已登录用户可读；写操作仅管理员 / service role |

接入 Auth 后执行 `enable row level security` 并创建对应 policy。

## 部署

1. 在 [Supabase Dashboard](https://supabase.com/dashboard) 打开 SQL Editor  
2. 粘贴并执行 `supabase/schema.sql`  
3. 配置项目 `.env.local`：`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY` 等  

## 后续迁移清单（未实施）

- [ ] 启用 Supabase Auth 与 `handle_new_user` trigger  
- [ ] 教案历史：`lesson_plans` 替代 `localStorage`  
- [ ] 答疑：可选将每轮问答写入 `qa_records`  
- [ ] 种子脚本：将 `data/junior-math.ts` 导入 `knowledge_points`  
- [ ] 启用 RLS 并做端到端权限测试  
