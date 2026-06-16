create table if not exists public.student_knowledge_mastery (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  knowledge_point_code text not null,
  knowledge_point_name text not null,
  courseware_opened_count integer not null default 0,
  courseware_completed_count integer not null default 0,
  practice_attempts integer not null default 0,
  correct_attempts integer not null default 0,
  wrong_attempts integer not null default 0,
  accuracy integer not null default 0,
  pending_review_count integer not null default 0,
  completed_review_count integer not null default 0,
  mastery_score integer not null default 0,
  mastery_level text not null default 'needs_work',
  reasons jsonb not null default '[]'::jsonb,
  last_activity_at timestamptz null,
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint student_knowledge_mastery_unique unique (user_id, knowledge_point_code),
  constraint student_knowledge_mastery_kp_code_not_empty check (char_length(trim(knowledge_point_code)) > 0),
  constraint student_knowledge_mastery_kp_name_not_empty check (char_length(trim(knowledge_point_name)) > 0),
  constraint student_knowledge_mastery_counts_non_negative check (
    courseware_opened_count >= 0
    and courseware_completed_count >= 0
    and practice_attempts >= 0
    and correct_attempts >= 0
    and wrong_attempts >= 0
    and pending_review_count >= 0
    and completed_review_count >= 0
  ),
  constraint student_knowledge_mastery_accuracy_valid check (accuracy between 0 and 100),
  constraint student_knowledge_mastery_score_valid check (mastery_score between 0 and 100),
  constraint student_knowledge_mastery_level_valid check (mastery_level in ('needs_work', 'basic', 'stable'))
);

comment on table public.student_knowledge_mastery is '学生-知识点基础掌握信号，基于课件学习、练习记录和复习任务生成';

create index if not exists student_knowledge_mastery_user_level_idx
  on public.student_knowledge_mastery (user_id, mastery_level, mastery_score asc);

create index if not exists student_knowledge_mastery_knowledge_point_code_idx
  on public.student_knowledge_mastery (knowledge_point_code);

alter table public.student_knowledge_mastery enable row level security;

drop policy if exists "student_knowledge_mastery_student_select_own" on public.student_knowledge_mastery;
drop policy if exists "student_knowledge_mastery_teacher_select_linked" on public.student_knowledge_mastery;
drop policy if exists "student_knowledge_mastery_student_insert_own" on public.student_knowledge_mastery;
drop policy if exists "student_knowledge_mastery_student_update_own" on public.student_knowledge_mastery;

create policy "student_knowledge_mastery_student_select_own"
  on public.student_knowledge_mastery for select
  to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'student'
    )
  );

create policy "student_knowledge_mastery_teacher_select_linked"
  on public.student_knowledge_mastery for select
  to authenticated
  using (
    exists (
      select 1 from public.teacher_student_links l
      where l.teacher_id = auth.uid()
        and l.student_id = student_knowledge_mastery.user_id
    )
    and private.is_teacher(auth.uid())
  );

create policy "student_knowledge_mastery_student_insert_own"
  on public.student_knowledge_mastery for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'student'
    )
  );

create policy "student_knowledge_mastery_student_update_own"
  on public.student_knowledge_mastery for update
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

grant select, insert on public.student_knowledge_mastery to authenticated;
grant update (
  knowledge_point_name,
  courseware_opened_count,
  courseware_completed_count,
  practice_attempts,
  correct_attempts,
  wrong_attempts,
  accuracy,
  pending_review_count,
  completed_review_count,
  mastery_score,
  mastery_level,
  reasons,
  last_activity_at,
  calculated_at,
  updated_at
) on public.student_knowledge_mastery to authenticated;
