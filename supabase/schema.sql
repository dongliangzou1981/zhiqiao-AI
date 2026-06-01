-- =============================================================================
-- 知桥 AI · Supabase / PostgreSQL 数据库 Schema (V1)
-- =============================================================================
-- 在 Supabase SQL Editor 中执行，或通过 supabase db push 应用。
-- RLS 策略见文件末尾注释，V1 尚未启用，接入 Auth 后再开启。
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('teacher', 'student');
exception
  when duplicate_object then null;
end $$;

-- -----------------------------------------------------------------------------
-- 1. profiles — 用户档案（与 auth.users 一对一）
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null,
  display_name text not null,
  created_at timestamptz not null default now(),

  constraint profiles_display_name_not_empty check (char_length(trim(display_name)) > 0)
);

comment on table public.profiles is '用户档案：教师 / 学生角色与显示名';
comment on column public.profiles.id is '与 Supabase Auth user id 相同';
comment on column public.profiles.role is 'teacher | student';

create index if not exists profiles_role_idx on public.profiles (role);

-- -----------------------------------------------------------------------------
-- 2. lesson_plans — AI 教案历史
-- -----------------------------------------------------------------------------
create table if not exists public.lesson_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  knowledge_point_code text not null,
  knowledge_point_name text not null,
  content text not null,
  created_at timestamptz not null default now(),

  constraint lesson_plans_kp_code_not_empty check (char_length(trim(knowledge_point_code)) > 0),
  constraint lesson_plans_kp_name_not_empty check (char_length(trim(knowledge_point_name)) > 0),
  constraint lesson_plans_content_not_empty check (char_length(trim(content)) > 0)
);

comment on table public.lesson_plans is '教师生成的教案记录（Markdown 正文存于 content）';

create index if not exists lesson_plans_user_id_created_at_idx
  on public.lesson_plans (user_id, created_at desc);

create index if not exists lesson_plans_knowledge_point_code_idx
  on public.lesson_plans (knowledge_point_code);

-- -----------------------------------------------------------------------------
-- 3. qa_records — 学生答疑记录
-- -----------------------------------------------------------------------------
create table if not exists public.qa_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  question text not null,
  answer text not null,
  created_at timestamptz not null default now(),

  constraint qa_records_question_not_empty check (char_length(trim(question)) > 0),
  constraint qa_records_answer_not_empty check (char_length(trim(answer)) > 0)
);

comment on table public.qa_records is '学生学习答疑问答记录';

create index if not exists qa_records_user_id_created_at_idx
  on public.qa_records (user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- 4. knowledge_points — 知识点目录（可替代/补充本地 JSON）
-- -----------------------------------------------------------------------------
create table if not exists public.knowledge_points (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  description text not null,
  subject text not null,
  grade text not null,
  semester text not null,
  chapter text not null,

  constraint knowledge_points_code_not_empty check (char_length(trim(code)) > 0),
  constraint knowledge_points_name_not_empty check (char_length(trim(name)) > 0),
  constraint knowledge_points_unique_code unique (code)
);

comment on table public.knowledge_points is '教材知识点主数据';
comment on column public.knowledge_points.code is '如 J-MATH-RJ-71-01-01';

create index if not exists knowledge_points_subject_grade_semester_idx
  on public.knowledge_points (subject, grade, semester);

create index if not exists knowledge_points_chapter_idx
  on public.knowledge_points (chapter);

-- -----------------------------------------------------------------------------
-- 注册新用户时自动创建 profile（可选，接入 Auth 时启用）
-- -----------------------------------------------------------------------------
-- create or replace function public.handle_new_user()
-- returns trigger
-- language plpgsql
-- security definer
-- set search_path = public
-- as $$
-- begin
--   insert into public.profiles (id, role, display_name)
--   values (
--     new.id,
--     coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'student'),
--     coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), '新用户')
--   );
--   return new;
-- end;
-- $$;
--
-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute function public.handle_new_user();

-- =============================================================================
-- Row Level Security (RLS) — 未来策略说明（V1 未启用）
-- =============================================================================
--
-- 启用方式（接入 Supabase Auth 后）：
--   alter table public.<table> enable row level security;
--
-- --- profiles ---
--   · SELECT：用户仅能读取自己的 profile (auth.uid() = id)
--   · UPDATE：用户仅能更新自己的 display_name（role 建议仅 service_role 可改）
--   · INSERT：由 trigger handle_new_user 以 security definer 创建
--
-- --- lesson_plans ---
--   · SELECT / INSERT / DELETE：仅 role = teacher 且 user_id = auth.uid()
--   · 学生角色无访问权限
--
-- --- qa_records ---
--   · SELECT / INSERT：仅 role = student 且 user_id = auth.uid()
--   · 教师若需学情分析，可后续增加只读聚合视图 + 单独策略
--
-- --- knowledge_points ---
--   · SELECT：authenticated 用户均可读（教师、学生共用目录）
--   · INSERT / UPDATE / DELETE：仅 service_role 或 admin 角色（后台维护教材）
--
-- 示例策略骨架：
--
--   create policy "profiles_select_own"
--     on public.profiles for select
--     using (auth.uid() = id);
--
--   create policy "lesson_plans_teacher_own"
--     on public.lesson_plans for all
--     using (
--       auth.uid() = user_id
--       and exists (
--         select 1 from public.profiles p
--         where p.id = auth.uid() and p.role = 'teacher'
--       )
--     );
--
--   create policy "qa_records_student_own"
--     on public.qa_records for all
--     using (
--       auth.uid() = user_id
--       and exists (
--         select 1 from public.profiles p
--         where p.id = auth.uid() and p.role = 'student'
--       )
--     );
--
--   create policy "knowledge_points_read_authenticated"
--     on public.knowledge_points for select
--     to authenticated
--     using (true);
--
-- =============================================================================
