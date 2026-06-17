# 已验证确认事项

## P2 阶段33验证：内容效果优先质量门禁

- 已验证类型检查：
  - `npx tsc --noEmit`
- 已验证新增质量规则：
  - `lib/courseware-quality.ts` 可生成 `courseware_quality_v1` 报告。
  - 质量报告包含 `score`、`passedRequired`、`checks` 和 `generatedAt`。
  - 检查项覆盖知识点主线、前置知识、学习目标、完整例题、步骤依据、易错点、练习分层、错题回看、动态分镜、投屏 HTML、版式变化、慢学生友好、AI 模板痕迹和学生复习复用。
- 已验证浏览器页面：
  - 教师测试账号访问 `/teacher/courseware-history/2e60da6f-ba1e-4f99-9aee-9efc71ce65c2`。
  - 页面显示“内容效果检查”“内容质量分”“必选项”“建议项”“建议动作”。
  - 当前样板课件显示内容质量分 `93`。
  - 页面提示“幻灯片版式有变化”为建议优化项。
- 已验证回归页面：
  - `/teacher/courseware-preview/2e60da6f-ba1e-4f99-9aee-9efc71ce65c2` 仍显示投屏预览工具栏。
  - 预览页仍有返回、下载和 iframe。
  - 浏览器控制台 error/warn 为 0。

## P2 阶段31验证：动态课件低质量分镜回退与 Prompt 强化

- 已验证新增单测：
  - `npx --yes tsx --test lib/courseware-storyboard.test.ts`
  - 覆盖泛化步骤标题替换、低质量 AI 分镜回退到内置高质量分镜。
- 已验证回归单测：
  - `npx --yes tsx --test lib/courseware-playback.test.ts`
- 已验证类型检查：
  - `npx tsc --noEmit`
- 已验证浏览器页面：
  - 使用教师测试账号访问 `/teacher/courseware-history/bc26231a-e161-4214-bfd2-3ae5d605bec5?practice=0`。
  - “对应动态讲解步骤”下拉显示“原方程、确定整理目标、两边同减 2x、移含 x 的项、两边同加 3、移常数项、两边同除以 2、得到结果并检查”。

## P2 阶段30验证：教师端练习题绑定动态步骤编辑能力

- 已验证新增单测：
  - `npx --yes tsx --test lib/courseware-edit.test.ts`
  - 覆盖动态步骤选项生成、标题缺失回退、泛化标题回退。
- 已验证回归单测：
  - `npx --yes tsx --test lib/courseware-playback.test.ts`
  - 确认 `target_storyboard_step` 仍会被错题回看优先使用。
- 已验证类型检查：
  - `npx tsc --noEmit`
- 已验证浏览器页面：
  - 使用教师测试账号访问 `/teacher/courseware-history/bc26231a-e161-4214-bfd2-3ae5d605bec5?practice=0`。
  - 页面存在“对应动态讲解步骤”下拉控件。
  - 页面存在“学生做错这道题后，会优先跳回这里复看完整演化过程。”提示。
  - 每道练习题均出现“自动匹配动态步骤”选项。
- 浏览器控制台：`playwright-cli console error` 未发现功能错误。

- 项目已成功恢复到本地。
- Codex 已能读取项目内容。
- `package.json`、`app/`、`docs/`、`prompts/` 均存在。
- 当前分支为 `main`。
- 工作区在交接前为 clean。
- P0/P1 回归验证已通过：`/teacher`、`/student`、`/api/lesson-plan`、`/api/student-qa` 均完成基础验证。
- P2 阶段1已完成。
- 知识点页面已读取 `knowledge_points`。
- 教师端 `/teacher/knowledge-explain` 已完成基础访问与数据读取验证。
- 学生端 `/student/knowledge` 已完成基础访问与数据读取验证。
- `POST /api/knowledge-explain` 已完成教师端与学生端调用验证。
- DeepSeek 知识点讲解调用已验证。
- `knowledge_explanations` 已完成写入验证。
- `knowledge_explanations` 基础 RLS 已验证。
- 新增 Prompt 文件：`prompts/knowledge-explain.md`。
- 新增 AI 调用封装：`lib/knowledge-explain.ts`。
- 新增数据库表：`public.knowledge_explanations`。
- 产品路线已重新确认：当前不直接进入学情分析，先做教师端完整化。
- 后续核心原则已确认：所有教师端和学生端功能服务“教育大纲基础知识打牢”。
- 后续长期数据主线已确认：以 `knowledge_point_code` 组织课件、示例、练习、复习、掌握记录和学情分析。
- AI 课件生成 MVP 方向已确认：中文、初中数学、Markdown 课件优先；后续预留结构化 JSON。
- P2 阶段2 AI 课件生成 MVP 代码已实现。
- 新增 API：`POST /api/courseware`。
- 新增 Prompt 文件：`prompts/courseware.md`。
- 新增 AI 调用封装：`lib/courseware.ts`。
- 新增数据库表：`public.coursewares`。
- 新增页面：`/teacher/courseware`。
- `coursewares` 表已应用到 Supabase 项目。
- `coursewares` RLS 策略已确认存在：教师只能读写自己的课件。
- `coursewares` 表级授权已确认仅保留 authenticated `select` / `insert`。
- `npx tsc --noEmit` 已通过。
- `POST /api/courseware` 缺少必要字段返回 HTTP 400。
- `POST /api/courseware` 未登录完整请求返回 HTTP 401。
- `/teacher/courseware` 未登录访问跳转登录页。
- `/teacher/courseware` 教师登录态真实浏览器点击生成已通过。
- 样板知识点 `J-MATH-RJ-71-01-03` 数轴已生成中文 Markdown 课件。
- 页面生成后显示“已保存”。
- 生成结果已写入 `coursewares`，最新浏览器验证记录为 `bf05108c-7062-475b-a228-4e3dbe7276c5`。
- RLS 已验证：测试教师可以读取自己的课件，另一个教师读取不到该课件。
- P2 阶段2收尾课件历史已完成。
- 新增页面：`/teacher/courseware-history`。
- 新增页面：`/teacher/courseware-history/[id]`。
- 新增课件读取封装：`lib/coursewares.ts`。
- 教师工作台已新增“课件历史”入口。
- `/teacher/courseware` 已新增“查看课件历史”入口。
- 课件生成成功后已提供“查看详情”入口。
- `/teacher/courseware-history` 未登录访问跳转登录页。
- `/teacher/courseware-history` 教师登录态列表访问已通过。
- `/teacher/courseware-history/[id]` 教师登录态详情访问已通过。
- 不存在的课件详情 id 会显示“未找到该课件记录”。
- P2 阶段3结构化课件 JSON 已完成。
- 新增 Prompt 文件：`prompts/courseware-json.md`。
- 新增 AI 调用封装：`lib/courseware-json.ts`。
- `POST /api/courseware` 已同步生成 Markdown 和结构化 JSON。
- `coursewares.content_json` 已完成写入验证。
- 结构化 JSON 版本为 `courseware_json_v1`。
- 第二样板点 `J-MATH-RJ-71-05-03` 一元一次方程的解法已完成真实 API 生成与落库。
- 验证记录：`coursewares.id = bc26231a-e161-4214-bfd2-3ae5d605bec5`。
- 该记录 `content_json` 已包含 12 页课件、3 道练习、3 条学习目标。
- `/teacher/courseware-history/[id]` 已能展示“结构化 JSON 已保存”摘要。
- RLS 已验证：测试教师可读取该结构化 JSON，另一个教师读取不到。
- P2 阶段4学生端知识点学习闭环只读 MVP 已完成。
- `/student/knowledge` 已复用 `knowledge_points`、当前学生自己的 `knowledge_explanations` 与 `coursewares.content_json`。
- 学生端页面已展示结构化学习包：学习目标、核心概念、例题、易错点、基础练习和 AI 讲解入口。
- 新增并应用 RLS 策略：`coursewares_student_select_learning`。
- RLS 已验证：未登录读取 `coursewares` 返回 permission denied；学生可读取 `content_json is not null` 的学习资源；学生插入 `coursewares` 被 RLS 拦截。
- 学生端真实浏览器验证已通过：学生账号登录后访问 `/student/knowledge`，页面显示“知识点学习”“基础知识学习包”“基础练习”“有练习”和 `J-MATH-RJ-71-05-03` 一元一次方程的解法。
- 轻量回归已验证：`/student/knowledge` 未登录 HTTP 307 跳转登录页，`/teacher/courseware-history` 未登录 HTTP 307 跳转登录页，`POST /api/knowledge-explain` 未登录 HTTP 401，`POST /api/courseware` 缺字段 HTTP 400。
- `npx tsc --noEmit` 已通过。
- `git diff --check` 已通过，仅有 Windows LF/CRLF 提示。
- P2 阶段4收尾：课件发布与学生端可见范围 MVP 已完成。
- `coursewares` 已新增 `is_published` 与 `published_at` 字段。
- 新增 SQL 文件：`supabase/add-courseware-publishing.sql`。
- 新增教师端 server action：`app/teacher/courseware-history/actions.ts`。
- `/teacher/courseware-history` 已显示每条课件的学生端发布状态。
- `/teacher/courseware-history/[id]` 已支持发布到学生端与取消发布。
- `POST /api/courseware` 新生成课件默认未发布。
- `/student/knowledge` 已改为只读取已发布的结构化课件资源。
- RLS 已验证：发布前学生读不到课件；教师发布后学生可读；教师取消发布后学生再次读不到；其他教师不能更新该课件。
- 真实浏览器验证已通过：教师点击发布 `bc26231a-e161-4214-bfd2-3ae5d605bec5` 后，学生端能看到 `J-MATH-RJ-71-05-03` 学习包。
- 轻量回归已验证：课件详情页未登录 HTTP 307 跳转登录页。
- P2 阶段5基础练习与掌握记录 MVP 已完成。
- 新增表：`student_practice_records`。
- 新增 API：`POST /api/student-practice`。
- 新增 SQL 文件：`supabase/add-student-practice-records.sql`。
- `/student/knowledge` 基础练习已支持学生输入答案、提交答案、查看判定结果、标准答案、解析和最近记录时间。
- `POST /api/student-practice` 缺字段返回 HTTP 400。
- `POST /api/student-practice` 未登录完整请求返回 HTTP 401。
- RLS 已验证：学生可以插入自己的 `student_practice_records`，教师不能插入该表。
- RLS 已验证：教师不能读取学生练习记录。
- 浏览器验证已通过：学生账号提交 `J-MATH-RJ-71-05-03` 第 1 道基础练习后，页面显示“需要再复习”。
- 数据库写入验证：最新浏览器验证记录为 `student_practice_records.id = cbe035a3-76c9-4522-880c-a155091439d6`。
- `npx tsc --noEmit` 已通过。
- `git diff --check` 已通过，仅有 Windows LF/CRLF 提示。
- P2 阶段6日/周复习系统 MVP 已完成。
- 新增表：`student_review_tasks`。
- 新增 API：`POST /api/student-review`。
- 新增 SQL 文件：`supabase/add-student-review-tasks.sql`。
- `/student/review` 已从占位页改为智能复习页。
- `POST /api/student-practice` 已扩展为提交练习后自动生成复习任务。
- 规则已验证：答错生成次日错题复习；所有作答生成一周回顾。
- `POST /api/student-review` 缺字段返回 HTTP 400。
- `POST /api/student-review` 未登录完整请求返回 HTTP 401。
- `/student/review` 未登录访问跳转登录页。
- RLS 已验证：学生可读取并完成自己的 `student_review_tasks`。
- RLS 已验证：教师不能读取或更新学生复习任务。
- 浏览器验证已通过：学生提交 `J-MATH-RJ-71-05-03` 练习错题后，`/student/review` 显示“智能复习”“错题复习”“一周回顾”。
- 数据库写入验证：最新浏览器验证练习记录为 `student_practice_records.id = fc34886a-ca37-4eb6-b01a-3b22d5438e9e`。
- 数据库写入验证：错题复习任务为 `student_review_tasks.id = 0d6af99b-bfed-446b-8ff7-bb9eb7b20b5b`，`due_date = 2026-06-14`。
- 数据库写入验证：一周回顾任务为 `student_review_tasks.id = 13e9d330-4dea-49c0-935a-4c93e3404dcc`，`due_date = 2026-06-20`。
- 浏览器验证已通过：点击“完成复习”后，任务 `0d6af99b-bfed-446b-8ff7-bb9eb7b20b5b` 状态更新为 `completed`。
- `npx tsc --noEmit` 已通过。
- `git diff --check` 已通过，仅有 Windows LF/CRLF 提示。
- P2 阶段7两端数据整合最小版已完成。
- 新增表：`teacher_student_links`。
- 新增 SQL 文件：`supabase/add-teacher-student-links.sql`。
- `/teacher/analytics` 已由占位页改为教师端学习数据只读视图。
- 教师工作台入口文案已改为“学习数据”。
- `/teacher/analytics` 已展示关联学生数、练习提交数、正确率、待复习数、知识点基础掌握信号、学生概览、最近练习记录和待复习任务。
- 远端 Supabase 已应用迁移：`add_teacher_student_links`。
- 远端 Supabase 已应用迁移：`harden_profiles_rls_for_teacher_student_links`。
- 远端 Supabase 已应用迁移：`fix_teacher_student_links_rls_recursion`。
- `profiles` 远端 RLS 已启用，历史宽权限已收紧。
- 新增 private schema 函数 `private.is_teacher(user_id uuid)`，用于避免 RLS 策略递归。
- 测试教师与测试学生已建立验证关联。
- RLS 已验证：测试教师可读取 1 个关联学生、3 条练习记录、2 条复习任务。
- RLS 已验证：另一个教师读取不到该学生的练习与复习数据。
- RLS 已验证：学生读取不到 `teacher_student_links`。
- 浏览器验证已通过：测试教师登录 `/teacher/analytics` 后可看到 `J-MATH-RJ-71-05-03` 一元一次方程的解法学习数据。
- 浏览器验证已通过：另一个教师登录 `/teacher/analytics` 后显示空状态，不能看到测试学生数据。
- `npx tsc --noEmit` 已通过。

## P2 阶段9验证状态：课件编辑与可视化预览 MVP

- P2 阶段9课件编辑与可视化预览 MVP 已完成。
- 新增组件：`app/teacher/courseware-history/[id]/courseware-json-editor.tsx`。
- 新增 API：`PUT /api/courseware/[id]`。
- 新增校验封装：`lib/courseware-edit.ts`。
- 新增 SQL：`supabase/allow-teacher-update-courseware-content-json.sql`。
- `coursewares` 已允许教师更新自己的 `content_json`，仍受 RLS 限制。
- 教师端课件详情页已支持结构化课件卡片式预览。
- 教师可编辑学习目标、课堂小结、课件页标题、课件页正文、老师备注和基础练习。
- 保存编辑后自动取消发布，避免学生端看到未经老师确认的新版本。
- 远端 Supabase 已应用迁移：`allow_teacher_update_courseware_content_json`。
- `npx tsc --noEmit` 已通过。
- `git diff --check` 已通过，仅有 Windows LF/CRLF 提示。
- API 验证：未登录 `PUT /api/courseware/[id]` 返回 HTTP 401。
- API 验证：另一个教师编辑不属于自己的课件返回 HTTP 404。
- 浏览器验证：测试教师可保存编辑，页面显示“课件编辑已保存”，状态变为“未发布”。
- 浏览器验证：测试教师重新发布后，样板课件恢复“已发布”状态。

## P2 阶段10验证状态：学生端可视化课件播放器 MVP

- P2 阶段10学生端可视化课件播放器 MVP 已完成。
- 新增页面：`app/student/courseware/[id]/page.tsx`。
- 新增组件：`app/student/courseware/[id]/courseware-player-client.tsx`。
- `/student/knowledge` 已新增“打开课件学习”入口。
- 播放器仅读取老师已发布的结构化课件资源。
- 播放器支持课件目录、进度条、分页学习、学习目标、核心概念、课后巩固和基础练习。
- 播放器内练习继续调用 `POST /api/student-practice`，保持练习记录和日/周复习任务主线。
- `npx tsc --noEmit` 已通过。
- `git diff --check` 已通过，仅有 Windows LF/CRLF 提示。
- 未登录访问 `/student/courseware/[id]` 返回 HTTP 307。
- 浏览器验证：学生从知识点页进入播放器成功。
- 浏览器验证：播放器下一页切换成功。
- 浏览器验证：学生在播放器内提交练习后显示作答结果。

## P2 阶段11验证状态：学生学习进度与课件学习记录 MVP

- P2 阶段11学生学习进度与课件学习记录 MVP 已完成。
- 新增表：`student_courseware_progress`。
- 新增 API：`POST /api/student-courseware-progress`。
- 新增 SQL 文件：`supabase/add-student-courseware-progress.sql`。
- 远端 Supabase 已应用迁移：`add_student_courseware_progress`。
- 播放器进入、翻页和完成学习都会写入或更新课件学习进度。
- 教师端 `/teacher/analytics` 已接入课件学习进度，展示课件学习指标、学生课件完成数和最近课件学习记录。
- `POST /api/student-courseware-progress` 缺字段返回 HTTP 400。
- `POST /api/student-courseware-progress` 未登录完整请求返回 HTTP 401。
- RLS 已验证：学生可读取自己的 1 条课件进度记录。
- RLS 已验证：关联教师可读取该学生 1 条课件进度记录。
- RLS 已验证：另一个教师读取不到该学生课件进度记录。
- 浏览器验证：学生打开 `/student/courseware/bc26231a-e161-4214-bfd2-3ae5d605bec5`，翻页并点击“标记完成学习”后，页面显示“已完成学习”。
- 浏览器验证：教师登录 `/teacher/analytics` 后可见“课件学习 1/1”、学生概览“课件 1/1”和最近课件学习记录。
- 验证记录：`student_courseware_progress.id = 325c29ea-4caf-4205-8b56-6a2e7cefbff5`，`knowledge_point_code = J-MATH-RJ-71-05-03`，`status = completed`。
- `npx tsc --noEmit` 已通过。
- `git diff --check` 已通过，仅有 Windows LF/CRLF 提示。

## P2 阶段12验证状态：掌握度规则 MVP

- P2 阶段12掌握度规则 MVP 已完成。
- 新增表：`student_knowledge_mastery`。
- 新增 API：`POST /api/student-mastery/refresh`。
- 新增计算封装：`lib/student-mastery.ts`。
- 新增 SQL 文件：`supabase/add-student-knowledge-mastery.sql`。
- 远端 Supabase 已应用迁移：`add_student_knowledge_mastery`。
- `POST /api/student-mastery/refresh` 未登录返回 HTTP 401。
- 学生登录后刷新掌握度返回 HTTP 200，并生成 1 条样板知识点掌握记录。
- 验证记录：`student_knowledge_mastery.id = 757875f7-5439-4728-af86-3d7d0259723a`。
- 验证记录：`knowledge_point_code = J-MATH-RJ-71-05-03`，`mastery_level = needs_work`，`practice_attempts = 4`，`pending_review_count = 3`。
- RLS 已验证：学生可见 1 条自己的掌握记录。
- RLS 已验证：关联教师可见该学生 1 条掌握记录。
- RLS 已验证：另一个教师可见 0 条掌握记录。
- 浏览器验证：教师端 `/teacher/analytics` 显示“待巩固”和“基础掌握快照”。

## P2 阶段13验证状态：学生弱项知识点视图 MVP

- P2 阶段13学生弱项知识点视图 MVP 已完成。
- 新增页面：`app/student/mastery/page.tsx`。
- `/student` 已新增“弱项知识点”入口。
- `/student/mastery` 未登录访问返回 HTTP 307。
- 浏览器验证：学生登录 `/student` 后可看到“弱项知识点”入口。
- 浏览器验证：点击入口后进入 `/student/mastery`。
- 浏览器验证：页面显示“我的弱项知识点”、`J-MATH-RJ-71-05-03` 一元一次方程的解法、“待巩固”和下一步建议。
- `npx tsc --noEmit` 已通过。
- `git diff --check` 已通过，仅有 Windows LF/CRLF 提示。

## P2 阶段14验证状态：动态课件幻灯片式演示舞台 MVP

- P2 阶段14动态课件幻灯片式演示舞台 MVP 已完成。
- 新增组件：`app/_components/dynamic-courseware-demo.tsx`。
- 学生课件播放器已接入动态演示。
- 教师课件详情页已接入动态课件预览。
- `J-MATH-RJ-71-05-03` 一元一次方程的解法支持单屏推导舞台：完整推导链、当前变化面板、时间轴和播放控制。
- `J-MATH-RJ-71-01-03` 数轴支持 16:9 演示舞台：拖动点、观察相反数、距离区间和到 0 的距离。
- 其他知识点暂用幻灯片式分步理解舞台。
- 浏览器验证：学生端 `/student/courseware/bc26231a-e161-4214-bfd2-3ae5d605bec5` 出现“幻灯片式动态课件”和“同一画面看完整演化”。
- 浏览器验证：学生端点击“播放”后演示推进到后续步骤。
- 浏览器验证：教师端 `/teacher/courseware-history/bc26231a-e161-4214-bfd2-3ae5d605bec5` 出现“动态课件预览”和同一套幻灯片式演示舞台。
- `npx tsc --noEmit` 已通过。
- `git diff --check` 已通过，仅有 Windows LF/CRLF 提示。

## P2 阶段14补强验证状态：完整演化过程与重点标记

- `CoursewareJson` 已新增 `dynamic_storyboards`，新生成结构化课件可携带完整动态演化脚本。
- `dynamic_storyboards[].steps[].emphasis_points` 已用于标记每一步关键知识节点和易漏点。
- `prompts/courseware.md` 已要求 Markdown 课件包含“动态演示脚本”，并要求每一步写出重点标记。
- `prompts/courseware-json.md` 已要求 JSON 输出 `dynamic_storyboards`，每个脚本至少 6 步，公式推导/方程求解等过程建议 8-10 步。
- 学生端动态课件舞台已显示“本步重点”，并对重点内容做醒目高亮。
- 一元一次方程样板动态演示已从 4 步扩展为 8 步，保留观察、整理目标、同减、合并、同加、合并、同除和检查。
- 教师端课件编辑器已显示“动态演示脚本”和“本步重点标记”，老师可编辑每一步的关键提醒。
- 浏览器验证：学生端 `/student/courseware/bc26231a-e161-4214-bfd2-3ae5d605bec5` 显示“本步重点”和 8 步演化。
- 浏览器验证：点击到第 3 步后，页面显示“不能只减一边”和“2x - 2x = 0”。
- 浏览器验证：教师端 `/teacher/courseware-history/bc26231a-e161-4214-bfd2-3ae5d605bec5` 显示动态脚本编辑区和“本步重点标记”。
- `npx tsc --noEmit` 已通过。
- `git diff --check` 已通过，仅有 Windows LF/CRLF 提示。

## P2 阶段14后续补强验证状态：统一 AI 模型网关

- 新增 `lib/ai.ts`，统一管理 AI provider、apiKey、baseURL、model 和按任务模型覆盖。
- `.env.example` 已新增 `AI_PROVIDER`、`AI_API_KEY`、`AI_BASE_URL`、`AI_MODEL` 和任务级模型覆盖变量。
- 支持 provider：`deepseek`、`openai`、`openai-compatible`、`ofox`。
- `lib/deepseek.ts` 已保留旧函数名兼容，但实际调用统一模型网关。
- `lib/courseware.ts` 已改为通过统一模型网关生成 Markdown 课件。
- `lib/courseware-json.ts` 已改为通过统一模型网关生成结构化 JSON。
- `lib/knowledge-explain.ts` 已改为通过统一模型网关生成知识点讲解。
- `lib/student-qa.ts` 已改为通过统一模型网关生成学生答疑。
- 新增教师专用接口：`GET /api/ai-model-test` 查看当前模型配置。
- 新增教师专用接口：`POST /api/ai-model-test` 发送短 prompt 验证当前模型连通性。
- `npx tsc --noEmit` 已通过。

## P2 阶段14补充验证：课件资产化与低成本复用

- `npx tsc --noEmit` 通过。
- `git diff --check` 通过，仅保留当前 Windows LF/CRLF 提示。
- 浏览器验证 `/student/knowledge`：页面标题为“知识点讲解 · 知桥AI”，学生端课件来源标签可见，无近期 console error/warn。
- 浏览器验证 `/teacher/courseware-history/bc26231a-e161-4214-bfd2-3ae5d605bec5`：教师账号可访问课件详情，页面显示“资源资产信息”“低成本复用”“旧课件 / 未记录模型”状态，无近期 console error/warn。
- 验证中发现并修复：客户端组件 type-only 引入 `lib/courseware-json.ts` 仍导致 Next 开发构建追踪 `fs/promises`；已拆出 `lib/courseware-types.ts` 解决。
- 当前样板课件仍为旧记录，所以显示“旧课件 / 未记录模型”；新生成课件会记录 `asset_metadata.generated_by`。

## P2 阶段15验证：课件资源库与学生多课件选择

- `npx tsc --noEmit`：通过。
- `git diff --check`：通过；仅提示 Windows LF/CRLF 换行转换。
- 教师端资源库：新增 `/teacher/courseware-library`，读取当前教师 RLS 可见的 `coursewares`，展示全部、已发布、教师已确认、模型已记录等统计。
- 教师端入口：`/teacher` 已增加“课件资源库”入口。
- 学生端数据：`/student/knowledge` 现在返回同一知识点下所有已发布且结构化的课件资源。
- 学生端交互：同一知识点有多份课件时显示“选择学习课件”；切换后练习提交仍按所选 `courseware.id` 记录。
- 回归约束：未修改 `coursewares` schema，未新增 API，未进入学情分析，未修改业务权限边界。

### P2 阶段15补充修正

- 新增 `lib/courseware-storyboard.ts`：将动态课件 storyboard 规范化逻辑拆到客户端安全文件，避免前端误打包依赖 `fs/promises` 的 `lib/courseware-json.ts`。
- 已将 `courseware-edit`、课件历史详情页、课件历史列表、发布 action、学生练习/进度 API 的纯类型引用改为 `lib/courseware-types.ts` 或 `lib/courseware-storyboard.ts`。
- 当前 `lib/courseware-json.ts` 仅保留给服务端 AI 结构化课件生成 API 使用。

## P2 阶段16验证：资源推荐排序、资源库筛选与 AI 模型设置

- `npx tsc --noEmit`：通过。
- 相关文件 `git diff --check`：通过，仅有 Windows LF/CRLF 提示。
- HTTP 验证：未登录访问 `/teacher/model-settings` 返回 HTTP 307，跳转 `/auth/login?redirect=%2Fteacher%2Fmodel-settings`。
- HTTP 验证：`/auth/login?redirect=/teacher/model-settings` 返回 HTTP 200。
- 浏览器验证：教师账号登录后可访问 `/teacher/model-settings`。
- 浏览器验证：页面标题为“AI模型设置 · 知桥AI”。
- 浏览器验证：页面显示“当前模型矩阵”“连通性测试”“教案生成”“课件结构化 JSON”等内容。
- 浏览器验证：点击“测试模型”后，页面显示“模型返回”，短提示词连通性测试成功。
- 浏览器验证：`/teacher` 工作台显示“AI模型设置”卡片，链接为 `/teacher/model-settings`。
- 浏览器验证：`/teacher/courseware-library?q=一元&status=published` 显示资源库搜索/筛选结果，当前显示 `1 / 6` 份课件。
- 浏览器验证：资源库课件卡片显示推荐标签、推荐分和推荐依据。
- 浏览器验证：教师端课件详情坐标点击可进入 `/teacher/courseware-history/bc26231a-e161-4214-bfd2-3ae5d605bec5`，页面显示动态课件预览。

## P2 阶段17验证：弱项巩固入口与 Prompt 单来源

- `npx tsc --noEmit`：通过。
- 相关文件 `git diff --check`：通过，仅有 Windows LF/CRLF 提示。
- 代码验证：`/student/mastery` 的“针对复习”链接已改为 `/student/review?code={knowledge_point_code}`。
- 代码验证：`/student/mastery` 的“去做基础练习”链接已改为 `/student/knowledge?code={knowledge_point_code}#practice`。
- 代码验证：`/student/knowledge` 已支持读取 `code` query，并传入 `StudentKnowledgeClient.initialCode`。
- 代码验证：`/student/review` 已支持读取 `code` query，并传入 `StudentReviewClient.focusCode`。
- HTTP 验证：未登录访问 `/student/knowledge?code=J-MATH-RJ-71-05-03` 返回 HTTP 307，`Location` 为 `/auth/login?redirect=%2Fstudent%2Fknowledge%3Fcode%3DJ-MATH-RJ-71-05-03`。
- HTTP 验证：未登录访问 `/student/review?code=J-MATH-RJ-71-05-03` 返回 HTTP 307，`Location` 为 `/auth/login?redirect=%2Fstudent%2Freview%3Fcode%3DJ-MATH-RJ-71-05-03`。
- Prompt 验证：`rg "function buildUserPrompt|学生问题：|请严格按以下六个部分|最后用" lib app -n` 未发现业务 Prompt 残留。
- Prompt 文件：`prompts/lesson-generator.md` 已成为教案生成模板来源。
- Prompt 文件：`prompts/student-qa.md` 已成为学生答疑模板来源。
- 命名验证：`app/api/lesson-plan/route.ts` 已直接引用 `@/lib/lesson-plan`，`lib/deepseek.ts` 仅保留兼容导出。

## P2 阶段18验证：教师数据到课件资源操作入口

- `npx tsc --noEmit`：通过。
- 相关文件 `git diff --check`：通过，仅有 Windows LF/CRLF 提示。
- 浏览器验证：教师账号访问 `/teacher/analytics` 成功。
- 浏览器验证：页面“知识点基础掌握信号”表显示“资源”列。
- 浏览器验证：知识点 `J-MATH-RJ-71-05-03` 行显示 `查课件` 链接，href 为 `/teacher/courseware-library?q=J-MATH-RJ-71-05-03`。
- 浏览器验证：知识点 `J-MATH-RJ-71-05-03` 行显示 `生成` 链接，href 为 `/teacher/courseware?knowledgePointCode=J-MATH-RJ-71-05-03&source=analytics`。
- 浏览器验证：“基础掌握快照”表显示 `查看资源` 链接，指向对应知识点资源库筛选结果。
- 代码验证：`/student/knowledge?code=...` 进入时会显示“正在巩固一个弱项知识点”提示。

## P2 阶段19验证：学生错题后的直达巩固动作

- `npx tsc --noEmit`：通过。
- 浏览器验证：已创建并使用专用学生测试账号 `codex-student-e2e@example.com`。
- 浏览器验证：学生访问 `/student/knowledge?code=J-MATH-RJ-71-05-03#practice` 后，页面标题为“知识点讲解 · 知桥AI”，并显示“正在巩固一个弱项知识点”和“基础练习”。
- 浏览器验证：学生在第 1 道基础练习输入错误答案并提交后，页面显示“需要再复习”“你的答案：错误答案”“标准答案：x = 4”。
- 浏览器验证：同一结果卡显示 `复习这个知识点`，href 为 `/student/review?code=J-MATH-RJ-71-05-03`。
- 浏览器验证：同一结果卡显示 `继续基础练习`，href 为 `/student/knowledge?code=J-MATH-RJ-71-05-03#practice`。
- 浏览器验证：学生课件播放器 `/student/courseware/bc26231a-e161-4214-bfd2-3ae5d605bec5` 的错题结果卡也显示同样两个入口。
- 浏览器验证：直接打开 `/student/review?code=J-MATH-RJ-71-05-03`，页面显示聚焦弱项知识点、2 个待复习任务、`去做基础练习` 和 `查看全部复习`。
- 控制台验证：上述本地应用页面无相关 error/warn；浏览器插件自身 Statsig 网络超时不属于项目应用错误。

### P2 阶段19补充验证：动态课件播放节奏修正

- `npx tsc --noEmit`：通过。
- 代码验证：`DynamicCoursewareDemo` 通用 storyboard 舞台与方程样板舞台的自动播放均使用 `stepDuration`。
- 浏览器验证：学生课件播放器 `/student/courseware/bc26231a-e161-4214-bfd2-3ae5d605bec5` 打开后显示动态课件舞台。
- 浏览器验证：普通状态显示 `4 秒节奏`。
- 浏览器验证：点击 `慢放` 后显示 `慢放中` 和 `6 秒节奏`。
- 控制台验证：页面无相关 error/warn。

## P2 阶段20验证：错题到课件练习位置的直达聚焦

- `npx tsc --noEmit`：通过。
- 代码验证：`/student/courseware/[id]` 页面已读取 `practice` query，并传入 `CoursewarePlayerClient.focusPracticeIndex`。
- 代码验证：`CoursewarePlayerClient` 已为练习卡片设置 `id="practice-{number}"` 和 refs。
- 浏览器验证：学生访问 `/student/knowledge?code=J-MATH-RJ-71-05-03#practice` 后，错题卡显示 `打开课件重看本题`。
- 浏览器验证：该链接 href 为 `/student/courseware/bc26231a-e161-4214-bfd2-3ae5d605bec5?practice=0#practice-1`。
- 浏览器验证：打开 `/student/courseware/bc26231a-e161-4214-bfd2-3ae5d605bec5?practice=0#practice-1` 后，页面标题为“课件学习 · 知桥AI”。
- 浏览器验证：课件页显示“正在重看第 1 题”和“先对照上方讲解和动态演示”。
- 浏览器验证：`#practice-1` 卡片包含 `ring-4 ring-amber-300` 高亮样式。
- 浏览器验证：`#practice-1` 卡片显示 `错误原因` 和 `复习这个知识点`。
- 控制台验证：页面无相关 error/warn。

## P2 阶段21验证：复习任务到错题课件的直达入口

- `npx tsc --noEmit`：通过。
- 代码验证：`/student/review` 已查询 `source_practice_record:student_practice_records(...)`。
- 代码验证：复习任务来源记录已做对象/数组兼容归一化。
- 浏览器验证：学生访问 `/student/review?code=J-MATH-RJ-71-05-03` 后，页面标题为“智能复习 · 知桥AI”。
- 浏览器验证：页面显示“正在聚焦一个弱项知识点”“错题来源”“你的答案”“标准答案”“错误原因”。
- 浏览器验证：页面显示 `重看错题课件`，href 为 `/student/courseware/bc26231a-e161-4214-bfd2-3ae5d605bec5?practice=0#practice-1`。
- 浏览器验证：打开该链接后，页面标题为“课件学习 · 知桥AI”，显示“正在重看第 1 题”。
- 浏览器验证：课件页目标练习卡包含 `ring-4 ring-amber-300` 高亮样式，并显示错误原因。
- 控制台验证：页面无相关 error/warn。

## P2 阶段22验证：教师端错题到课件题目的定位入口

- `npx tsc --noEmit`：通过。
- 代码验证：`/teacher/analytics` 已新增 `getTeacherCoursewarePracticeHref(record)`。
- 代码验证：`/teacher/analytics` 最近练习记录表新增 `资源` 列和 `看课件题` 链接。
- 代码验证：`/teacher/analytics` 待复习任务卡已通过 `source_practice_record_id` 映射 `practiceRecordById`，展示错题来源。
- 代码验证：`/teacher/courseware-history/[id]` 已读取 `practice` query。
- 代码验证：`CoursewareJsonEditor` 已支持 `focusPracticeIndex`、自动滚动和 amber 高亮。
- RLS/数据验证：教师测试账号 `codex-courseware-teacher@example.com` 可读取 4 条关联学生练习记录和 4 条复习任务。
- RLS/链接验证：练习记录可构造 `/teacher/courseware-history/bc26231a-e161-4214-bfd2-3ae5d605bec5?practice=0#practice-1`。
- RLS/链接验证：复习任务来源 `source_practice_record_id = 465e3f73-867c-48f7-9809-64faa0c2faf1` 可构造同一课件题目链接。
- 限制：本轮教师端浏览器登录验证被 Browser 插件虚拟剪贴板输入问题阻塞，未完成真实浏览器点击验证；已保留为风险项。

## P2 阶段23验证：完成复习后保留错题来源

- `npx tsc --noEmit`：通过。
- 代码验证：`POST /api/student-review` 完成复习任务后仍调用 `refreshStudentKnowledgeMastery`。
- 代码验证：`POST /api/student-review` select 字段已包含 `source_practice_record_id`、`created_at` 和 `source_practice_record:student_practice_records(...)`。
- 代码验证：API 已对 `source_practice_record` 的对象/数组返回做归一化。
- 代码验证：`StudentReviewClient` 完成复习后合并 task 时保留 `source_practice_record`。
- 结果：完成复习后，错题来源和 `重看错题课件` 不会因为前端状态替换而消失。
- 限制：Node 脚本直接调用本地 API 返回 401，因为当前 SSR Supabase 服务端客户端依赖浏览器 cookie，不识别脚本传入的 Bearer token；未作为业务失败处理。

## P2 阶段24验证：复习完成来源展示与 API 归属硬化

- `npx tsc --noEmit`：通过。
- `git diff --check -- app/api/student-review/route.ts app/student/review/student-review-client.tsx`：通过。
- HTTP 验证：未登录 `POST /api/student-review`，body 为 `{"taskId":"not-owned"}`，返回 HTTP 401 和 `{"error":"请先登录"}`。
- 代码验证：`app/api/student-review/route.ts` 更新任务时包含 `.eq("id", taskId)` 和 `.eq("user_id", user.id)`。
- 代码验证：`app/api/student-review/route.ts` 使用 `.maybeSingle()`，并在 `!task` 时返回 HTTP 404。
- 代码验证：`app/student/review/student-review-client.tsx` 的 completed task 区域显示 `已复盘的错题来源`。
- 代码验证：completed task 区域复用 `getSourcePracticeHref(task)`，来源课件存在时显示 `重看错题课件`。

## P2 阶段25验证：动态课件完整讲解路径

- RED 验证：先新增 `lib/courseware-playback.test.ts`，在辅助模块不存在时测试失败。
- 单元验证：`npx --yes tsx --test lib/courseware-playback.test.ts` 通过。
- TypeScript：`npx tsc --noEmit` 通过。
- 静态检查：相关文件 `git diff --check` 通过。
- 浏览器验证：Playwright CLI 登录学生测试账号 `codex-student-e2e@example.com` 成功进入 `/student/courseware/bc26231a-e161-4214-bfd2-3ae5d605bec5?practice=0`。
- 浏览器验证：页面标题为 `课件学习 · 知桥AI`。
- 浏览器验证：动态课件区域显示 8 步演化过程。
- 浏览器验证：右侧详情显示 `当前画面`、`本步操作`、`为什么可以这样做`、`学生自查`。
- 浏览器验证：第 1 步显示重点 `含 x 的项：4x、2x` 和 `常数项：-3、+5`。
- 控制台验证：无本阶段相关业务错误；仅有 `/favicon.ico` 404。

## 2026-06-14 节点验证汇总：P2 阶段17-23

- TypeScript：阶段17-23 每个阶段完成后均运行 `npx tsc --noEmit`，均通过。
- 代码检查：相关阶段运行 `git diff --check`，均通过；仅出现 Windows LF/CRLF 提示。
- HTTP 验证：未登录访问 `/student/knowledge?code=J-MATH-RJ-71-05-03` 会跳转登录，且 `redirect` 保留 query。
- HTTP 验证：未登录访问 `/student/review?code=J-MATH-RJ-71-05-03` 会跳转登录，且 `redirect` 保留 query。
- Prompt 验证：业务 Prompt 已从 `lesson-plan` 和 `student-qa` 代码中迁移到 `prompts/lesson-generator.md` 与 `prompts/student-qa.md`。
- 浏览器验证：学生账号可访问 `/student/knowledge?code=J-MATH-RJ-71-05-03#practice`，错题后显示复习、继续练习和打开来源课件题目。
- 浏览器验证：学生账号可访问 `/student/review?code=J-MATH-RJ-71-05-03`，显示错题来源、学生答案、标准答案、错误原因和 `重看错题课件`。
- 浏览器验证：学生课件链接 `/student/courseware/bc26231a-e161-4214-bfd2-3ae5d605bec5?practice=0#practice-1` 可显示聚焦提示并高亮对应题目。
- 浏览器验证：动态课件普通节奏和慢放节奏均能显示，通用 storyboard 已使用 `stepDuration`。
- 教师端代码验证：`/teacher/analytics` 已提供弱项知识点查课件、生成课件、练习记录看课件题、复习任务重看课件题目入口。
- 教师端代码验证：`/teacher/courseware-history/[id]` 与结构化编辑器已支持 `practice` query 和题目高亮。
- RLS/数据验证：教师测试账号可读取关联学生练习记录和复习任务，并能构造来源课件题目链接。
- 复习完成验证：`POST /api/student-review` 完成复习后仍调用 `refreshStudentKnowledgeMastery`，并返回/保留 `source_practice_record`。
## P2 阶段26验证：错题回看动态步骤建议

- `npx --yes tsx --test lib/courseware-playback.test.ts`：通过，3 个测试全部 pass。
- `npx tsc --noEmit`：通过。
- Playwright 页面验证：通过。
  - 登录学生账号 `codex-student-e2e@example.com`。
  - 打开 `/student/courseware/bc26231a-e161-4214-bfd2-3ae5d605bec5?practice=0`。
  - 确认基础练习定位提示显示“建议回看动态演示第 4 步：移含 x 的项”。
  - 确认错题结果卡显示同样的动态步骤建议和匹配原因。
- 控制台验证：刷新后 `playwright-cli console error` 无错误，`playwright-cli console warning` 无警告。
## P2 阶段27验证：错题回看自动定位动态演示步骤

- RED 测试：新增 `getInitialPlaybackStepIndex clamps requested dynamic step`，先失败于函数不存在。
- `npx --yes tsx --test lib/courseware-playback.test.ts`：通过，4 个测试全部 pass。
- `npx tsc --noEmit`：通过。
- Playwright 页面验证：通过。
  - 登录学生账号 `codex-student-e2e@example.com`。
  - 打开 `/student/courseware/bc26231a-e161-4214-bfd2-3ae5d605bec5?practice=0`。
  - 确认动态演示显示“第 4 / 8 步”。
  - 确认第 4 步“移含 x 的项”显示“正在讲”。
  - 确认错题提示仍显示“建议回看动态演示第 4 步：移含 x 的项”。
- 控制台：功能相关无错误；仍存在既有 `/favicon.ico` 404。
## P2 阶段28验证：错题建议一键回看动态演示

- RED 测试：新增 `getDynamicReplayTargetId creates stable DOM target ids`，先失败于函数不存在。
- `npx --yes tsx --test lib/courseware-playback.test.ts`：通过，5 个测试全部 pass。
- `npx tsc --noEmit`：通过。
- Playwright 页面验证：通过。
  - 登录学生账号 `codex-student-e2e@example.com`。
  - 打开 `/student/courseware/bc26231a-e161-4214-bfd2-3ae5d605bec5?practice=0`。
  - 页面显示两个“查看动态演示第 4 步”按钮：定位提示区和错题结果卡各一个。
  - 点击错题结果卡按钮后，页面从练习区滚动回动态演示区域。
  - 点击前：`scrollY = 1906`，`replayTop = -1485`，`practiceTop = 118.25`。
  - 点击后：`scrollY = 397`，`replayTop = 24`，`practiceTop = 1627.25`，且 `visibleStep = true`。
- 控制台：功能相关无错误；仍存在既有 `/favicon.ico` 404。
## P2 阶段29验证：练习题到动态步骤强关联字段

- RED 测试：新增 `buildPracticeReplaySuggestion prefers explicit target storyboard step`，先失败于仍使用关键词匹配到第 1 步。
- `npx --yes tsx --test lib/courseware-playback.test.ts`：通过，6 个测试全部 pass。
- `npx tsc --noEmit`：通过。
- Prompt 检查：`prompts/courseware-json.md` 已要求每道 `practice_items` 带 `target_storyboard_step`，并说明为 1-based 步骤编号。
- Playwright 回归：通过。
  - 登录学生账号 `codex-student-e2e@example.com`。
  - 打开 `/student/courseware/bc26231a-e161-4214-bfd2-3ae5d605bec5?practice=0`。
  - 旧样板课件没有新字段时，仍显示“第 4 / 8 步”和“查看动态演示第 4 步”按钮。
- 控制台：功能相关无错误；仍存在既有 `/favicon.ico` 404。
# 已验证补充：P2 阶段32 数轴完整动态分镜

- 单元测试：
  - `npx --yes tsx --test lib/courseware-playback.test.ts` 通过，包含数轴内置分镜测试。
  - `npx --yes tsx --test lib/courseware-storyboard.test.ts` 通过，包含展示归一化测试。
  - `npx --yes tsx --test lib/courseware-edit.test.ts` 通过。
- 类型检查：
  - `npx tsc --noEmit` 通过。
- 教师端浏览器验证：
  - 使用教师测试账号访问 `/teacher/courseware-history/7651acd5-2d1c-4f3a-8778-3d1699082884`。
  - 动态课件预览区显示“数轴完整演化”。
  - 显示 8 步：认识数轴三要素、确定原点、确定正方向、确定单位长度、在数轴上表示正数、在数轴上表示负数、理解相反数、用数轴比较大小。
  - 点击“下一步”后进入第 2 / 8 步“确定原点”，保留上一画面、当前画面、操作依据、学生自查。
- 学生端浏览器验证：
  - 临时发布课件 `7651acd5-2d1c-4f3a-8778-3d1699082884` 后，使用学生测试账号访问 `/student/courseware/7651acd5-2d1c-4f3a-8778-3d1699082884`。
  - 页面显示“数轴完整演化”和 8 步动态分镜。
  - 页面不再显示“保存课件学习进度失败”。
  - 验证后课件已恢复为未发布。

# 已验证补充：ofox / GPT 接入

- 配置验证：
  - `/api/ai-model-test` GET 返回 `provider=ofox`、`model=gpt-4.1-mini`、`baseURL=https://api.ofox.ai/v1`。
  - `lesson-plan`、`courseware`、`courseware-json`、`knowledge-explain`、`student-qa` 五个任务均读取到 ofox 配置。
- 模型连通性：
  - 直连 ofox HTTP 请求返回中文解释。
  - 本地 Node 直连 ofox 超时，确认需要走系统代理；新增 `AI_PROXY_URL` 后应用内模型调用恢复。
- 业务接口验证：
  - `POST /api/lesson-plan`：200，生成教案并写入 `lesson_plans`，记录 `c7160224-68c4-4f27-852c-7b7fa69687fc`。
  - `POST /api/knowledge-explain`：200，生成讲解并写入 `knowledge_explanations`，记录 `37eaf4af-6bce-4b01-a622-7923ab5fa590`。
  - `POST /api/courseware`：200，生成 Markdown 和结构化 JSON 并写入 `coursewares`，记录 `611f1a55-9643-4f5b-a127-11a5e49bbe19`。
  - `POST /api/student-qa`：200，生成学生答疑并写入 `qa_records`，记录 `2fc235b1-e2bc-4dee-b73e-7a77a1cc0e32`。
- 生成质量抽查：
  - 教案 Prompt 调整后不再输出 ```markdown 代码围栏。
  - 教案输出包含教学目标、重点、难点、导入、新授、练习、小结等课堂可用内容。
  - 课件 JSON 包含 `courseware_json_v1`、9 个 slides、3 道 practice_items、1 个 dynamic_storyboards。
- 页面 HTTP 回归：
  - 教师登录态访问 `/teacher`、`/teacher/lesson-generator`、`/teacher/courseware`、`/teacher/courseware-history`、`/teacher/knowledge-explain`、`/teacher/model-settings` 均返回 200。
- 类型检查：
  - `npx tsc --noEmit` 通过。
## P2 阶段35验证：课件优化候选版与老师确认流程

- `npx tsc --noEmit`：通过。
- `npx --yes tsx --test lib/courseware-revisions.test.ts lib/courseware-improvement.test.ts lib/courseware-quality.test.ts lib/courseware-playback.test.ts lib/courseware-storyboard.test.ts lib/courseware-edit.test.ts`：通过，22 项测试通过。
- 新增测试覆盖：
  - 修订状态只接受 `pending | applied | discarded`。
  - 只取最新 pending 候选版。
  - 旧 pending 修订可批量标记为 discarded。
- HTTP 验证：
  - 未登录调用 `POST /api/courseware/{id}/improve` 返回 401。
  - 未登录调用 `POST /api/courseware/{id}/revisions/{revisionId}/apply` 返回 401。
  - 未登录调用 `POST /api/courseware/{id}/revisions/{revisionId}/discard` 返回 401。
  - 未登录访问课件详情页返回 307，并跳转登录页。
- 已确认：
  - improve 不再直接覆盖正式课件。
  - 学生端仍只读取正式 `coursewares.content_json`。

## P2 阶段34验证：质量问题驱动的课件优化闭环

- `npx tsc --noEmit`：通过。
- `npx --yes tsx --test lib/courseware-improvement.test.ts lib/courseware-quality.test.ts lib/courseware-playback.test.ts lib/courseware-storyboard.test.ts lib/courseware-edit.test.ts`：通过，19 项测试通过。
- 规则验证：
  - `buildCoursewareQualityImprovementFeedback` 只把失败检查转为模型优化要求。
  - `buildCoursewareJsonReference` 会省略旧课件中的大段 HTML，避免把旧版互动页原样喂回模型。
- HTTP 验证：
  - 未登录访问 `/teacher/courseware-history/2e60da6f-ba1e-4f99-9aee-9efc71ce65c2` 返回 307，跳转 `/auth/login?redirect=...`。
  - 未登录调用 `POST /api/courseware/2e60da6f-ba1e-4f99-9aee-9efc71ce65c2/improve` 返回 401。
- 已确认：
  - 本轮没有新增数据库表或字段。
  - 本轮没有修改模型密钥配置。
  - 本轮不进入学情分析新模块。
## P2 阶段36验证：课件优化候选版改动摘要

- TypeScript 验证通过：
  - `npx tsc --noEmit`
- 自动化测试通过：
  - `npx --yes tsx --test lib/courseware-revision-diff.test.ts lib/courseware-revisions.test.ts lib/courseware-improvement.test.ts lib/courseware-quality.test.ts lib/courseware-playback.test.ts lib/courseware-storyboard.test.ts lib/courseware-edit.test.ts`
  - 结果：23 个测试全部通过。
- 已确认行为：
  - 候选版改动摘要能显示质量分变化。
  - 候选版改动摘要能显示幻灯片页数变化。
  - 候选版改动摘要能显示动态讲解步骤变化。
  - 候选版改动摘要能显示基础练习数量变化。
  - 候选版改动摘要能列出新增或重写的页面标题。
  - 候选版确认流程仍保持“老师确认后才覆盖正式课件”的产品原则。
## P2 阶段37验证：候选版质量复核摘要

- TypeScript 验证通过：
  - `npx tsc --noEmit`
- 自动化测试通过：
  - `npx --yes tsx --test lib/courseware-quality-summary.test.ts lib/courseware-revision-diff.test.ts lib/courseware-revisions.test.ts lib/courseware-improvement.test.ts lib/courseware-quality.test.ts lib/courseware-playback.test.ts lib/courseware-storyboard.test.ts lib/courseware-edit.test.ts`
  - 结果：25 个测试全部通过。
- 已确认行为：
  - 能把未通过的 required 质量项归入“必须复核”。
  - 能把未通过的 recommended 质量项归入“建议优化”。
  - 全部通过时显示“可进入人工确认”。
  - 候选版对比区同时保留采用新版、放弃新版、当前版预览、优化版预览。
## P2 阶段38验证：候选版采用保护

- TypeScript 验证通过：
  - `npx tsc --noEmit`
- 自动化测试通过：
  - `npx --yes tsx --test lib/courseware-revision-apply-guard.test.ts lib/courseware-quality-summary.test.ts lib/courseware-revision-diff.test.ts lib/courseware-revisions.test.ts lib/courseware-improvement.test.ts lib/courseware-quality.test.ts lib/courseware-playback.test.ts lib/courseware-storyboard.test.ts lib/courseware-edit.test.ts`
  - 结果：28 个测试全部通过。
- 已确认行为：
  - 必选质量项通过时，候选版可直接采用。
  - 必选质量项未通过时，默认不允许直接采用。
  - 老师勾选风险确认后，仍可自主采用候选版。
  - 放弃候选版流程不受采用保护影响。
## P2 阶段39-44验证：课件质量闭环增强

- TypeScript 验证通过：
  - `npx tsc --noEmit`
- 自动化测试通过：
  - `npx --yes tsx --test lib/courseware-improve-presets.test.ts lib/courseware-publish-guard.test.ts lib/courseware-human-review.test.ts lib/courseware-improve-ui.test.ts lib/courseware-adoption-advice.test.ts lib/courseware-revision-apply-guard.test.ts lib/courseware-quality-summary.test.ts lib/courseware-revision-diff.test.ts lib/courseware-revisions.test.ts lib/courseware-improvement.test.ts lib/courseware-quality.test.ts lib/courseware-playback.test.ts lib/courseware-storyboard.test.ts lib/courseware-edit.test.ts`
  - 结果：43 个测试全部通过。
- 浏览器验证通过：
  - 课件详情页可打开。
  - 页面出现教师人工验收清单。
  - 页面出现优化候选版预设按钮：补全推导、减少 AI 腔、优化投屏。
  - 浏览器 console 无应用错误。
- API 验证：
  - 未登录调用候选版 apply API 返回 401。
  - 未登录访问课件详情仍返回 307。
