-- =============================================================================
-- 知桥 AI · 新增 AI 课件生成记录表
-- =============================================================================

create table if not exists public.coursewares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  knowledge_point_code text not null,
  knowledge_point_name text not null,
  subject text not null,
  grade text not null,
  semester text not null,
  chapter text not null,
  content_markdown text not null,
  content_json jsonb null,
  is_published boolean not null default false,
  published_at timestamptz null,
  created_at timestamptz not null default now(),

  constraint coursewares_kp_code_not_empty check (char_length(trim(knowledge_point_code)) > 0),
  constraint coursewares_kp_name_not_empty check (char_length(trim(knowledge_point_name)) > 0),
  constraint coursewares_subject_not_empty check (char_length(trim(subject)) > 0),
  constraint coursewares_grade_not_empty check (char_length(trim(grade)) > 0),
  constraint coursewares_semester_not_empty check (char_length(trim(semester)) > 0),
  constraint coursewares_chapter_not_empty check (char_length(trim(chapter)) > 0),
  constraint coursewares_content_markdown_not_empty check (char_length(trim(content_markdown)) > 0)
);

comment on table public.coursewares is '教师生成的 AI 课件记录（MVP 阶段 Markdown 正文存于 content_markdown，content_json 预留结构化课件）';

create index if not exists coursewares_user_id_created_at_idx
  on public.coursewares (user_id, created_at desc);

create index if not exists coursewares_knowledge_point_code_idx
  on public.coursewares (knowledge_point_code);

create index if not exists coursewares_published_learning_idx
  on public.coursewares (knowledge_point_code, created_at desc)
  where is_published = true and content_json is not null;

alter table public.coursewares enable row level security;

drop policy if exists "coursewares_teacher_select_own" on public.coursewares;
drop policy if exists "coursewares_teacher_insert_own" on public.coursewares;
drop policy if exists "coursewares_teacher_update_publish_own" on public.coursewares;
drop policy if exists "coursewares_student_select_learning" on public.coursewares;

create policy "coursewares_teacher_select_own"
  on public.coursewares for select
  to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'teacher'
    )
  );

create policy "coursewares_student_select_learning"
  on public.coursewares for select
  to authenticated
  using (
    is_published = true
    and
    content_json is not null
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'student'
    )
  );

create policy "coursewares_teacher_insert_own"
  on public.coursewares for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'teacher'
    )
  );

create policy "coursewares_teacher_update_publish_own"
  on public.coursewares for update
  to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'teacher'
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'teacher'
    )
  );

revoke all on public.coursewares from anon, authenticated;
grant select, insert on public.coursewares to authenticated;
grant update (is_published, published_at) on public.coursewares to authenticated;
