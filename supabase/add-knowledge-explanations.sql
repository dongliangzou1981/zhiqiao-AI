-- =============================================================================
-- 知桥 AI · 增量 SQL：新增 knowledge_explanations 表
-- =============================================================================
-- 用途：
-- 在已有 Supabase 项目中执行，为 P2 知识点讲解生成增加落库表与 RLS。
-- =============================================================================

create extension if not exists "pgcrypto";

create table if not exists public.knowledge_explanations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  knowledge_point_code text not null,
  knowledge_point_name text not null,
  content text not null,
  created_at timestamptz not null default now(),

  constraint knowledge_explanations_kp_code_not_empty check (char_length(trim(knowledge_point_code)) > 0),
  constraint knowledge_explanations_kp_name_not_empty check (char_length(trim(knowledge_point_name)) > 0),
  constraint knowledge_explanations_content_not_empty check (char_length(trim(content)) > 0)
);

comment on table public.knowledge_explanations is '教师或学生生成的 AI 知识点讲解记录（Markdown 正文存于 content）';

create index if not exists knowledge_explanations_user_id_created_at_idx
  on public.knowledge_explanations (user_id, created_at desc);

create index if not exists knowledge_explanations_knowledge_point_code_idx
  on public.knowledge_explanations (knowledge_point_code);

alter table public.knowledge_explanations enable row level security;

drop policy if exists "knowledge_explanations_select_own" on public.knowledge_explanations;
drop policy if exists "knowledge_explanations_insert_own" on public.knowledge_explanations;

create policy "knowledge_explanations_select_own"
  on public.knowledge_explanations for select
  to authenticated
  using (auth.uid() = user_id);

create policy "knowledge_explanations_insert_own"
  on public.knowledge_explanations for insert
  to authenticated
  with check (auth.uid() = user_id);

grant usage on schema public to authenticated;
grant select, insert on public.knowledge_explanations to authenticated;
