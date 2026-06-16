-- 知桥 AI：课件发布/取消发布 MVP
-- 目标：教师显式发布后，学生端才能读取结构化课件学习资源。

alter table public.coursewares
  add column if not exists is_published boolean not null default false,
  add column if not exists published_at timestamptz null;

create index if not exists coursewares_published_learning_idx
  on public.coursewares (knowledge_point_code, created_at desc)
  where is_published = true and content_json is not null;

drop policy if exists "coursewares_teacher_update_publish_own" on public.coursewares;
drop policy if exists "coursewares_student_select_learning" on public.coursewares;

create policy "coursewares_student_select_learning"
  on public.coursewares for select
  to authenticated
  using (
    is_published = true
    and content_json is not null
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'student'
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

grant update (is_published, published_at) on public.coursewares to authenticated;
