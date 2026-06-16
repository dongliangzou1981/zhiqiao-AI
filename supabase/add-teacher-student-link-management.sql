-- P2 阶段8准备：教师端学生范围管理 MVP。
-- 目标：教师可以通过学生 ID 添加/移除自己的可查看学生范围。

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

create or replace function private.is_student(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = user_id and p.role = 'student'
  );
$$;

alter table public.teacher_student_links enable row level security;

drop policy if exists "teacher_student_links_teacher_insert_own" on public.teacher_student_links;
drop policy if exists "teacher_student_links_teacher_delete_own" on public.teacher_student_links;

create policy "teacher_student_links_teacher_insert_own"
  on public.teacher_student_links for insert
  to authenticated
  with check (
    teacher_id = auth.uid()
    and private.is_teacher(auth.uid())
    and private.is_student(student_id)
  );

create policy "teacher_student_links_teacher_delete_own"
  on public.teacher_student_links for delete
  to authenticated
  using (
    teacher_id = auth.uid()
    and private.is_teacher(auth.uid())
  );

grant select, insert, delete on public.teacher_student_links to authenticated;
