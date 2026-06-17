begin;

alter table public.student_review_tasks
  drop constraint if exists student_review_tasks_task_type_valid;

alter table public.student_review_tasks
  add constraint student_review_tasks_task_type_valid
  check (task_type in ('mistake_review', 'weekly_review', 'teacher_review'));

alter table public.student_review_tasks enable row level security;

drop policy if exists "student_review_tasks_student_insert_own" on public.student_review_tasks;
drop policy if exists "student_review_tasks_teacher_insert_linked" on public.student_review_tasks;

create policy "student_review_tasks_student_insert_own"
  on public.student_review_tasks for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and task_type in ('mistake_review', 'weekly_review')
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'student'
    )
  );

create policy "student_review_tasks_teacher_insert_linked"
  on public.student_review_tasks for insert
  to authenticated
  with check (
    task_type = 'teacher_review'
    and source_practice_record_id is null
    and status = 'pending'
    and private.is_teacher(auth.uid())
    and exists (
      select 1 from public.teacher_student_links l
      where l.teacher_id = auth.uid()
        and l.student_id = student_review_tasks.user_id
    )
  );

grant select, insert on public.student_review_tasks to authenticated;
grant update (status, completed_at) on public.student_review_tasks to authenticated;

commit;
