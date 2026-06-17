create table if not exists public.student_courseware_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  courseware_id uuid not null references public.coursewares (id) on delete cascade,
  knowledge_point_code text not null,
  knowledge_point_name text not null,
  understanding_level text not null,
  need_teacher_help boolean not null default false,
  feedback_text text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint student_courseware_feedback_unique unique (user_id, courseware_id),
  constraint student_courseware_feedback_kp_code_not_empty check (char_length(trim(knowledge_point_code)) > 0),
  constraint student_courseware_feedback_kp_name_not_empty check (char_length(trim(knowledge_point_name)) > 0),
  constraint student_courseware_feedback_level_valid check (
    understanding_level in ('understood', 'partly_understood', 'not_understood')
  )
);

comment on table public.student_courseware_feedback is '学生课件理解反馈，记录是否看懂以及是否需要老师跟进';

create index if not exists student_courseware_feedback_user_updated_idx
  on public.student_courseware_feedback (user_id, updated_at desc);

create index if not exists student_courseware_feedback_courseware_id_idx
  on public.student_courseware_feedback (courseware_id);

create index if not exists student_courseware_feedback_knowledge_point_code_idx
  on public.student_courseware_feedback (knowledge_point_code);

alter table public.student_courseware_feedback enable row level security;

drop policy if exists "student_courseware_feedback_student_select_own" on public.student_courseware_feedback;
drop policy if exists "student_courseware_feedback_student_insert_own" on public.student_courseware_feedback;
drop policy if exists "student_courseware_feedback_student_update_own" on public.student_courseware_feedback;
drop policy if exists "student_courseware_feedback_teacher_select_linked" on public.student_courseware_feedback;

create policy "student_courseware_feedback_student_select_own"
  on public.student_courseware_feedback for select
  to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'student'
    )
  );

create policy "student_courseware_feedback_teacher_select_linked"
  on public.student_courseware_feedback for select
  to authenticated
  using (
    exists (
      select 1 from public.teacher_student_links l
      where l.teacher_id = auth.uid()
        and l.student_id = student_courseware_feedback.user_id
    )
    and private.is_teacher(auth.uid())
  );

create policy "student_courseware_feedback_student_insert_own"
  on public.student_courseware_feedback for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'student'
    )
  );

create policy "student_courseware_feedback_student_update_own"
  on public.student_courseware_feedback for update
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

revoke all on public.student_courseware_feedback from anon, authenticated;
grant select, insert on public.student_courseware_feedback to authenticated;
grant update (
  understanding_level,
  need_teacher_help,
  feedback_text,
  updated_at
) on public.student_courseware_feedback to authenticated;
