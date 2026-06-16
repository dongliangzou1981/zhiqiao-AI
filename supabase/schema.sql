-- =============================================================================
-- 知桥 AI · Supabase / PostgreSQL 数据库 Schema (V1)
-- =============================================================================
-- 在 Supabase SQL Editor 中执行，或通过 supabase db push 应用。
-- RLS 策略见文件末尾注释，V1 尚未启用，接入 Auth 后再开启。
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('teacher', 'student');
exception
  when duplicate_object then null;
end $$;

-- -----------------------------------------------------------------------------
-- 1. profiles — 用户档案（与 auth.users 一对一）
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null,
  display_name text not null,
  created_at timestamptz not null default now(),

  constraint profiles_display_name_not_empty check (char_length(trim(display_name)) > 0)
);

comment on table public.profiles is '用户档案：教师 / 学生角色与显示名';
comment on column public.profiles.id is '与 Supabase Auth user id 相同';
comment on column public.profiles.role is 'teacher | student';

create index if not exists profiles_role_idx on public.profiles (role);

-- -----------------------------------------------------------------------------
-- 2. lesson_plans — AI 教案历史
-- -----------------------------------------------------------------------------
create table if not exists public.lesson_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  knowledge_point_code text not null,
  knowledge_point_name text not null,
  content text not null,
  created_at timestamptz not null default now(),

  constraint lesson_plans_kp_code_not_empty check (char_length(trim(knowledge_point_code)) > 0),
  constraint lesson_plans_kp_name_not_empty check (char_length(trim(knowledge_point_name)) > 0),
  constraint lesson_plans_content_not_empty check (char_length(trim(content)) > 0)
);

comment on table public.lesson_plans is '教师生成的教案记录（Markdown 正文存于 content）';

create index if not exists lesson_plans_user_id_created_at_idx
  on public.lesson_plans (user_id, created_at desc);

create index if not exists lesson_plans_knowledge_point_code_idx
  on public.lesson_plans (knowledge_point_code);

-- -----------------------------------------------------------------------------
-- 3. qa_records — 学生答疑记录
-- -----------------------------------------------------------------------------
create table if not exists public.qa_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  question text not null,
  answer text not null,
  created_at timestamptz not null default now(),

  constraint qa_records_question_not_empty check (char_length(trim(question)) > 0),
  constraint qa_records_answer_not_empty check (char_length(trim(answer)) > 0)
);

comment on table public.qa_records is '学生学习答疑问答记录';

create index if not exists qa_records_user_id_created_at_idx
  on public.qa_records (user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- 4. knowledge_points — 知识点目录（可替代/补充本地 JSON）
-- -----------------------------------------------------------------------------
create table if not exists public.knowledge_points (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  description text not null,
  subject text not null,
  grade text not null,
  semester text not null,
  chapter text not null,

  constraint knowledge_points_code_not_empty check (char_length(trim(code)) > 0),
  constraint knowledge_points_name_not_empty check (char_length(trim(name)) > 0),
  constraint knowledge_points_unique_code unique (code)
);

comment on table public.knowledge_points is '教材知识点主数据';
comment on column public.knowledge_points.code is '如 J-MATH-RJ-71-01-01';

create index if not exists knowledge_points_subject_grade_semester_idx
  on public.knowledge_points (subject, grade, semester);

create index if not exists knowledge_points_chapter_idx
  on public.knowledge_points (chapter);

-- -----------------------------------------------------------------------------
-- 5. knowledge_explanations — AI 知识点讲解记录
-- -----------------------------------------------------------------------------
create table if not exists public.knowledge_explanations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  knowledge_point_code text not null,
  knowledge_point_name text not null,
  content text not null,
  created_at timestamptz not null default now(),

  constraint knowledge_explanations_kp_code_not_empty check (char_length(trim(knowledge_point_code)) > 0),
  constraint knowledge_explanations_kp_name_not_empty check (char_length(trim(knowledge_point_name)) > 0),
  constraint knowledge_explanations_content_not_empty check (char_length(trim(content)) > 0)
);

comment on table public.knowledge_explanations is '教师或学生生成的 AI 知识点讲解记录（Markdown 正文存于 content）';

create index if not exists knowledge_explanations_user_id_created_at_idx
  on public.knowledge_explanations (user_id, created_at desc);

create index if not exists knowledge_explanations_knowledge_point_code_idx
  on public.knowledge_explanations (knowledge_point_code);

-- -----------------------------------------------------------------------------
-- 6. coursewares — AI 课件生成记录
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 7. student_practice_records — 学生基础练习作答记录
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 8. student_review_tasks — 学生日/周复习任务
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 9. student_courseware_progress — 学生课件学习进度
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 10. student_knowledge_mastery — 学生知识点基础掌握信号
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 11. teacher_student_links — 教师可查看的学生范围
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 注册新用户时自动创建 profile（Auth → profiles）
-- -----------------------------------------------------------------------------
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

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role public.user_role := 'student';
begin
  if new.raw_user_meta_data->>'role' in ('teacher', 'student') then
    requested_role := (new.raw_user_meta_data->>'role')::public.user_role;
  end if;

  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    requested_role,
    coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), '新用户')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================
alter table public.profiles enable row level security;
alter table public.lesson_plans enable row level security;
alter table public.qa_records enable row level security;
alter table public.knowledge_points enable row level security;
alter table public.knowledge_explanations enable row level security;
alter table public.coursewares enable row level security;
alter table public.student_practice_records enable row level security;
alter table public.student_review_tasks enable row level security;
alter table public.student_courseware_progress enable row level security;
alter table public.student_knowledge_mastery enable row level security;
alter table public.teacher_student_links enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_teacher_select_linked_students" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own_display_name" on public.profiles;
drop policy if exists "lesson_plans_teacher_own" on public.lesson_plans;
drop policy if exists "qa_records_student_own" on public.qa_records;
drop policy if exists "knowledge_points_read_authenticated" on public.knowledge_points;
drop policy if exists "knowledge_explanations_select_own" on public.knowledge_explanations;
drop policy if exists "knowledge_explanations_insert_own" on public.knowledge_explanations;
drop policy if exists "coursewares_teacher_select_own" on public.coursewares;
drop policy if exists "coursewares_teacher_insert_own" on public.coursewares;
drop policy if exists "coursewares_teacher_update_publish_own" on public.coursewares;
drop policy if exists "coursewares_student_select_learning" on public.coursewares;
drop policy if exists "student_practice_records_student_select_own" on public.student_practice_records;
drop policy if exists "student_practice_records_teacher_select_linked" on public.student_practice_records;
drop policy if exists "student_practice_records_student_insert_own" on public.student_practice_records;
drop policy if exists "student_review_tasks_student_select_own" on public.student_review_tasks;
drop policy if exists "student_review_tasks_teacher_select_linked" on public.student_review_tasks;
drop policy if exists "student_review_tasks_student_insert_own" on public.student_review_tasks;
drop policy if exists "student_review_tasks_student_update_own" on public.student_review_tasks;
drop policy if exists "student_courseware_progress_student_select_own" on public.student_courseware_progress;
drop policy if exists "student_courseware_progress_student_insert_own" on public.student_courseware_progress;
drop policy if exists "student_courseware_progress_student_update_own" on public.student_courseware_progress;
drop policy if exists "student_courseware_progress_teacher_select_linked" on public.student_courseware_progress;
drop policy if exists "student_knowledge_mastery_student_select_own" on public.student_knowledge_mastery;
drop policy if exists "student_knowledge_mastery_teacher_select_linked" on public.student_knowledge_mastery;
drop policy if exists "student_knowledge_mastery_student_insert_own" on public.student_knowledge_mastery;
drop policy if exists "student_knowledge_mastery_student_update_own" on public.student_knowledge_mastery;
drop policy if exists "teacher_student_links_teacher_select_own" on public.teacher_student_links;
drop policy if exists "teacher_student_links_teacher_insert_own" on public.teacher_student_links;
drop policy if exists "teacher_student_links_teacher_delete_own" on public.teacher_student_links;

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

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "profiles_update_own_display_name"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "lesson_plans_teacher_own"
  on public.lesson_plans for all
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

create policy "qa_records_student_own"
  on public.qa_records for all
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

create policy "knowledge_points_read_authenticated"
  on public.knowledge_points for select
  to authenticated
  using (true);

create policy "knowledge_explanations_select_own"
  on public.knowledge_explanations for select
  to authenticated
  using (auth.uid() = user_id);

create policy "knowledge_explanations_insert_own"
  on public.knowledge_explanations for insert
  to authenticated
  with check (auth.uid() = user_id);

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

create policy "teacher_student_links_teacher_select_own"
  on public.teacher_student_links for select
  to authenticated
  using (
    teacher_id = auth.uid()
    and private.is_teacher(auth.uid())
  );

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

grant usage on schema public to anon, authenticated;
revoke all on public.profiles from anon, authenticated;
grant select, insert on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
grant select, insert, update, delete on public.lesson_plans to authenticated;
grant select, insert, update, delete on public.qa_records to authenticated;
grant select on public.knowledge_points to authenticated;
grant select, insert on public.knowledge_explanations to authenticated;
revoke all on public.coursewares from anon, authenticated;
grant select, insert on public.coursewares to authenticated;
grant update (content_json, is_published, published_at) on public.coursewares to authenticated;
grant select, insert on public.student_practice_records to authenticated;
grant select, insert on public.student_review_tasks to authenticated;
grant update (status, completed_at) on public.student_review_tasks to authenticated;
grant select, insert on public.student_courseware_progress to authenticated;
grant update (last_slide_index, slide_count, status, last_viewed_at, completed_at) on public.student_courseware_progress to authenticated;
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
grant select, insert, delete on public.teacher_student_links to authenticated;

-- 新 Supabase 项目可能需要在 Data API 设置中显式暴露 public schema 表。
-- 若 REST 查询返回表不可访问，先检查 Dashboard → Data API exposure 设置。
