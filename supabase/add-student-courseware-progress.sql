create table if not exists public.student_courseware_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  courseware_id uuid not null references public.coursewares (id) on delete cascade,
  knowledge_point_code text not null,
  knowledge_point_name text not null,
  last_slide_index integer not null default 0,
  slide_count integer not null default 0,
  status text not null default 'in_progress',
  first_opened_at timestamptz not null default now(),
  last_viewed_at timestamptz not null default now(),
  completed_at timestamptz null,
  created_at timestamptz not null default now(),

  constraint student_courseware_progress_unique unique (user_id, courseware_id),
  constraint student_courseware_progress_kp_code_not_empty check (char_length(trim(knowledge_point_code)) > 0),
  constraint student_courseware_progress_kp_name_not_empty check (char_length(trim(knowledge_point_name)) > 0),
  constraint student_courseware_progress_status_valid check (status in ('in_progress', 'completed')),
  constraint student_courseware_progress_last_slide_index_valid check (last_slide_index >= 0),
  constraint student_courseware_progress_slide_count_valid check (slide_count >= 0)
);

comment on table public.student_courseware_progress is '学生课件学习进度，记录打开、最后浏览页和完成状态';

create index if not exists student_courseware_progress_user_status_idx
  on public.student_courseware_progress (user_id, status, last_viewed_at desc);

create index if not exists student_courseware_progress_courseware_id_idx
  on public.student_courseware_progress (courseware_id);

create index if not exists student_courseware_progress_knowledge_point_code_idx
  on public.student_courseware_progress (knowledge_point_code);

alter table public.student_courseware_progress enable row level security;

drop policy if exists "student_courseware_progress_student_select_own" on public.student_courseware_progress;
drop policy if exists "student_courseware_progress_student_insert_own" on public.student_courseware_progress;
drop policy if exists "student_courseware_progress_student_update_own" on public.student_courseware_progress;
drop policy if exists "student_courseware_progress_teacher_select_linked" on public.student_courseware_progress;

create policy "student_courseware_progress_student_select_own"
  on public.student_courseware_progress for select
  to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'student'
    )
  );

create policy "student_courseware_progress_teacher_select_linked"
  on public.student_courseware_progress for select
  to authenticated
  using (
    exists (
      select 1 from public.teacher_student_links l
      where l.teacher_id = auth.uid()
        and l.student_id = student_courseware_progress.user_id
    )
    and private.is_teacher(auth.uid())
  );

create policy "student_courseware_progress_student_insert_own"
  on public.student_courseware_progress for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'student'
    )
  );

create policy "student_courseware_progress_student_update_own"
  on public.student_courseware_progress for update
  to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'student'
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'student'
    )
  );

revoke all on public.student_courseware_progress from anon, authenticated;
grant select, insert on public.student_courseware_progress to authenticated;
grant update (last_slide_index, slide_count, status, last_viewed_at, completed_at) on public.student_courseware_progress to authenticated;
