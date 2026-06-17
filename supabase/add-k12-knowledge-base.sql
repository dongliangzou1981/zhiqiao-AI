-- =============================================================================
-- K12 教育知识库基础模块：课程标准、教材体系、知识点关系与小样本数据
-- 说明：现有 public.knowledge_points 已被教案、课件、学生学习等功能使用，
-- 本迁移采用兼容扩展，不重建或替换旧表。
-- =============================================================================

create extension if not exists "pgcrypto";

create table if not exists public.curriculum_standards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  stage text not null,
  version text not null,
  issued_by text,
  issued_year integer,
  description text,
  source_url text,
  created_at timestamptz not null default now(),
  constraint curriculum_standards_unique unique (name, stage, version),
  constraint curriculum_standards_name_not_empty check (char_length(trim(name)) > 0),
  constraint curriculum_standards_stage_not_empty check (char_length(trim(stage)) > 0),
  constraint curriculum_standards_version_not_empty check (char_length(trim(version)) > 0)
);

create table if not exists public.school_stages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  order_index integer not null,
  constraint school_stages_name_not_empty check (char_length(trim(name)) > 0),
  constraint school_stages_code_not_empty check (char_length(trim(code)) > 0)
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references public.school_stages (id) on delete restrict,
  name text not null,
  code text not null,
  description text,
  constraint subjects_stage_code_unique unique (stage_id, code),
  constraint subjects_name_not_empty check (char_length(trim(name)) > 0),
  constraint subjects_code_not_empty check (char_length(trim(code)) > 0)
);

create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references public.school_stages (id) on delete restrict,
  name text not null,
  code text not null unique,
  order_index integer not null,
  constraint grades_name_not_empty check (char_length(trim(name)) > 0),
  constraint grades_code_not_empty check (char_length(trim(code)) > 0)
);

create table if not exists public.textbook_versions (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects (id) on delete restrict,
  name text not null,
  publisher text,
  code text not null,
  description text,
  constraint textbook_versions_subject_code_unique unique (subject_id, code),
  constraint textbook_versions_name_not_empty check (char_length(trim(name)) > 0),
  constraint textbook_versions_code_not_empty check (char_length(trim(code)) > 0)
);

create table if not exists public.textbook_books (
  id uuid primary key default gen_random_uuid(),
  textbook_version_id uuid not null references public.textbook_versions (id) on delete cascade,
  grade_id uuid not null references public.grades (id) on delete restrict,
  name text not null,
  semester text,
  book_code text,
  description text,
  constraint textbook_books_version_book_code_unique unique (textbook_version_id, book_code),
  constraint textbook_books_name_not_empty check (char_length(trim(name)) > 0)
);

create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  textbook_book_id uuid not null references public.textbook_books (id) on delete cascade,
  parent_id uuid references public.chapters (id) on delete cascade,
  title text not null,
  chapter_code text,
  order_index integer,
  description text,
  constraint chapters_book_chapter_code_unique unique (textbook_book_id, chapter_code),
  constraint chapters_title_not_empty check (char_length(trim(title)) > 0)
);

alter table public.knowledge_points
  add column if not exists subject_id uuid references public.subjects (id) on delete set null,
  add column if not exists stage_id uuid references public.school_stages (id) on delete set null,
  add column if not exists grade_id uuid references public.grades (id) on delete set null,
  add column if not exists chapter_id uuid references public.chapters (id) on delete set null,
  add column if not exists summary text,
  add column if not exists curriculum_standard_id uuid references public.curriculum_standards (id) on delete set null,
  add column if not exists standard_reference text,
  add column if not exists core_competency text,
  add column if not exists learning_objective text,
  add column if not exists teaching_focus text,
  add column if not exists teaching_difficulty text,
  add column if not exists difficulty_level integer,
  add column if not exists importance_level integer,
  add column if not exists updated_at timestamptz default now();

create table if not exists public.knowledge_point_relations (
  id uuid primary key default gen_random_uuid(),
  source_knowledge_point_id uuid not null references public.knowledge_points (id) on delete cascade,
  target_knowledge_point_id uuid not null references public.knowledge_points (id) on delete cascade,
  relation_type text not null,
  description text,
  weight numeric,
  constraint knowledge_point_relations_unique unique (
    source_knowledge_point_id,
    target_knowledge_point_id,
    relation_type
  ),
  constraint knowledge_point_relations_type_valid check (
    relation_type in (
      'prerequisite',
      'next',
      'related',
      'includes',
      'part_of',
      'commonly_confused_with',
      'same_method',
      'same_question_type'
    )
  )
);

create table if not exists public.common_mistakes (
  id uuid primary key default gen_random_uuid(),
  knowledge_point_id uuid not null references public.knowledge_points (id) on delete cascade,
  mistake_type text not null,
  description text,
  example text,
  correction_strategy text,
  constraint common_mistakes_unique unique (knowledge_point_id, mistake_type),
  constraint common_mistakes_type_not_empty check (char_length(trim(mistake_type)) > 0)
);

create table if not exists public.question_bank (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references public.subjects (id) on delete set null,
  stage_id uuid references public.school_stages (id) on delete set null,
  grade_id uuid references public.grades (id) on delete set null,
  question_text text not null,
  question_type text,
  answer text,
  explanation text,
  difficulty_level integer,
  source_type text,
  created_at timestamptz not null default now(),
  constraint question_bank_question_text_unique unique (question_text),
  constraint question_bank_question_not_empty check (char_length(trim(question_text)) > 0)
);

create table if not exists public.question_knowledge_points (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.question_bank (id) on delete cascade,
  knowledge_point_id uuid not null references public.knowledge_points (id) on delete cascade,
  weight numeric,
  constraint question_knowledge_points_unique unique (question_id, knowledge_point_id)
);

create table if not exists public.teaching_resources (
  id uuid primary key default gen_random_uuid(),
  knowledge_point_id uuid not null references public.knowledge_points (id) on delete cascade,
  resource_type text,
  title text not null,
  content text,
  source_url text,
  source_name text,
  copyright_note text,
  created_at timestamptz not null default now(),
  constraint teaching_resources_title_not_empty check (char_length(trim(title)) > 0)
);

create table if not exists public.student_weakness_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  knowledge_point_id uuid not null references public.knowledge_points (id) on delete cascade,
  mastery_level numeric,
  mistake_count integer not null default 0,
  last_mistake_at timestamptz,
  suggested_review_strategy text,
  updated_at timestamptz not null default now(),
  constraint student_weakness_records_unique unique (student_id, knowledge_point_id),
  constraint student_weakness_records_mistake_count_valid check (mistake_count >= 0)
);

create index if not exists subjects_stage_id_idx on public.subjects (stage_id);
create index if not exists grades_stage_id_idx on public.grades (stage_id);
create index if not exists textbook_versions_subject_id_idx on public.textbook_versions (subject_id);
create index if not exists textbook_books_version_grade_idx on public.textbook_books (textbook_version_id, grade_id);
create index if not exists chapters_book_parent_idx on public.chapters (textbook_book_id, parent_id);
create index if not exists knowledge_points_k12_chapter_idx on public.knowledge_points (chapter_id, code);
create index if not exists knowledge_points_k12_subject_grade_idx on public.knowledge_points (subject_id, grade_id);
create index if not exists knowledge_point_relations_source_idx on public.knowledge_point_relations (source_knowledge_point_id);
create index if not exists knowledge_point_relations_target_idx on public.knowledge_point_relations (target_knowledge_point_id);
create index if not exists common_mistakes_knowledge_point_idx on public.common_mistakes (knowledge_point_id);
create index if not exists question_bank_subject_grade_idx on public.question_bank (subject_id, grade_id);
create index if not exists question_knowledge_points_kp_idx on public.question_knowledge_points (knowledge_point_id);
create index if not exists teaching_resources_knowledge_point_idx on public.teaching_resources (knowledge_point_id);
create index if not exists student_weakness_records_student_idx on public.student_weakness_records (student_id, updated_at desc);

alter table public.curriculum_standards enable row level security;
alter table public.school_stages enable row level security;
alter table public.subjects enable row level security;
alter table public.grades enable row level security;
alter table public.textbook_versions enable row level security;
alter table public.textbook_books enable row level security;
alter table public.chapters enable row level security;
alter table public.knowledge_point_relations enable row level security;
alter table public.common_mistakes enable row level security;
alter table public.question_bank enable row level security;
alter table public.question_knowledge_points enable row level security;
alter table public.teaching_resources enable row level security;
alter table public.student_weakness_records enable row level security;

drop policy if exists "k12_reference_authenticated_select" on public.curriculum_standards;
create policy "k12_reference_authenticated_select" on public.curriculum_standards
  for select to authenticated using (true);
drop policy if exists "school_stages_authenticated_select" on public.school_stages;
create policy "school_stages_authenticated_select" on public.school_stages
  for select to authenticated using (true);
drop policy if exists "subjects_authenticated_select" on public.subjects;
create policy "subjects_authenticated_select" on public.subjects
  for select to authenticated using (true);
drop policy if exists "grades_authenticated_select" on public.grades;
create policy "grades_authenticated_select" on public.grades
  for select to authenticated using (true);
drop policy if exists "textbook_versions_authenticated_select" on public.textbook_versions;
create policy "textbook_versions_authenticated_select" on public.textbook_versions
  for select to authenticated using (true);
drop policy if exists "textbook_books_authenticated_select" on public.textbook_books;
create policy "textbook_books_authenticated_select" on public.textbook_books
  for select to authenticated using (true);
drop policy if exists "chapters_authenticated_select" on public.chapters;
create policy "chapters_authenticated_select" on public.chapters
  for select to authenticated using (true);
drop policy if exists "knowledge_point_relations_authenticated_select" on public.knowledge_point_relations;
create policy "knowledge_point_relations_authenticated_select" on public.knowledge_point_relations
  for select to authenticated using (true);
drop policy if exists "common_mistakes_authenticated_select" on public.common_mistakes;
create policy "common_mistakes_authenticated_select" on public.common_mistakes
  for select to authenticated using (true);
drop policy if exists "question_bank_authenticated_select" on public.question_bank;
create policy "question_bank_authenticated_select" on public.question_bank
  for select to authenticated using (true);
drop policy if exists "question_knowledge_points_authenticated_select" on public.question_knowledge_points;
create policy "question_knowledge_points_authenticated_select" on public.question_knowledge_points
  for select to authenticated using (true);
drop policy if exists "teaching_resources_authenticated_select" on public.teaching_resources;
create policy "teaching_resources_authenticated_select" on public.teaching_resources
  for select to authenticated using (true);
drop policy if exists "student_weakness_records_student_select_own" on public.student_weakness_records;
create policy "student_weakness_records_student_select_own" on public.student_weakness_records
  for select to authenticated using (auth.uid() = student_id);
drop policy if exists "student_weakness_records_teacher_select_linked" on public.student_weakness_records;
create policy "student_weakness_records_teacher_select_linked" on public.student_weakness_records
  for select to authenticated using (
    exists (
      select 1 from public.teacher_student_links l
      where l.teacher_id = auth.uid()
        and l.student_id = student_weakness_records.student_id
    )
  );

grant select on public.curriculum_standards to authenticated;
grant select on public.school_stages to authenticated;
grant select on public.subjects to authenticated;
grant select on public.grades to authenticated;
grant select on public.textbook_versions to authenticated;
grant select on public.textbook_books to authenticated;
grant select on public.chapters to authenticated;
grant select on public.knowledge_point_relations to authenticated;
grant select on public.common_mistakes to authenticated;
grant select on public.question_bank to authenticated;
grant select on public.question_knowledge_points to authenticated;
grant select on public.teaching_resources to authenticated;
grant select on public.student_weakness_records to authenticated;

insert into public.curriculum_standards (
  name, stage, version, issued_by, issued_year, description, source_url
)
values (
  '义务教育课程标准',
  '义务教育',
  '2022年版',
  '教育部',
  2022,
  '用于约束 K12 知识库的课程目标、内容边界与核心素养表达。',
  null
)
on conflict (name, stage, version) do update
set issued_by = excluded.issued_by,
    issued_year = excluded.issued_year,
    description = excluded.description,
    source_url = excluded.source_url;

insert into public.school_stages (name, code, order_index)
values
  ('小学', 'primary', 1),
  ('初中', 'junior', 2),
  ('高中', 'senior', 3)
on conflict (code) do update
set name = excluded.name,
    order_index = excluded.order_index;

insert into public.grades (stage_id, name, code, order_index)
values
  ((select id from public.school_stages where code = 'primary'), '一年级', 'grade-1', 1),
  ((select id from public.school_stages where code = 'primary'), '二年级', 'grade-2', 2),
  ((select id from public.school_stages where code = 'primary'), '三年级', 'grade-3', 3),
  ((select id from public.school_stages where code = 'primary'), '四年级', 'grade-4', 4),
  ((select id from public.school_stages where code = 'primary'), '五年级', 'grade-5', 5),
  ((select id from public.school_stages where code = 'primary'), '六年级', 'grade-6', 6),
  ((select id from public.school_stages where code = 'junior'), '七年级', 'grade-7', 7),
  ((select id from public.school_stages where code = 'junior'), '八年级', 'grade-8', 8),
  ((select id from public.school_stages where code = 'junior'), '九年级', 'grade-9', 9),
  ((select id from public.school_stages where code = 'senior'), '高一', 'grade-10', 10),
  ((select id from public.school_stages where code = 'senior'), '高二', 'grade-11', 11),
  ((select id from public.school_stages where code = 'senior'), '高三', 'grade-12', 12)
on conflict (code) do update
set name = excluded.name,
    stage_id = excluded.stage_id,
    order_index = excluded.order_index;

insert into public.subjects (stage_id, name, code, description)
values (
  (select id from public.school_stages where code = 'junior'),
  '数学',
  'junior-math',
  '初中数学小样本，第一阶段只覆盖七年级上册基础知识点。'
)
on conflict (stage_id, code) do update
set name = excluded.name,
    description = excluded.description;

insert into public.textbook_versions (subject_id, name, publisher, code, description)
values (
  (select id from public.subjects where code = 'junior-math'),
  '人教版',
  '人民教育出版社',
  'rj',
  '初中数学人教版教材体系示例。'
)
on conflict (subject_id, code) do update
set name = excluded.name,
    publisher = excluded.publisher,
    description = excluded.description;

insert into public.textbook_books (
  textbook_version_id, grade_id, name, semester, book_code, description
)
values (
  (select id from public.textbook_versions where code = 'rj'),
  (select id from public.grades where code = 'grade-7'),
  '七年级上册',
  '上册',
  'rj-grade-7-a',
  '第一阶段 K12 知识库小样本册别。'
)
on conflict (textbook_version_id, book_code) do update
set grade_id = excluded.grade_id,
    name = excluded.name,
    semester = excluded.semester,
    description = excluded.description;

insert into public.chapters (textbook_book_id, title, chapter_code, order_index, description)
values
  ((select id from public.textbook_books where book_code = 'rj-grade-7-a'), '有理数', 'rj-7a-01', 1, '正负数、有理数、数轴、相反数、绝对值和有理数运算。'),
  ((select id from public.textbook_books where book_code = 'rj-grade-7-a'), '整式', 'rj-7a-02', 2, '用字母表示数、代数式、整式及其加减。'),
  ((select id from public.textbook_books where book_code = 'rj-grade-7-a'), '一元一次方程', 'rj-7a-03', 3, '方程概念、等式性质和一元一次方程解法。')
on conflict (textbook_book_id, chapter_code) do update
set title = excluded.title,
    order_index = excluded.order_index,
    description = excluded.description;

insert into public.knowledge_points (
  code, name, description, subject, grade, semester, chapter,
  subject_id, stage_id, grade_id, chapter_id, summary, curriculum_standard_id,
  standard_reference, core_competency, learning_objective, teaching_focus,
  teaching_difficulty, difficulty_level, importance_level
)
values
  ('J-MATH-RJ-71-01-01', '正数和负数', '理解具有相反意义的量，会用正数和负数表示实际问题中的数量。', '数学', '七年级', '上册', '有理数',
   (select id from public.subjects where code = 'junior-math'), (select id from public.school_stages where code = 'junior'), (select id from public.grades where code = 'grade-7'), (select id from public.chapters where chapter_code = 'rj-7a-01'), '用正数和负数表示相反意义的量，建立符号意识。', (select id from public.curriculum_standards where name = '义务教育课程标准' and version = '2022年版'), '数与代数：理解负数意义，能用正负数表示实际问题。', '符号意识、数感', '能识别相反意义的量，并用正负数准确表示。', '正负数的意义和实际表示。', '从实际情境抽象出相反意义的量。', 1, 5),
  ('J-MATH-RJ-71-01-02', '有理数', '掌握有理数概念，明确整数、分数与有理数的关系。', '数学', '七年级', '上册', '有理数',
   (select id from public.subjects where code = 'junior-math'), (select id from public.school_stages where code = 'junior'), (select id from public.grades where code = 'grade-7'), (select id from public.chapters where chapter_code = 'rj-7a-01'), '认识有理数集合，理解整数、分数、正数、负数和 0 的分类。', (select id from public.curriculum_standards where name = '义务教育课程标准' and version = '2022年版'), '数与代数：理解有理数及其分类。', '数感、分类思想', '能判断一个数是否为有理数，并说明所属类别。', '有理数概念和分类。', '0、负分数和分类交叉关系容易混淆。', 2, 5),
  ('J-MATH-RJ-71-01-03', '数轴', '理解数轴三要素，会用数轴表示和比较有理数。', '数学', '七年级', '上册', '有理数',
   (select id from public.subjects where code = 'junior-math'), (select id from public.school_stages where code = 'junior'), (select id from public.grades where code = 'grade-7'), (select id from public.chapters where chapter_code = 'rj-7a-01'), '用原点、正方向和单位长度建立数与点的对应。', (select id from public.curriculum_standards where name = '义务教育课程标准' and version = '2022年版'), '数与代数：借助数轴理解有理数大小和位置。', '几何直观、数感', '能画出规范数轴，并在数轴上表示给定有理数。', '数轴三要素和点数对应。', '单位长度不统一、方向理解错误。', 2, 5),
  ('J-MATH-RJ-71-01-04-01', '相反数', '理解相反数的意义，会求一个数的相反数。', '数学', '七年级', '上册', '有理数',
   (select id from public.subjects where code = 'junior-math'), (select id from public.school_stages where code = 'junior'), (select id from public.grades where code = 'grade-7'), (select id from public.chapters where chapter_code = 'rj-7a-01'), '只有符号不同的两个数互为相反数，0 的相反数是 0。', (select id from public.curriculum_standards where name = '义务教育课程标准' and version = '2022年版'), '数与代数：理解相反数及其数轴意义。', '数感、符号意识', '能求给定数的相反数，并用数轴解释。', '相反数定义和 0 的特殊性。', '把相反数误认为倒数或绝对值。', 2, 4),
  ('J-MATH-RJ-71-01-04-02', '绝对值', '理解绝对值的几何意义和代数意义。', '数学', '七年级', '上册', '有理数',
   (select id from public.subjects where code = 'junior-math'), (select id from public.school_stages where code = 'junior'), (select id from public.grades where code = 'grade-7'), (select id from public.chapters where chapter_code = 'rj-7a-01'), '绝对值表示数轴上点到原点的距离，结果非负。', (select id from public.curriculum_standards where name = '义务教育课程标准' and version = '2022年版'), '数与代数：理解绝对值的意义并用于比较大小。', '几何直观、数感', '能求有理数的绝对值，并解释其距离意义。', '绝对值的距离意义和非负性。', '把 |a| 简单理解为去掉负号，忽略字母情况。', 3, 5),
  ('J-MATH-RJ-71-01-05-01', '有理数加法', '掌握有理数加法法则，能进行同号、异号和与 0 相加的计算。', '数学', '七年级', '上册', '有理数',
   (select id from public.subjects where code = 'junior-math'), (select id from public.school_stages where code = 'junior'), (select id from public.grades where code = 'grade-7'), (select id from public.chapters where chapter_code = 'rj-7a-01'), '根据符号和绝对值判断有理数加法结果。', (select id from public.curriculum_standards where name = '义务教育课程标准' and version = '2022年版'), '数与代数：掌握有理数加法运算法则。', '运算能力、符号意识', '能正确计算两个有理数之和，并说明符号来源。', '同号、异号加法法则。', '异号相加时符号和绝对值差的判断。', 3, 5),
  ('J-MATH-RJ-71-01-05-02', '有理数减法', '掌握有理数减法法则，理解减法转化为加法。', '数学', '七年级', '上册', '有理数',
   (select id from public.subjects where code = 'junior-math'), (select id from public.school_stages where code = 'junior'), (select id from public.grades where code = 'grade-7'), (select id from public.chapters where chapter_code = 'rj-7a-01'), '减去一个数等于加上这个数的相反数。', (select id from public.curriculum_standards where name = '义务教育课程标准' and version = '2022年版'), '数与代数：掌握有理数减法运算法则。', '运算能力、转化思想', '能把有理数减法转化为加法并正确计算。', '减法转加法和相反数。', '只改运算符号而忘记改变减数符号。', 3, 5),
  ('J-MATH-RJ-71-01-06-01', '有理数乘法', '掌握有理数乘法法则，理解同号得正、异号得负。', '数学', '七年级', '上册', '有理数',
   (select id from public.subjects where code = 'junior-math'), (select id from public.school_stages where code = 'junior'), (select id from public.grades where code = 'grade-7'), (select id from public.chapters where chapter_code = 'rj-7a-01'), '先判断积的符号，再计算绝对值的积。', (select id from public.curriculum_standards where name = '义务教育课程标准' and version = '2022年版'), '数与代数：掌握有理数乘法运算法则。', '运算能力、符号意识', '能正确计算两个或多个有理数的乘积。', '符号判断和绝对值相乘。', '多个负因数时符号判断错误。', 3, 5),
  ('J-MATH-RJ-71-01-06-02', '有理数除法', '掌握有理数除法法则，能转化为乘以倒数。', '数学', '七年级', '上册', '有理数',
   (select id from public.subjects where code = 'junior-math'), (select id from public.school_stages where code = 'junior'), (select id from public.grades where code = 'grade-7'), (select id from public.chapters where chapter_code = 'rj-7a-01'), '除以一个不为 0 的数等于乘以这个数的倒数。', (select id from public.curriculum_standards where name = '义务教育课程标准' and version = '2022年版'), '数与代数：掌握有理数除法运算法则。', '运算能力、转化思想', '能把有理数除法转化为乘法并正确计算。', '除法转乘法、倒数和符号判断。', '除数取倒数和符号处理同时出错。', 3, 5),
  ('J-MATH-RJ-71-05-03', '一元一次方程', '理解一元一次方程并掌握基本解法。', '数学', '七年级', '上册', '一元一次方程',
   (select id from public.subjects where code = 'junior-math'), (select id from public.school_stages where code = 'junior'), (select id from public.grades where code = 'grade-7'), (select id from public.chapters where chapter_code = 'rj-7a-03'), '围绕一个未知数建立一次方程，并通过等式性质求解。', (select id from public.curriculum_standards where name = '义务教育课程标准' and version = '2022年版'), '数与代数：会解简单一元一次方程并解决实际问题。', '模型观念、运算能力', '能识别一元一次方程，并按去括号、移项、合并同类项、系数化为 1 等步骤求解。', '一元一次方程的结构和解法步骤。', '移项变号和等式性质依据容易混淆。', 4, 5)
on conflict (code) do update
set name = excluded.name,
    description = excluded.description,
    subject = excluded.subject,
    grade = excluded.grade,
    semester = excluded.semester,
    chapter = excluded.chapter,
    subject_id = excluded.subject_id,
    stage_id = excluded.stage_id,
    grade_id = excluded.grade_id,
    chapter_id = excluded.chapter_id,
    summary = excluded.summary,
    curriculum_standard_id = excluded.curriculum_standard_id,
    standard_reference = excluded.standard_reference,
    core_competency = excluded.core_competency,
    learning_objective = excluded.learning_objective,
    teaching_focus = excluded.teaching_focus,
    teaching_difficulty = excluded.teaching_difficulty,
    difficulty_level = excluded.difficulty_level,
    importance_level = excluded.importance_level,
    updated_at = now();

insert into public.knowledge_point_relations (
  source_knowledge_point_id, target_knowledge_point_id, relation_type, description, weight
)
values
  ((select id from public.knowledge_points where code = 'J-MATH-RJ-71-01-01'), (select id from public.knowledge_points where code = 'J-MATH-RJ-71-01-02'), 'prerequisite', '理解正负数是学习有理数分类的前提。', 1),
  ((select id from public.knowledge_points where code = 'J-MATH-RJ-71-01-02'), (select id from public.knowledge_points where code = 'J-MATH-RJ-71-01-03'), 'prerequisite', '有理数概念是数轴表示的基础。', 1),
  ((select id from public.knowledge_points where code = 'J-MATH-RJ-71-01-03'), (select id from public.knowledge_points where code = 'J-MATH-RJ-71-01-04-01'), 'related', '相反数可借助数轴上的对称点理解。', 0.8),
  ((select id from public.knowledge_points where code = 'J-MATH-RJ-71-01-04-01'), (select id from public.knowledge_points where code = 'J-MATH-RJ-71-01-04-02'), 'related', '相反数和绝对值都依赖数轴距离与符号理解。', 0.8),
  ((select id from public.knowledge_points where code = 'J-MATH-RJ-71-01-05-01'), (select id from public.knowledge_points where code = 'J-MATH-RJ-71-01-05-02'), 'next', '先学加法，再把减法转化为加法。', 1),
  ((select id from public.knowledge_points where code = 'J-MATH-RJ-71-01-06-01'), (select id from public.knowledge_points where code = 'J-MATH-RJ-71-01-06-02'), 'next', '先学乘法，再把除法转化为乘以倒数。', 1),
  ((select id from public.knowledge_points where code = 'J-MATH-RJ-71-01-02'), (select id from public.knowledge_points where code = 'J-MATH-RJ-71-05-03'), 'prerequisite', '一元一次方程求解需要有理数运算作为基础。', 1)
on conflict (source_knowledge_point_id, target_knowledge_point_id, relation_type) do update
set description = excluded.description,
    weight = excluded.weight;

insert into public.common_mistakes (
  knowledge_point_id, mistake_type, description, example, correction_strategy
)
values
  ((select id from public.knowledge_points where code = 'J-MATH-RJ-71-01-01'), '符号理解错误', '把正负号只当作运算符号，不能表示相反意义的量。', '把“支出 5 元”写成 +5。', '先找基准量，再判断增加/减少、上升/下降等相反意义。'),
  ((select id from public.knowledge_points where code = 'J-MATH-RJ-71-01-03'), '数轴方向错误', '画数轴时正方向不明确或左右方向混乱。', '把 -2 标在 0 的右侧。', '先标原点和正方向，再按单位长度定位。'),
  ((select id from public.knowledge_points where code = 'J-MATH-RJ-71-01-04-02'), '绝对值概念混淆', '把绝对值简单理解为“去掉负号”，忽略距离意义。', '|-3| = 3，但 |a| 不能总写成 a。', '回到“到原点的距离”解释，强调结果非负。'),
  ((select id from public.knowledge_points where code = 'J-MATH-RJ-71-01-05-01'), '有理数加减符号错误', '异号相加时符号和绝对值差判断错误。', '(-7) + 3 写成 -10。', '先比较绝对值大小，结果符号跟绝对值较大的数一致。'),
  ((select id from public.knowledge_points where code = 'J-MATH-RJ-71-05-03'), '方程移项变号错误', '移项时忘记变号，或把等式性质和口诀混用。', '4x - 3 = 2x + 5 移项写成 4x + 2x = 5 + 3。', '用等式两边同时加减同一项解释每次变形。')
on conflict (knowledge_point_id, mistake_type) do update
set description = excluded.description,
    example = excluded.example,
    correction_strategy = excluded.correction_strategy;

insert into public.question_bank (
  subject_id, stage_id, grade_id, question_text, question_type, answer,
  explanation, difficulty_level, source_type
)
values
  ((select id from public.subjects where code = 'junior-math'), (select id from public.school_stages where code = 'junior'), (select id from public.grades where code = 'grade-7'), '某地气温从 3℃ 下降 5℃，下降后的气温用正负数怎样表示？', 'short_answer', '-2℃', '下降 5℃ 表示在 3℃ 的基础上减 5℃，3 - 5 = -2。', 1, 'seed'),
  ((select id from public.subjects where code = 'junior-math'), (select id from public.school_stages where code = 'junior'), (select id from public.grades where code = 'grade-7'), '下列数中，哪些是有理数：-3，0，1/2，π？', 'short_answer', '-3、0、1/2 是有理数，π 不是有理数。', '整数和分数统称有理数，π 是无限不循环小数。', 1, 'seed'),
  ((select id from public.subjects where code = 'junior-math'), (select id from public.school_stages where code = 'junior'), (select id from public.grades where code = 'grade-7'), '在数轴上，-4 和 2 哪一个更靠左？', 'short_answer', '-4 更靠左。', '数轴上越往右数越大，-4 小于 2，所以 -4 更靠左。', 1, 'seed'),
  ((select id from public.subjects where code = 'junior-math'), (select id from public.school_stages where code = 'junior'), (select id from public.grades where code = 'grade-7'), '求 -8 的相反数。', 'short_answer', '8', '只有符号不同的两个数互为相反数。', 1, 'seed'),
  ((select id from public.subjects where code = 'junior-math'), (select id from public.school_stages where code = 'junior'), (select id from public.grades where code = 'grade-7'), '求 |-6| 的值，并说明意义。', 'short_answer', '6，表示 -6 到原点的距离是 6 个单位长度。', '绝对值表示数轴上点到原点的距离，距离非负。', 2, 'seed'),
  ((select id from public.subjects where code = 'junior-math'), (select id from public.school_stages where code = 'junior'), (select id from public.grades where code = 'grade-7'), '计算：(-7) + 3。', 'calculation', '-4', '异号相加，取绝对值较大的 -7 的符号，再用 7 - 3 = 4。', 2, 'seed'),
  ((select id from public.subjects where code = 'junior-math'), (select id from public.school_stages where code = 'junior'), (select id from public.grades where code = 'grade-7'), '计算：5 - (-2)。', 'calculation', '7', '减去 -2 等于加上 2，所以 5 - (-2) = 5 + 2 = 7。', 2, 'seed'),
  ((select id from public.subjects where code = 'junior-math'), (select id from public.school_stages where code = 'junior'), (select id from public.grades where code = 'grade-7'), '计算：(-3) × (-4)。', 'calculation', '12', '两个负数相乘，同号得正，3 × 4 = 12。', 2, 'seed'),
  ((select id from public.subjects where code = 'junior-math'), (select id from public.school_stages where code = 'junior'), (select id from public.grades where code = 'grade-7'), '计算：(-12) ÷ 3。', 'calculation', '-4', '异号相除得负，12 ÷ 3 = 4，所以结果为 -4。', 2, 'seed'),
  ((select id from public.subjects where code = 'junior-math'), (select id from public.school_stages where code = 'junior'), (select id from public.grades where code = 'grade-7'), '解方程：4x - 3 = 2x + 5。', 'calculation', 'x = 4', '移项得 4x - 2x = 5 + 3，合并得 2x = 8，所以 x = 4。', 3, 'seed')
on conflict (question_text) do update
set answer = excluded.answer,
    explanation = excluded.explanation,
    difficulty_level = excluded.difficulty_level,
    source_type = excluded.source_type;

insert into public.question_knowledge_points (question_id, knowledge_point_id, weight)
values
  ((select id from public.question_bank where question_text = '某地气温从 3℃ 下降 5℃，下降后的气温用正负数怎样表示？'), (select id from public.knowledge_points where code = 'J-MATH-RJ-71-01-01'), 1),
  ((select id from public.question_bank where question_text = '下列数中，哪些是有理数：-3，0，1/2，π？'), (select id from public.knowledge_points where code = 'J-MATH-RJ-71-01-02'), 1),
  ((select id from public.question_bank where question_text = '在数轴上，-4 和 2 哪一个更靠左？'), (select id from public.knowledge_points where code = 'J-MATH-RJ-71-01-03'), 1),
  ((select id from public.question_bank where question_text = '求 -8 的相反数。'), (select id from public.knowledge_points where code = 'J-MATH-RJ-71-01-04-01'), 1),
  ((select id from public.question_bank where question_text = '求 |-6| 的值，并说明意义。'), (select id from public.knowledge_points where code = 'J-MATH-RJ-71-01-04-02'), 1),
  ((select id from public.question_bank where question_text = '计算：(-7) + 3。'), (select id from public.knowledge_points where code = 'J-MATH-RJ-71-01-05-01'), 1),
  ((select id from public.question_bank where question_text = '计算：5 - (-2)。'), (select id from public.knowledge_points where code = 'J-MATH-RJ-71-01-05-02'), 1),
  ((select id from public.question_bank where question_text = '计算：(-3) × (-4)。'), (select id from public.knowledge_points where code = 'J-MATH-RJ-71-01-06-01'), 1),
  ((select id from public.question_bank where question_text = '计算：(-12) ÷ 3。'), (select id from public.knowledge_points where code = 'J-MATH-RJ-71-01-06-02'), 1),
  ((select id from public.question_bank where question_text = '解方程：4x - 3 = 2x + 5。'), (select id from public.knowledge_points where code = 'J-MATH-RJ-71-05-03'), 1)
on conflict (question_id, knowledge_point_id) do update
set weight = excluded.weight;
