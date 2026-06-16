-- 知桥 AI · 增量 SQL：允许学生读取结构化课件作为学习资源

drop policy if exists "coursewares_student_select_learning" on public.coursewares;

create policy "coursewares_student_select_learning"
  on public.coursewares for select
  to authenticated
  using (
    is_published = true
    and content_json is not null
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'student'
    )
  );
