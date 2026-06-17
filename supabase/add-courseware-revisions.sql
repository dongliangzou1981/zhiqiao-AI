create table if not exists public.courseware_revisions (
  id uuid primary key default gen_random_uuid(),
  courseware_id uuid not null references public.coursewares (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  source_content_json jsonb not null,
  candidate_content_json jsonb not null,
  instruction text null,
  quality_before jsonb null,
  quality_after jsonb null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  applied_at timestamptz null,

  constraint courseware_revisions_status_check check (status in ('pending', 'applied', 'discarded'))
);

comment on table public.courseware_revisions is 'AI 课件优化候选版。老师确认前不覆盖 coursewares.content_json';

create index if not exists courseware_revisions_courseware_status_created_idx
  on public.courseware_revisions (courseware_id, status, created_at desc);

create index if not exists courseware_revisions_user_created_idx
  on public.courseware_revisions (user_id, created_at desc);

alter table public.courseware_revisions enable row level security;

drop policy if exists "courseware_revisions_teacher_select_own" on public.courseware_revisions;
drop policy if exists "courseware_revisions_teacher_insert_own" on public.courseware_revisions;
drop policy if exists "courseware_revisions_teacher_update_own" on public.courseware_revisions;

create policy "courseware_revisions_teacher_select_own"
  on public.courseware_revisions for select
  to authenticated
  using (
    auth.uid() = user_id
    and private.is_teacher(auth.uid())
  );

create policy "courseware_revisions_teacher_insert_own"
  on public.courseware_revisions for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and private.is_teacher(auth.uid())
  );

create policy "courseware_revisions_teacher_update_own"
  on public.courseware_revisions for update
  to authenticated
  using (
    auth.uid() = user_id
    and private.is_teacher(auth.uid())
  )
  with check (
    auth.uid() = user_id
    and private.is_teacher(auth.uid())
  );

revoke all on public.courseware_revisions from anon, authenticated;
grant select, insert on public.courseware_revisions to authenticated;
grant update (status, applied_at) on public.courseware_revisions to authenticated;
