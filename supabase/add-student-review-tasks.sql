-- 知桥 AI：学生日/周复习任务 MVP
-- 目标：基于基础练习记录生成轻量复习任务，先用简单规则跑通闭环。

create table if not exists public.student_review_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  source_practice_record_id uuid null references public.student_practice_records (id) on delete set null,
  knowledge_point_code text not null,
  knowledge_point_name text not null,
  task_type text not null,
  status text not null default 'pending',
  due_date date not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz null,

  constraint student_review_tasks_kp_code_not_empty check (char_length(trim(knowledge_point_code)) > 0),
  constraint student_review_tasks_kp_name_not_empty check (char_length(trim(knowledge_point_name)) > 0),
  constraint student_review_tasks_task_type_valid check (task_type in ('mistake_review', 'weekly_review')),
  constraint student_review_tasks_status_valid check (status in ('pending', 'completed'))
);

comment on table public.student_review_tasks is '学生日/周复习任务，基于基础练习记录生成';

create unique index if not exists student_review_tasks_source_type_unique_idx
  on public.student_review_tasks (source_practice_record_id, task_type)
  where source_practice_record_id is not null;

create index if not exists student_review_tasks_user_due_status_idx
  on public.student_review_tasks (user_id, status, due_date);

alter table public.student_review_tasks enable row level security;

drop policy if exists "student_review_tasks_student_select_own" on public.student_review_tasks;
drop policy if exists "student_review_tasks_student_insert_own" on public.student_review_tasks;
drop policy if exists "student_review_tasks_student_update_own" on public.student_review_tasks;

create policy "student_review_tasks_student_select_own"
  on public.student_review_tasks for select
  to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'student'
    )
  );

create policy "student_review_tasks_student_insert_own"
  on public.student_review_tasks for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'student'
    )
  );

create policy "student_review_tasks_student_update_own"
  on public.student_review_tasks for update
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

grant select, insert on public.student_review_tasks to authenticated;
grant update (status, completed_at) on public.student_review_tasks to authenticated;
