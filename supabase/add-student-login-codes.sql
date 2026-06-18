-- Student login code data model draft.
-- Codes are never stored in plaintext. Only code_hash is persisted.
-- code_hash must not be selected by client-facing queries.

create table if not exists public.student_login_codes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz null,
  revoked_at timestamptz null,
  last_used_at timestamptz null,
  created_at timestamptz not null default now(),

  constraint student_login_codes_hash_not_empty
    check (char_length(trim(code_hash)) > 0),
  constraint student_login_codes_teacher_student_not_same
    check (teacher_id <> student_id)
);

comment on table public.student_login_codes is
  'Stores hashed student login codes issued by teachers. Plaintext codes must never be stored.';
comment on column public.student_login_codes.code_hash is
  'HMAC hash of the student login code. Do not store plaintext codes or expose code_hash to client-facing queries.';

create unique index if not exists student_login_codes_code_hash_unique_idx
  on public.student_login_codes (code_hash);

create index if not exists student_login_codes_teacher_student_idx
  on public.student_login_codes (teacher_id, student_id, created_at desc);

create index if not exists student_login_codes_student_active_idx
  on public.student_login_codes (student_id, expires_at)
  where revoked_at is null;

alter table public.student_login_codes enable row level security;

drop policy if exists "student_login_codes_teacher_select_own"
  on public.student_login_codes;
drop policy if exists "student_login_codes_teacher_insert_linked"
  on public.student_login_codes;
drop policy if exists "student_login_codes_teacher_update_own"
  on public.student_login_codes;

create policy "student_login_codes_teacher_select_own"
  on public.student_login_codes for select
  to authenticated
  using (
    teacher_id = auth.uid()
    and private.is_teacher(auth.uid())
  );

create policy "student_login_codes_teacher_insert_linked"
  on public.student_login_codes for insert
  to authenticated
  with check (
    teacher_id = auth.uid()
    and private.is_teacher(auth.uid())
    and private.is_student(student_id)
    and exists (
      select 1
      from public.teacher_student_links link
      where link.teacher_id = auth.uid()
        and link.student_id = student_login_codes.student_id
    )
  );

create policy "student_login_codes_teacher_update_own"
  on public.student_login_codes for update
  to authenticated
  using (
    teacher_id = auth.uid()
    and private.is_teacher(auth.uid())
  )
  with check (
    teacher_id = auth.uid()
    and private.is_teacher(auth.uid())
  );

revoke all on public.student_login_codes from anon, authenticated;
grant select (
  id,
  teacher_id,
  student_id,
  expires_at,
  revoked_at,
  last_used_at,
  created_at
) on public.student_login_codes to authenticated;
grant insert (
  teacher_id,
  student_id,
  code_hash,
  expires_at
) on public.student_login_codes to authenticated;
grant update (expires_at, revoked_at, last_used_at)
  on public.student_login_codes to authenticated;

-- The login exchange API should be added separately. It should verify the hash
-- server-side and preserve the existing profiles.id / auth.uid() data chain.
