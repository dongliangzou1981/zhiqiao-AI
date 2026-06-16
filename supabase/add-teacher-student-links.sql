-- P2 阶段7：教师端学习数据只读视图所需的教师-学生关联范围。
-- 目标：教师只能查看已显式关联学生的练习记录与复习任务，不开放全量学生数据。

create table if not exists public.teacher_student_links (
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),

  constraint teacher_student_links_pk primary key (teacher_id, student_id),
  constraint teacher_student_links_not_self check (teacher_id <> student_id)
);

comment on table public.teacher_student_links is '教师与学生的数据查看关系。P2阶段7用于限制教师只能查看已关联学生的学习数据';

create index if not exists teacher_student_links_student_id_idx
  on public.teacher_student_links (student_id);

alter table public.teacher_student_links enable row level security;
alter table public.profiles enable row level security;

create schema if not exists private;

create or replace function private.is_teacher(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = user_id and p.role = 'teacher'
  );
$$;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_teacher_select_linked_students" on public.profiles;
drop policy if exists "student_practice_records_teacher_select_linked" on public.student_practice_records;
drop policy if exists "student_review_tasks_teacher_select_linked" on public.student_review_tasks;
drop policy if exists "teacher_student_links_teacher_select_own" on public.teacher_student_links;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "profiles_teacher_select_linked_students"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1 from public.teacher_student_links l
      where l.teacher_id = auth.uid()
        and l.student_id = profiles.id
    )
    and private.is_teacher(auth.uid())
  );

create policy "student_practice_records_teacher_select_linked"
  on public.student_practice_records for select
  to authenticated
  using (
    exists (
      select 1 from public.teacher_student_links l
      where l.teacher_id = auth.uid()
        and l.student_id = student_practice_records.user_id
    )
    and private.is_teacher(auth.uid())
  );

create policy "student_review_tasks_teacher_select_linked"
  on public.student_review_tasks for select
  to authenticated
  using (
    exists (
      select 1 from public.teacher_student_links l
      where l.teacher_id = auth.uid()
        and l.student_id = student_review_tasks.user_id
    )
    and private.is_teacher(auth.uid())
  );

create policy "teacher_student_links_teacher_select_own"
  on public.teacher_student_links for select
  to authenticated
  using (
    teacher_id = auth.uid()
    and private.is_teacher(auth.uid())
  );

grant select on public.teacher_student_links to authenticated;

revoke all on public.profiles from anon, authenticated;
grant select, insert on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
