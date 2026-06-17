-- =============================================================================
-- K12 知识库后续数据补全机制：外部来源、导入任务、暂存项与审核记录
-- 说明：外部开源库、Excel/CSV 和后台录入均先进入暂存表，审核后才允许进入正式库。
-- =============================================================================

create extension if not exists "pgcrypto";

create table if not exists public.external_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source_type text not null,
  homepage_url text,
  license text,
  allowed_usage text,
  description text,
  created_at timestamptz not null default now(),
  constraint external_sources_name_not_empty check (char_length(trim(name)) > 0),
  constraint external_sources_type_not_empty check (char_length(trim(source_type)) > 0),
  constraint external_sources_name_type_unique unique (name, source_type)
);

create table if not exists public.external_import_jobs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.external_sources (id) on delete restrict,
  import_type text not null,
  file_name text,
  status text not null default 'pending',
  total_items integer not null default 0,
  parsed_items integer not null default 0,
  accepted_items integer not null default 0,
  rejected_items integer not null default 0,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint external_import_jobs_type_not_empty check (char_length(trim(import_type)) > 0),
  constraint external_import_jobs_status_valid check (
    status in ('pending', 'parsing', 'parsed', 'reviewing', 'completed', 'failed')
  ),
  constraint external_import_jobs_counts_valid check (
    total_items >= 0
    and parsed_items >= 0
    and accepted_items >= 0
    and rejected_items >= 0
  )
);

create table if not exists public.external_knowledge_items (
  id uuid primary key default gen_random_uuid(),
  import_job_id uuid not null references public.external_import_jobs (id) on delete cascade,
  source_id uuid not null references public.external_sources (id) on delete restrict,
  raw_payload jsonb not null,
  normalized_name text,
  normalized_summary text,
  suggested_subject text,
  suggested_stage text,
  suggested_grade text,
  suggested_knowledge_point_id uuid references public.knowledge_points (id) on delete set null,
  match_confidence numeric,
  review_status text not null default 'pending',
  reviewer_note text,
  created_at timestamptz not null default now(),
  constraint external_knowledge_items_review_status_valid check (
    review_status in ('pending', 'approved', 'rejected')
  ),
  constraint external_knowledge_items_match_confidence_valid check (
    match_confidence is null or (match_confidence >= 0 and match_confidence <= 1)
  )
);

create table if not exists public.external_question_items (
  id uuid primary key default gen_random_uuid(),
  import_job_id uuid not null references public.external_import_jobs (id) on delete cascade,
  source_id uuid not null references public.external_sources (id) on delete restrict,
  raw_payload jsonb not null,
  question_text text,
  answer text,
  explanation text,
  suggested_subject text,
  suggested_stage text,
  suggested_grade text,
  suggested_knowledge_point_id uuid references public.knowledge_points (id) on delete set null,
  match_confidence numeric,
  review_status text not null default 'pending',
  reviewer_note text,
  created_at timestamptz not null default now(),
  constraint external_question_items_review_status_valid check (
    review_status in ('pending', 'approved', 'rejected')
  ),
  constraint external_question_items_match_confidence_valid check (
    match_confidence is null or (match_confidence >= 0 and match_confidence <= 1)
  )
);

create table if not exists public.external_mapping_reviews (
  id uuid primary key default gen_random_uuid(),
  external_item_type text not null,
  external_item_id uuid not null,
  target_table text not null,
  target_id uuid,
  action text not null,
  reviewer_id uuid references public.profiles (id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  constraint external_mapping_reviews_item_type_valid check (
    external_item_type in ('external_knowledge_item', 'external_question_item')
  ),
  constraint external_mapping_reviews_action_valid check (
    action in ('approve', 'reject')
  ),
  constraint external_mapping_reviews_target_table_not_empty check (
    char_length(trim(target_table)) > 0
  )
);

create index if not exists external_import_jobs_source_status_idx
  on public.external_import_jobs (source_id, status, created_at desc);
create index if not exists external_knowledge_items_job_status_idx
  on public.external_knowledge_items (import_job_id, review_status, created_at desc);
create index if not exists external_knowledge_items_pending_idx
  on public.external_knowledge_items (review_status, match_confidence desc)
  where review_status = 'pending';
create index if not exists external_question_items_job_status_idx
  on public.external_question_items (import_job_id, review_status, created_at desc);
create index if not exists external_question_items_pending_idx
  on public.external_question_items (review_status, match_confidence desc)
  where review_status = 'pending';
create index if not exists external_mapping_reviews_item_idx
  on public.external_mapping_reviews (external_item_type, external_item_id, created_at desc);
create index if not exists external_mapping_reviews_reviewer_idx
  on public.external_mapping_reviews (reviewer_id, created_at desc);

alter table public.external_sources enable row level security;
alter table public.external_import_jobs enable row level security;
alter table public.external_knowledge_items enable row level security;
alter table public.external_question_items enable row level security;
alter table public.external_mapping_reviews enable row level security;

drop policy if exists "external_sources_teacher_select" on public.external_sources;
create policy "external_sources_teacher_select"
  on public.external_sources for select
  to authenticated
  using (private.is_teacher(auth.uid()));

drop policy if exists "external_sources_teacher_insert" on public.external_sources;
create policy "external_sources_teacher_insert"
  on public.external_sources for insert
  to authenticated
  with check (private.is_teacher(auth.uid()));

drop policy if exists "external_import_jobs_teacher_select" on public.external_import_jobs;
create policy "external_import_jobs_teacher_select"
  on public.external_import_jobs for select
  to authenticated
  using (private.is_teacher(auth.uid()));

drop policy if exists "external_import_jobs_teacher_insert" on public.external_import_jobs;
create policy "external_import_jobs_teacher_insert"
  on public.external_import_jobs for insert
  to authenticated
  with check (private.is_teacher(auth.uid()));

drop policy if exists "external_import_jobs_teacher_update" on public.external_import_jobs;
create policy "external_import_jobs_teacher_update"
  on public.external_import_jobs for update
  to authenticated
  using (private.is_teacher(auth.uid()))
  with check (private.is_teacher(auth.uid()));

drop policy if exists "external_knowledge_items_teacher_select" on public.external_knowledge_items;
create policy "external_knowledge_items_teacher_select"
  on public.external_knowledge_items for select
  to authenticated
  using (private.is_teacher(auth.uid()));

drop policy if exists "external_knowledge_items_teacher_insert" on public.external_knowledge_items;
create policy "external_knowledge_items_teacher_insert"
  on public.external_knowledge_items for insert
  to authenticated
  with check (private.is_teacher(auth.uid()));

drop policy if exists "external_knowledge_items_teacher_update" on public.external_knowledge_items;
create policy "external_knowledge_items_teacher_update"
  on public.external_knowledge_items for update
  to authenticated
  using (private.is_teacher(auth.uid()))
  with check (private.is_teacher(auth.uid()));

drop policy if exists "external_question_items_teacher_select" on public.external_question_items;
create policy "external_question_items_teacher_select"
  on public.external_question_items for select
  to authenticated
  using (private.is_teacher(auth.uid()));

drop policy if exists "external_question_items_teacher_insert" on public.external_question_items;
create policy "external_question_items_teacher_insert"
  on public.external_question_items for insert
  to authenticated
  with check (private.is_teacher(auth.uid()));

drop policy if exists "external_question_items_teacher_update" on public.external_question_items;
create policy "external_question_items_teacher_update"
  on public.external_question_items for update
  to authenticated
  using (private.is_teacher(auth.uid()))
  with check (private.is_teacher(auth.uid()));

drop policy if exists "external_mapping_reviews_teacher_select" on public.external_mapping_reviews;
create policy "external_mapping_reviews_teacher_select"
  on public.external_mapping_reviews for select
  to authenticated
  using (private.is_teacher(auth.uid()));

drop policy if exists "external_mapping_reviews_teacher_insert" on public.external_mapping_reviews;
create policy "external_mapping_reviews_teacher_insert"
  on public.external_mapping_reviews for insert
  to authenticated
  with check (private.is_teacher(auth.uid()));

grant select, insert on public.external_sources to authenticated;
grant select, insert, update on public.external_import_jobs to authenticated;
grant select, insert, update on public.external_knowledge_items to authenticated;
grant select, insert, update on public.external_question_items to authenticated;
grant select, insert on public.external_mapping_reviews to authenticated;
