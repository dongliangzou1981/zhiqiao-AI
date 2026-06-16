-- 知桥 AI：学生基础练习作答记录 MVP
-- 目标：围绕 knowledge_point_code 记录学生是否完成、是否正确、错误原因和练习时间。

create table if not exists public.student_practice_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  courseware_id uuid null references public.coursewares (id) on delete set null,
  knowledge_point_code text not null,
  knowledge_point_name text not null,
  practice_item_index integer not null,
  question text not null,
  expected_answer text not null,
  student_answer text not null,
  is_correct boolean not null,
  error_reason text null,
  difficulty text not null,
  created_at timestamptz not null default now(),

  constraint student_practice_records_kp_code_not_empty check (char_length(trim(knowledge_point_code)) > 0),
  constraint student_practice_records_kp_name_not_empty check (char_length(trim(knowledge_point_name)) > 0),
  constraint student_practice_records_question_not_empty check (char_length(trim(question)) > 0),
  constraint student_practice_records_expected_answer_not_empty check (char_length(trim(expected_answer)) > 0),
  constraint student_practice_records_student_answer_not_empty check (char_length(trim(student_answer)) > 0),
  constraint student_practice_records_difficulty_not_empty check (char_length(trim(difficulty)) > 0),
  constraint student_practice_records_item_index_non_negative check (practice_item_index >= 0)
);

comment on table public.student_practice_records is '学生围绕知识点完成基础练习的作答记录，用于后续掌握度与复习任务';

create index if not exists student_practice_records_user_id_created_at_idx
  on public.student_practice_records (user_id, created_at desc);

create index if not exists student_practice_records_user_kp_created_at_idx
  on public.student_practice_records (user_id, knowledge_point_code, created_at desc);

alter table public.student_practice_records enable row level security;

drop policy if exists "student_practice_records_student_select_own" on public.student_practice_records;
drop policy if exists "student_practice_records_student_insert_own" on public.student_practice_records;

create policy "student_practice_records_student_select_own"
  on public.student_practice_records for select
  to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'student'
    )
  );

create policy "student_practice_records_student_insert_own"
  on public.student_practice_records for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'student'
    )
  );

grant select, insert on public.student_practice_records to authenticated;
