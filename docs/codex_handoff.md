# 知桥AI Codex 项目交接文档

## P2 阶段33交接：内容效果优先质量门禁

- 本阶段已完成，准备提交并推送。
- 产品判断：后续开发不以功能清单为核心，而以“老师是否更容易讲清楚、学生是否真正看懂练会”为核心。
- 改动范围：
  - `lib/courseware-quality.ts`：新增内容质量规则检查，覆盖知识点追踪、前置知识、完整例题、步骤依据、易错点、分层练习、动态分镜、投屏 HTML、学生复习复用。
  - `lib/courseware-quality.test.ts`：新增规则测试样例。
  - `lib/courseware-html.ts`：HTML 动态课件生成接入质量检查反馈，不合格时要求模型重做。
  - `app/api/courseware/[id]/dynamic/route.ts`：把质量报告写入 `asset_metadata.content_quality`。
  - `app/teacher/courseware-history/[id]/page.tsx`：新增“内容效果检查”面板。
  - `prompts/lesson-generator.md`、`prompts/courseware.md`、`prompts/courseware-json.md`、`prompts/courseware-html.md`：同步强化内容有效性要求。
- 验证结果：
  - `npx tsc --noEmit` 通过。
  - 浏览器验证课件详情页显示“内容效果检查”“内容质量分”和建议动作。
  - 浏览器验证当前样板课件质量分为 93，必选项通过，建议项提示版式变化仍可优化。
  - 浏览器验证投屏预览页仍正常显示工具栏和 iframe。
- 下一步建议：
  - 用 `J-MATH-RJ-71-05-03` 一元一次方程和 `J-MATH-RJ-71-01-03` 数轴重新生成多版课件，对比模型输出质量。
  - 把质量分作为是否发布、是否进入资源库精选的参考信号。
  - 后续可增加人工“老师确认有效”标记，但不要把规则分数误当成最终教学质量。

## P2 阶段31交接：动态课件低质量分镜回退与 Prompt 强化

- 本阶段已完成，未提交、未 push。
- 改动范围：
  - `lib/courseware-playback.ts`：导出 `getBuiltInDynamicStoryboard`，供归一化逻辑复用内置高质量分镜。
  - `lib/courseware-storyboard.ts`：识别低质量 AI 分镜；样板知识点有内置分镜时自动回退。
  - `lib/courseware-storyboard.test.ts`：新增低质量分镜回退测试。
  - `prompts/courseware-json.md`：明确禁止泛化步骤标题、泛化操作和空泛画面状态。
- 浏览器结果：教师样本课件 `/teacher/courseware-history/bc26231a-e161-4214-bfd2-3ae5d605bec5?practice=0` 的“对应动态讲解步骤”下拉已显示清晰步骤：原方程、确定整理目标、两边同减 2x、移含 x 的项等。
- 验证结果：
  - `npx --yes tsx --test lib/courseware-storyboard.test.ts` 通过。
  - `npx --yes tsx --test lib/courseware-playback.test.ts` 通过。
  - `npx tsc --noEmit` 通过。
- 下一步建议：继续把“数轴”也沉淀成同等级别的内置动态分镜，并让学生端错题回看优先展示教师手动绑定后的步骤。

## P2 阶段30交接：教师端练习题绑定动态步骤编辑能力

- 本阶段已完成，未提交、未 push。
- 改动范围：
  - `lib/courseware-edit.ts`：新增 `getPracticeTargetStepOptions`，为练习题编辑器生成动态步骤下拉选项；步骤标题为空或为“第 N 步”时，会回退使用操作、公式或画面状态。
  - `lib/courseware-edit.test.ts`：新增编辑辅助函数测试。
  - `app/teacher/courseware-history/[id]/courseware-json-editor.tsx`：每道练习题新增“对应动态讲解步骤”下拉框。
- 交互行为：老师可以保留“自动匹配动态步骤”，也可以手动选择第 N 个动态步骤；保存后仍走现有 `PUT /api/courseware/[id]` 和 `normalizeEditedCoursewareJson`。
- 验证结果：
  - `npx --yes tsx --test lib/courseware-edit.test.ts` 通过。
  - `npx --yes tsx --test lib/courseware-playback.test.ts` 通过。
  - `npx tsc --noEmit` 通过。
  - Playwright 登录教师账号访问 `/teacher/courseware-history/bc26231a-e161-4214-bfd2-3ae5d605bec5?practice=0`，确认页面包含“对应动态讲解步骤”和提示文案。
- 下一步建议：继续优化动态 storyboard 的生成质量，让 AI 输出的步骤标题、操作、公式更具体，避免旧样本中“按顺序完成本步变形”这类泛化文案。

## 1. 项目当前状态

- 项目已从 GitHub 成功恢复到本地。
- P0/P1 回归验证已通过。
- P2 阶段1已完成：知识点讲解功能已接入 `knowledge_points`、DeepSeek 生成、结果落库与基础 RLS 验证。
- 教师端与学生端均已完成知识点讲解调用验证。
- 当前路线已调整：不要马上进入学情分析，先做教师端完整化，下一步为 AI 课件生成 MVP。
- 产品核心原则：所有教师端和学生端功能都必须服务“教育大纲基础知识打牢”，并以 `knowledge_point_code` 作为长期数据主线。
- P2 阶段2 AI 课件生成 MVP 已实现，并已完成教师登录态真实浏览器点击生成验证。
- P2 阶段2收尾课件历史已实现，教师可查看自己的课件列表与详情。
- P2 阶段3结构化课件 JSON 已实现，新生成课件会同时写入 `content_markdown` 与 `content_json`。
- P2 阶段5基础练习与掌握记录 MVP 已实现，学生可提交已发布课件中的基础练习并写入 `student_practice_records`。
- P2 阶段6日/周复习系统 MVP 已实现，学生练习后会生成错题复习与一周回顾任务，并可在 `/student/review` 完成复习。
- P2 阶段7两端数据整合最小版已实现，教师可在 `/teacher/analytics` 查看已关联学生的练习、复习与知识点统计。
- P2 阶段10学生端可视化课件播放器 MVP 已实现，学生可打开老师已发布课件分页学习并提交练习。
- P2 阶段11学生学习进度与课件学习记录 MVP 已实现，教师端学习数据页可查看学生课件学习完成信号。
- P2 阶段12掌握度规则 MVP 已实现，基于课件进度、练习记录和复习任务生成学生-知识点基础掌握信号。
- P2 阶段13学生弱项知识点视图 MVP 已实现，学生可查看自己的待巩固知识点和下一步建议。
- P2 阶段14动态课件幻灯片式演示舞台 MVP 已实现，教师端可预览、学生端可在同一画面观看完整演化过程。
- P2 阶段14补强已完成：所有后续结构化课件都应携带 `dynamic_storyboards`，每一步必须保留完整过程、操作依据、学生检查点和重点标记。
- P2 阶段14后续补强已完成：新增统一 AI 模型网关，可通过服务端环境变量切换 DeepSeek、OpenAI、OpenAI-compatible 和 ofox 类模型。

## 2. 本地路径

```text
D:\Codex\Projects\Active\zhiqiao-AI
```

## 3. GitHub 仓库

```text
https://github.com/dongliangzou1981/zhiqiao-AI.git
```

## 4. 当前分支

```text
main
```

## 5. 最近 5 次提交

```text
e1009c1 新增Supabase连接测试页面
44ea369 完成Supabase基础环境搭建
51604f8 完成Supabase接入计划
eea89a5 完成Supabase数据库设计
70be27d 完成学生AI答疑与教案历史功能
```

## 6. 技术栈

- Next.js App Router
- TypeScript
- React
- Tailwind CSS
- DeepSeek API via OpenAI-compatible SDK
- Supabase client/server helper
- react-markdown

## 7. 目录结构说明

- `app/`：Next.js 应用页面、布局、API Route，包含教师端、学生端和 Supabase 测试页。
- `lib/`：DeepSeek 调用、学生答疑、教案历史 localStorage 工具、Supabase client/server 创建逻辑。
- `data/`：初中数学知识库静态数据。
- `docs/`：产品、架构、数据库、Supabase 接入和交接文档。
- `prompts/`：AI Prompt 模板，目前包含教案生成模板。
- `supabase/`：Supabase/PostgreSQL schema。
- 根目录配置：`package.json`、`tsconfig.json`、`tailwind.config.ts`、`next.config.ts`、`eslint.config.mjs` 等。

## 8. 已实现功能

- 首页入口：提供教师端和学生端入口。
- 教师工作台：展示待办、AI 工具、班级概览、近期活动。
- 教案生成：按本地数学知识库选择年级、学期、章节、知识点，调用 `/api/lesson-plan` 生成 Markdown 教案。
- 教案历史：生成后保存到浏览器 localStorage，可列表查看和详情查看。
- 知识库展示：教师端展示本地初中数学知识库树。
- 学生学习中心：展示今日任务、学习进度、AI 工具和近期记录。
- 学生 AI 答疑：聊天式页面调用 `/api/student-qa`。
- Supabase 基础接入：包含 client/server helper、schema 文档和连接测试页。
- 知识点讲解：教师端 `/teacher/knowledge-explain` 与学生端 `/student/knowledge` 读取 `knowledge_points`，调用 `POST /api/knowledge-explain` 生成讲解并写入 `knowledge_explanations`。
- AI 课件生成 MVP：教师端 `/teacher/courseware` 读取 `knowledge_points`，调用 `POST /api/courseware` 生成知识点导向中文 Markdown 课件，并写入 `coursewares`。
- 课件历史：教师端 `/teacher/courseware-history` 读取当前教师自己的 `coursewares`，可进入 `/teacher/courseware-history/[id]` 查看 Markdown 正文。
- 结构化课件 JSON：`POST /api/courseware` 同步生成 `coursewares.content_json`，详情页展示结构化摘要。
- 学生知识点学习：学生端 `/student/knowledge` 读取已发布结构化课件，展示学习目标、核心概念、例题、易错点与基础练习。
- 基础练习记录：学生端 `/student/knowledge` 支持提交练习答案，`POST /api/student-practice` 服务端读取标准答案并写入 `student_practice_records`。
- 智能复习：学生端 `/student/review` 展示个人错题复习与一周回顾任务，`POST /api/student-review` 支持完成任务。
- 学习数据：教师端 `/teacher/analytics` 展示已关联学生的练习提交、正确率、待复习任务、知识点基础掌握信号和最近练习记录。
- 课件学习进度：学生端 `/student/courseware/[id]` 记录打开、翻页和完成状态，教师端 `/teacher/analytics` 展示课件学习记录。
- 基础掌握信号：`student_knowledge_mastery` 汇总课件、练习、复习数据，教师端展示基础掌握快照。
- 学生弱项知识点：学生端 `/student/mastery` 展示待巩固知识点、原因和下一步建议。
- 动态课件：学生端 `/student/courseware/[id]` 和教师课件详情已接入 HTML 互动演示。
- 完整演化脚本：`content_json.dynamic_storyboards` 已作为后续所有课件动态展示的数据入口。
- AI 模型网关：`lib/ai.ts` 已统一管理 provider、baseURL、apiKey 和 model。

## 8.0 产品路线原则

- 教师端：减轻老师备课、课件、讲解、练习、课堂组织负担。
- 学生端：帮助学生打牢教育大纲中的基础知识，轻松自学、复习、练习、发现弱项。
- 所有后续能力都必须挂回知识点掌握：教育大纲/教材知识点 → 教师备课与讲解 → 课堂课件与练习 → 学生自学与复习 → 知识点掌握记录 → 弱项定位与巩固。
- AI 课件不是为了好看，而是为了把知识点拆清楚。
- 教学动画不是为了炫技，而是为了解释抽象概念和变化过程。
- 游戏化练习不是为了娱乐，而是为了让基础知识练得下去。
- 学情分析不是先做报表，而是基于知识点掌握数据找弱项。

## 8.1 P2 阶段1新增内容

- 页面：`app/teacher/knowledge-explain/page.tsx`、`app/student/knowledge/page.tsx`
- 客户端组件：`app/teacher/knowledge-explain/knowledge-explain-client.tsx`、`app/student/knowledge/student-knowledge-client.tsx`
- API：`app/api/knowledge-explain/route.ts`
- Prompt：`prompts/knowledge-explain.md`
- AI 调用：`lib/knowledge-explain.ts`
- 数据库：`public.knowledge_explanations`
- SQL：`supabase/add-knowledge-explanations.sql`

## 8.2 P2 阶段2新增内容

- 页面：`app/teacher/courseware/page.tsx`
- 客户端组件：`app/teacher/courseware/courseware-client.tsx`
- API：`app/api/courseware/route.ts`
- Prompt：`prompts/courseware.md`
- AI 调用：`lib/courseware.ts`
- 数据库：`public.coursewares`
- SQL：`supabase/add-coursewares.sql`
- 课件历史列表：`app/teacher/courseware-history/page.tsx`
- 课件历史详情：`app/teacher/courseware-history/[id]/page.tsx`
- 课件读取封装：`lib/coursewares.ts`
- 结构化课件 Prompt：`prompts/courseware-json.md`
- 结构化课件生成封装：`lib/courseware-json.ts`
- 学生练习提交 API：`app/api/student-practice/route.ts`
- 学生复习任务 API：`app/api/student-review/route.ts`
- 学生端知识点学习客户端：`app/student/knowledge/student-knowledge-client.tsx`
- 学生端智能复习页：`app/student/review/page.tsx`
- 学生端智能复习客户端：`app/student/review/student-review-client.tsx`
- 学生练习记录表：`public.student_practice_records`
- 学生复习任务表：`public.student_review_tasks`
- 教师-学生关联表：`public.teacher_student_links`
- 学生课件学习进度表：`public.student_courseware_progress`
- 学生知识点掌握信号表：`public.student_knowledge_mastery`
- SQL：`supabase/add-student-practice-records.sql`
- SQL：`supabase/add-student-review-tasks.sql`
- SQL：`supabase/add-teacher-student-links.sql`
- SQL：`supabase/add-student-courseware-progress.sql`
- SQL：`supabase/add-student-knowledge-mastery.sql`

## 9. 当前可运行入口

按 README 记录，项目入口为：

```text
首页：http://localhost:3000
教师工作台：http://localhost:3000/teacher
```

注意：本次交接未安装依赖、未启动项目，因此以上入口尚未在当前环境验证。

## 10. Supabase 当前状态

- 已存在 `supabase/schema.sql`。
- 已存在 `lib/supabase/client.ts` 和 `lib/supabase/server.ts`。
- 已存在 `app/test-supabase/page.tsx` 连接测试页。
- 已存在 `docs/database-schema.md` 与 `docs/supabase-integration-plan.md`。
- `knowledge_points` 已被教师端和学生端页面读取验证。
- `knowledge_explanations` 已完成写入验证。
- `knowledge_explanations` 基础 RLS 已验证：匿名角色不可直接读取，已登录角色可按策略访问。
- `coursewares` 已创建并启用 RLS。
- `coursewares` 已限制为 authenticated `select` / `insert`，策略限制教师只能读写自己的课件。
- `student_practice_records` 已创建并启用 RLS，学生只能读写自己的练习记录。
- `student_review_tasks` 已创建并启用 RLS，学生只能读取和更新自己的复习任务。
- `teacher_student_links` 已创建并启用 RLS，教师只能读取自己的学生关联范围。
- `student_courseware_progress` 已创建并启用 RLS，学生只能写入和读取自己的课件学习进度，教师只能读取已关联学生进度。
- `student_knowledge_mastery` 已创建并启用 RLS，学生只能刷新和读取自己的掌握信号，教师只能读取已关联学生掌握信号。
- `student_practice_records` 与 `student_review_tasks` 已增加教师只读策略，教师仅可读取已关联学生的数据。
- `profiles` 远端已启用 RLS，教师只能读取自己的 profile 与已关联学生 profile。

## 11. Prompt 文件状态

- `prompts/lesson-generator.md` 已存在。
- `prompts/knowledge-explain.md` 已存在，作为知识点讲解 Prompt 来源。
- `prompts/courseware.md` 已存在，作为 AI 课件生成 Prompt 来源。
- 当前模板用途：根据教材知识点生成结构化教案。
- 代码中教案生成逻辑也在 `lib/deepseek.ts` 内内置了系统提示词与用户提示词构造逻辑。
- 学生答疑提示词在 `lib/student-qa.ts` 内内置。
- `lesson-plan` / `student-qa` 仍有 Prompt 双来源技术债；知识点讲解已使用独立 Prompt 文件。

## 12. 下一步建议

1. P2 阶段4：学生端知识点学习闭环只读 MVP 已完成。
2. P2 阶段4收尾：教师端课件发布/取消发布 MVP 已完成，学生端只读取已发布学习资源。
3. P2 阶段5：基础练习与掌握记录 MVP 已完成。
4. P2 阶段6：日/周复习系统 MVP 已完成。
5. P2 阶段7：两端数据整合最小版已完成。
6. 下一阶段建议进入 P2 阶段8准备：先设计掌握度规则或补教师端学生范围管理，不直接做完整学情分析大屏。
7. 不直接进入完整学情分析。
8. 保留技术债跟踪：`lesson-plan` / `student-qa` Prompt 双来源问题。

## 12.1 AI 课件生成 MVP 规格

- 页面：`/teacher/courseware`。
- API：`POST /api/courseware`。
- Prompt：`prompts/courseware.md`。
- AI 调用封装：`lib/courseware.ts`。
- 数据库：`coursewares`，必须关联 `knowledge_point_code`。
- 第一版输出：中文 Markdown 课件。
- 已实现：结构化 JSON，字段包括 `knowledge_point_code`、`learning_goals`、`slides`、`examples`、`common_mistakes`、`practice_items`、`summary_points`、`review_plan`。
- 必须包含：本课对应知识点、学习目标、前置知识、核心概念、分步讲解、典型例题、易错点、基础练习、小结、课后巩固。
- 当前状态：已实现；真实教师登录生成已验证。

## 12.2 后续路线

1. 教师端课件生成 MVP。（已完成）
2. 结构化课件 JSON。（已完成）
3. 学生端知识点学习闭环。（已完成只读 MVP）
4. 课件发布与学生端可见范围。（已完成 MVP）
5. 基础练习与掌握记录。（已完成 MVP）
6. 日/周复习系统。（已完成 MVP）
7. 两端数据整合。（已完成最小版）
8. 学情分析。（后置）
9. 多语种扩展。

## 13. 风险与注意事项

- AI 课件生成 MVP 已完成教师登录态真实浏览器点击生成验证；样板知识点为 `J-MATH-RJ-71-01-03` 数轴。
- 当前验证覆盖未登录保护、字段校验、API 调用、DeepSeek 调用、数据写入、基础 RLS、真实浏览器点击和 TypeScript。
- 课件历史已完成列表、详情、未登录跳转、RLS 与真实浏览器验证。
- 结构化课件 JSON 已完成生成、校验、落库、详情摘要展示、RLS 与真实浏览器验证。
- 学生端知识点学习闭环只读 MVP 已完成，复用 `knowledge_points`、`knowledge_explanations` 与 `coursewares.content_json`。
- 学生端真实浏览器验证已通过：`/student/knowledge` 显示结构化学习包、基础练习和样板点 `J-MATH-RJ-71-05-03`。
- 课件发布/取消发布 MVP 已完成：教师详情页可发布或取消发布，学生端只读取 `is_published = true` 且 `content_json is not null` 的课件资源。
- `coursewares_student_select_learning` 已收紧为发布后可见；当前仍未做班级级别隔离。
- 基础练习与掌握记录 MVP 已完成：学生可在 `/student/knowledge` 提交已发布课件中的基础练习，结果写入 `student_practice_records`。
- `POST /api/student-practice` 从服务端读取已发布课件 JSON 中的题目和标准答案，当前只做答案标准化后的精确匹配。
- `student_practice_records` 当前允许学生读写自己的记录，教师可只读查看已关联学生记录；完整班级学情分析仍后置。
- 日/周复习系统 MVP 已完成：学生提交练习后自动生成错题次日复习和一周回顾任务，任务写入 `student_review_tasks`。
- `/student/review` 已完成真实浏览器验证，学生可查看并完成自己的复习任务。
- `student_review_tasks` 当前允许学生读取和更新自己的任务，教师可只读查看已关联学生任务；完整班级学情分析仍后置。
- 两端数据整合最小版已完成：教师端 `/teacher/analytics` 可只读查看已关联学生的练习和复习数据。
- 当前使用 `teacher_student_links` 控制教师可见范围；暂不支持教师端自行添加/移除学生。
- 当前页面是“学习数据”而非完整“学情分析”，不计算掌握度模型、不生成班级诊断建议。
- 教案历史目前使用 localStorage，跨设备、跨浏览器和登录态下不可共享。
- `lesson-plan` / `student-qa` Prompt 存在文件模板与代码内模板两处来源，后续可能出现内容不一致。
- 不应直接进入完整学情分析；当前已有练习、复习和教师只读数据视图，但仍缺少学生范围管理、掌握度模型和课堂互动数据。
- 不应一开始做多学科、复杂三维或多语种；先用中文初中数学打通基础知识闭环。
- 原 `D:\Codex\Projects\Active\知桥AI` 空仓库状态需继续确认；当前目录中曾观察到 `知桥AI-empty`，未在本次任务中修改。

## 14. P2 阶段8准备交接：教师端学生范围管理 MVP

- 当前状态：P2 阶段8准备已完成，教师端已经可以通过 `/teacher/students` 管理可查看学习数据的学生范围。
- 新增页面：`app/teacher/students/page.tsx`。
- 新增 server actions：`app/teacher/students/actions.ts`。
- 新增 SQL：`supabase/add-teacher-student-link-management.sql`。
- 更新数据库：`teacher_student_links` 已支持教师 insert/delete，远端 Supabase 已应用迁移 `add_teacher_student_link_management`。
- 更新 RLS：新增 `private.is_student(user_id uuid)`，教师只能添加真实学生账号，学生不能写入教师-学生关联表。
- 更新入口：教师工作台新增“学生范围”，`/teacher/analytics` 新增“管理学生范围”入口和空状态跳转。
- 学生端更新：`/student` 展示“我的学生ID”，用于发给老师建立关联。
- 验证结论：教师可移除并重新添加测试学生；重新添加后 `/teacher/analytics` 恢复显示该学生的 `J-MATH-RJ-71-05-03` 学习数据。
- 当前限制：不做全量学生搜索，不做班级导入，不做学生授权确认，不做掌握度模型。

## 15. 下一阶段建议

1. P2 阶段8：掌握度规则 MVP。
2. 先基于现有 `student_practice_records` 与 `student_review_tasks` 计算学生-知识点基础掌握状态。
3. 最小目标是新增 `student_knowledge_mastery` 或等价只读计算视图，用于标记“待巩固 / 基本掌握 / 持续稳定”。
4. 教师端 `/teacher/analytics` 可先展示掌握度信号，不生成完整学情分析报告。
5. 继续围绕中文初中数学样板点验证，不扩展多学科、不做复杂三维、不做多语种。

## 16. P2 阶段9交接：课件编辑与可视化预览 MVP

- 当前状态：P2 阶段9已完成，教师可以在课件详情页编辑结构化课件内容。
- 新增组件：`app/teacher/courseware-history/[id]/courseware-json-editor.tsx`。
- 新增 API：`app/api/courseware/[id]/route.ts`，支持 `PUT /api/courseware/[id]` 保存编辑后的 `content_json`。
- 新增校验封装：`lib/courseware-edit.ts`。
- 新增 SQL：`supabase/allow-teacher-update-courseware-content-json.sql`。
- 远端 Supabase 已应用迁移：`allow_teacher_update_courseware_content_json`。
- 教师可编辑：学习目标、课堂小结、课件页标题、课件页正文、老师备注、基础练习题、答案、解析、难度。
- 保存策略：保存编辑后自动取消发布，老师必须重新发布，学生端才会看到新版本。
- 权限结论：未登录 API 返回 401；其他教师编辑不属于自己的课件返回 404；教师只能编辑自己的课件。
- 当前限制：只做结构化 HTML 化预览的基础形态，不做 PPTX 导出、不做复杂动画、不接入 ofox/ChatGPT 等新模型。

## 17. 下一阶段建议

1. P2 阶段10：学生端可视化课件播放器 MVP。
2. 将已发布的 `coursewares.content_json` 在学生端渲染为分页学习体验，而不只是在知识点页展示摘要。
3. 保留练习提交、复习任务和 `knowledge_point_code` 主线。
4. 暂不进入完整学情分析；播放器稳定后再做掌握度规则。

## 18. P2 阶段10交接：学生端可视化课件播放器 MVP

- 当前状态：P2 阶段10已完成，学生端可打开老师发布的结构化课件进行分页学习。
- 新增页面：`app/student/courseware/[id]/page.tsx`。
- 新增组件：`app/student/courseware/[id]/courseware-player-client.tsx`。
- 更新入口：`app/student/knowledge/student-knowledge-client.tsx` 已在学习包区域加入“打开课件学习”。
- 数据来源：`coursewares.content_json`，并要求 `is_published = true`、`content_json is not null`。
- 播放器能力：课件目录、进度条、上一页/下一页、学习目标、核心概念、课后巩固和基础练习。
- 练习能力：播放器内继续调用 `POST /api/student-practice`，生成 `student_practice_records` 和 `student_review_tasks`。
- 验证结论：学生从 `/student/knowledge` 可进入 `/student/courseware/bc26231a-e161-4214-bfd2-3ae5d605bec5`，可翻页并提交练习。
- 当前限制：仍不是复杂动画课件，不做三维、不做 PPTX、不做课堂互动回收。

## 19. 下一阶段建议

1. P2 阶段11：学生学习进度与课件学习记录 MVP。
2. 记录学生是否打开课件、看到了第几页、是否完成课件学习。
3. 将课件学习记录与练习记录、复习任务合并，为掌握度规则提供更完整数据。
4. 继续避免完整学情分析大屏，先补数据闭环的可靠性。

## 20. P2 阶段11交接：学生学习进度与课件学习记录 MVP

- 当前状态：P2 阶段11已完成，学生端课件播放器已记录打开、翻页和完成状态。
- 新增 API：`app/api/student-courseware-progress/route.ts`，支持学生写入课件学习进度。
- 新增数据表：`public.student_courseware_progress`。
- 新增 SQL：`supabase/add-student-courseware-progress.sql`。
- 更新页面：`app/student/courseware/[id]/page.tsx` 读取当前学生进度并传入播放器。
- 更新组件：`app/student/courseware/[id]/courseware-player-client.tsx` 自动保存进度并提供“标记完成学习”。
- 更新教师端：`app/teacher/analytics/page.tsx` 展示课件学习指标、学生课件完成数和最近课件学习记录。
- 权限结论：学生只能查看/更新自己的进度；关联教师可只读查看；其他教师不可见。
- 验证结论：学生样板课件 `bc26231a-e161-4214-bfd2-3ae5d605bec5` 已完成学习记录，教师端学习数据页可见“课件学习 1/1”。
- 当前限制：仍不计算掌握度模型，不做完整学情分析，不做课堂互动数据回收。

## 21. 下一阶段建议

1. P2 阶段12：掌握度规则 MVP。
2. 输入数据使用 `student_courseware_progress`、`student_practice_records`、`student_review_tasks`。
3. 输出先做“待巩固 / 基本掌握 / 持续稳定”等基础掌握信号。
4. 教师端继续定位为学习数据增强，不直接做完整学情分析报告。

## 22. P2 阶段12交接：掌握度规则 MVP

- 当前状态：P2 阶段12已完成，系统已经能生成学生-知识点基础掌握信号。
- 新增计算封装：`lib/student-mastery.ts`。
- 新增 API：`app/api/student-mastery/refresh/route.ts`。
- 新增数据表：`public.student_knowledge_mastery`。
- 新增 SQL：`supabase/add-student-knowledge-mastery.sql`。
- 远端 Supabase 已应用迁移：`add_student_knowledge_mastery`。
- 自动刷新接入点：`POST /api/student-practice`、`POST /api/student-review`、`POST /api/student-courseware-progress`。
- 教师端更新：`app/teacher/analytics/page.tsx` 已展示“待巩固”指标和“基础掌握快照”。
- 权限结论：学生只能读写自己的掌握信号；关联教师可只读查看；其他教师不可见。
- 当前限制：掌握分是规则化信号，不是精准学情模型；不做复杂遗忘曲线、难度权重、步骤评分。

## 23. P2 阶段13交接：学生弱项知识点视图 MVP

- 当前状态：P2 阶段13已完成，学生可以查看自己的待巩固知识点。
- 新增页面：`app/student/mastery/page.tsx`。
- 更新入口：`app/student/page.tsx` 已新增“弱项知识点”入口。
- 页面能力：展示掌握等级、掌握分、练习正确率、待复习任务、课件学习完成数、原因和下一步建议。
- 验证结论：学生可从 `/student` 进入 `/student/mastery`，并看到样板点 `J-MATH-RJ-71-05-03` 的待巩固信号。
- 当前限制：页面只引导学生回到知识点学习和智能复习，暂不生成专项练习题。

## 24. 下一阶段建议

1. P2 阶段14：弱项巩固练习入口 MVP。
2. 从 `/student/mastery` 的待巩固知识点出发，进入对应知识点的练习/复习入口。
3. 优先复用已发布课件中的 `practice_items`，不要先做复杂题库。
4. 教师端可后续增加“按弱项布置复习”的轻量能力。

## 25. P2 阶段14交接：动态课件幻灯片式演示舞台 MVP

- 当前状态：P2 阶段14已完成，动态课件已从小组件式演示升级为幻灯片式演示舞台。
- 新增组件：`app/_components/dynamic-courseware-demo.tsx`。
- 学生端接入：`app/student/courseware/[id]/courseware-player-client.tsx`。
- 教师端接入：`app/teacher/courseware-history/[id]/page.tsx`。
- 样板能力一：`J-MATH-RJ-71-05-03` 一元一次方程的解法，支持 16:9 单屏推导舞台、完整推导链、当前变化面板、时间轴和播放控制。
- 样板能力二：`J-MATH-RJ-71-01-03` 数轴，支持 16:9 演示舞台、拖动点、相反数、距离区间和到 0 距离。
- 兜底能力：其他知识点使用幻灯片式分步理解舞台。
- 验证结论：学生端和教师端均能看到幻灯片式动态课件；学生端点击“播放”后会推进步骤。
- 当前限制：不是视频导出，不是 PPTX 导出，不是复杂动画时间轴，不是三维演示；后续需要按知识点沉淀更多交互模板。

## 26. 下一阶段建议

1. P2 阶段15：弱项巩固练习入口 MVP。
2. 同时把动态课件模板继续从“样板点”扩展到更多初中数学基础知识点。
3. 后续可评估 ofox/ChatGPT 等模型用于生成更丰富的交互模板，但当前先保持规则模板可控。

## 27. P2 阶段14补强交接：完整演化过程与重点标记

- 当前状态：已把“所有课件都必须完整展示演化过程”记录为课件生成和动态展示的全局标准。
- 数据结构：`lib/courseware-json.ts` 新增 `dynamic_storyboards` 与 `emphasis_points`，并提供兜底归一化，兼容旧课件。
- Prompt：`prompts/courseware.md` 和 `prompts/courseware-json.md` 已要求每一步写清当前画面、教师讲解、本步操作、操作依据、中间结果、学生检查点和重点标记。
- 学生端：`DynamicCoursewareDemo` 已优先渲染 `dynamic_storyboards`，并用醒目的“本步重点”高亮每一步关键知识节点。
- 样板补强：`J-MATH-RJ-71-05-03` 一元一次方程已从 4 步拆成 8 步，避免从“找同类项”直接跳到结果。
- 教师端：课件编辑器已支持编辑动态演示脚本和“本步重点标记”，老师可以补充 AI 省略或标错的环节。
- 验证结论：学生端样板课件能看到 8 步演化和重点高亮；教师端能看到动态脚本编辑区。
- 当前限制：旧课件只有在重新保存或重新生成后，`dynamic_storyboards` 才会持久化到数据库；未保存前仍通过页面兜底生成。

## 28. P2 阶段14后续补强交接：统一 AI 模型网关

- 当前状态：已完成模型调用抽象，后续可以通过 `.env.local` 切换不同模型测试课件质量。
- 新增封装：`lib/ai.ts`。
- 兼容保留：`lib/deepseek.ts` 中的 `getDeepSeekClient`、`getDeepSeekModel` 仍存在，但实际走统一网关。
- 已接入模块：`lesson-plan`、`student-qa`、`knowledge-explain`、`courseware`、`courseware-json`。
- 新增教师专用测试接口：`GET /api/ai-model-test`、`POST /api/ai-model-test`。
- 支持 provider：`deepseek`、`openai`、`openai-compatible`、`ofox`。
- 推荐配置：
  - `AI_PROVIDER`
  - `AI_API_KEY`
  - `AI_BASE_URL`
  - `AI_MODEL`
  - `AI_COURSEWARE_MODEL`
  - `AI_COURSEWARE_JSON_MODEL`
- 安全边界：前端不传 API key，模型密钥只读取服务端环境变量。
- 当前限制：暂未做前端模型选择器、模型调用成本统计、模型质量评分和多模型并行对比。

## P2 阶段14补充交接：课件资产化与低成本复用

- 新增 `lib/courseware-asset.ts`：定义 `CoursewareAssetMetadata`，提供默认元数据和读取兜底。
- 新增 `lib/courseware-types.ts`：拆出客户端安全的 `CoursewareJson` / `DynamicStoryboard` 类型，避免客户端组件导入含 `fs/promises` 的生成模块。
- `app/api/courseware/route.ts`：生成课件后将 Markdown 模型、JSON 模型、provider 和生成时间写入 `content_json.asset_metadata`。
- `app/teacher/courseware-history/actions.ts`：发布课件时将元数据更新为 `teacher_verified` + `class`；取消发布时回到 `draft` + `private`。
- `app/teacher/courseware-history/page.tsx` 与 `[id]/page.tsx`：展示资源来源、质量状态、可见范围、授权状态和模型记录状态。
- `app/student/knowledge/student-knowledge-client.tsx`：学生端展示课件来源/确认状态标签。
- 设计意图：先把高成本模型生成物沉淀为可复用资产，后续再做平台精选、资源库审核、学生选择老师课件或平台课件。

## P2 阶段15交接：课件资源库与学生多课件选择

- 当前状态：课件资源复用闭环进一步补齐。
- 已新增：`app/teacher/courseware-library/page.tsx`。
- 已调整：`app/teacher/page.tsx` 增加“课件资源库”入口。
- 已调整：`app/student/knowledge/page.tsx` 保留同知识点下所有已发布结构化课件，不再折叠成最新一份。
- 已调整：`app/student/knowledge/student-knowledge-client.tsx` 按 `knowledge_point_code` 分组课件，并在多课件时展示切换控件。
- 数据模型：继续使用 `coursewares.content_json.asset_metadata` 表示来源、可见范围、质量状态、版权状态和模型来源；本阶段不新增表。
- 关键产品判断：老师可以使用不同模型生成课件，但学生端优先读取已保存、已发布、已确认资源，以控制长期使用成本。
- 下一步建议：做“资源质量排序/默认推荐规则”，例如优先 `platform_verified`，其次 `teacher_verified`，再按发布时间排序。

### P2 阶段15补充修正

- 新增 `lib/courseware-storyboard.ts`：将动态课件 storyboard 规范化逻辑拆到客户端安全文件，避免前端误打包依赖 `fs/promises` 的 `lib/courseware-json.ts`。
- 已将 `courseware-edit`、课件历史详情页、课件历史列表、发布 action、学生练习/进度 API 的纯类型引用改为 `lib/courseware-types.ts` 或 `lib/courseware-storyboard.ts`。
- 当前 `lib/courseware-json.ts` 仅保留给服务端 AI 结构化课件生成 API 使用。

## P2 阶段16交接：课件资源推荐与 AI 模型设置

- 当前状态：资源复用和模型配置可见性已补齐。
- 新增：`lib/courseware-ranking.ts`，统一计算课件推荐分、推荐标签和推荐理由。
- 教师资源库：`app/teacher/courseware-library/page.tsx` 已支持搜索、状态筛选、推荐分、推荐标签、推荐理由。
- 学生知识页：`app/student/knowledge/student-knowledge-client.tsx` 已按推荐分默认选择课件，并展示“为什么推荐这份学习包”。
- 新增模型设置页：`app/teacher/model-settings/page.tsx`。
- 新增模型测试客户端：`app/teacher/model-settings/model-test-client.tsx`。
- 教师工作台：`app/teacher/page.tsx` 已新增“AI模型设置”入口。
- 模型测试 API：`app/api/ai-model-test/route.ts` 已支持返回任务级模型矩阵，并按任务测试。
- 模型任务枚举：`lib/ai.ts` 新增 `AI_TASKS`，避免页面和 API 重复维护任务字符串。
- 中间件优化：`middleware.ts` 已避免非保护路径无谓请求 Supabase；无 session cookie 的受保护路径直接跳登录。
- 验证结论：教师端模型设置页可打开，模型矩阵展示正常，短提示词连通性测试成功返回。
- 未完成/需后续：学生端新账号注册验证被 Supabase `email rate limit exceeded` 阻塞；学生端功能代码已编译通过，但本轮未能用新账号补充一次完整登录验证。

## P2 阶段17交接：弱项巩固入口与 Prompt 单来源

- 当前状态：已完成两个收口任务。
- 弱项巩固入口：`app/student/mastery/page.tsx` 已按 `knowledge_point_code` 生成直达链接。
- 知识点学习页：`app/student/knowledge/page.tsx` 读取 `code` query，传给客户端。
- 知识点学习客户端：`app/student/knowledge/student-knowledge-client.tsx` 优先选中 `initialCode`，基础练习区增加 `id="practice"`。
- 智能复习页：`app/student/review/page.tsx` 读取 `code` query。
- 智能复习客户端：`app/student/review/student-review-client.tsx` 支持聚焦单个知识点任务，并在无任务时引导回知识点基础练习。
- 中间件：`middleware.ts` 登录跳转 now 保留完整 path + search，避免 `code` query 在登录后丢失。
- 教案 Prompt：`prompts/lesson-generator.md` 成为教案生成业务 Prompt 单一来源，`lib/deepseek.ts` 改为读取该文件。
- 学生答疑 Prompt：新增 `prompts/student-qa.md`，`lib/student-qa.ts` 改为读取该文件。
- 命名修正：新增 `lib/lesson-plan.ts` 承载教案生成逻辑，`app/api/lesson-plan/route.ts` 已改为直接引用该模块；`lib/deepseek.ts` 仅保留旧名称兼容导出。
- 验证：`npx tsc --noEmit` 通过；相关文件 `git diff --check` 通过。
- 验证：未登录访问 `/student/knowledge?code=...` 和 `/student/review?code=...` 的登录跳转均保留目标 query。
- 后续建议：拿到稳定学生测试账号后，补一次从 `/student/mastery` 点击到 `/student/knowledge?code=...#practice` 的浏览器验证。

## P2 阶段18交接：教师数据到资源操作入口

- 当前状态：教师端数据页已从“只看数据”补强为“看到弱项后能去找课件/生成课件”。
- 更新：`app/teacher/analytics/page.tsx`。
- “知识点基础掌握信号”表新增“资源”列。
- 每个知识点行新增 `查课件` 链接：`/teacher/courseware-library?q={knowledge_point_code}`。
- 每个知识点行新增 `生成` 链接：`/teacher/courseware?knowledgePointCode={knowledge_point_code}&source=analytics`。
- “基础掌握快照”表新增 `查看资源` 链接，指向对应知识点资源库筛选结果。
- 更新：`app/student/knowledge/student-knowledge-client.tsx`。
- 从 `/student/knowledge?code=...` 进入时显示“正在巩固一个弱项知识点”提示。
- 验证：`npx tsc --noEmit` 通过。
- 浏览器验证：教师账号访问 `/teacher/analytics`，已看到“资源”列和带 `J-MATH-RJ-71-05-03` 的资源/生成链接。

## P2 阶段19交接：学生错题后的直达巩固动作

- 当前状态：学生错题后的下一步动作已补齐，弱项巩固链路更闭合。
- 更新：`app/student/knowledge/student-knowledge-client.tsx`。
- 更新：`app/student/courseware/[id]/courseware-player-client.tsx`。
- 学生在知识点学习页提交错误答案后，会在结果卡看到 `复习这个知识点` 和 `继续基础练习`。
- 学生在课件播放器内提交错误答案后，也会看到同一套入口。
- `复习这个知识点` 指向 `/student/review?code={knowledge_point_code}`。
- `继续基础练习` 指向 `/student/knowledge?code={knowledge_point_code}#practice`。
- 本阶段不新增数据库表、不修改 RLS、不生成新题，继续复用已发布课件中的 `practice_items`。
- 验证：`npx tsc --noEmit` 通过。
- 浏览器验证：专用学生测试账号可打开 `/student/knowledge?code=J-MATH-RJ-71-05-03#practice`，提交错误答案后显示新增入口。
- 浏览器验证：课件播放器 `/student/courseware/bc26231a-e161-4214-bfd2-3ae5d605bec5` 已显示同样的错题后续动作。
- 浏览器验证：`/student/review?code=J-MATH-RJ-71-05-03` 可显示聚焦复习任务，并提供回到基础练习的入口。

### P2 阶段19补充交接：动态课件播放节奏修正

- 更新：`app/_components/dynamic-courseware-demo.tsx`。
- 已修复通用 storyboard 舞台自动播放仍写死 `1800ms` 的问题。
- 现在通用 storyboard 舞台会使用 `stepDuration`，按步骤文字量、重点标记和慢放模式决定停留时间。
- 验证：`npx tsc --noEmit` 通过。
- 浏览器验证：学生课件播放器普通节奏显示 `4 秒节奏`，点击 `慢放` 后显示 `慢放中` 和 `6 秒节奏`。

## P2 阶段20交接：错题到课件练习位置的直达聚焦

- 当前状态：学生错题后可以直接回到对应课件中的同一道题，弱项巩固链路进一步闭合。
- 更新：`app/student/knowledge/student-knowledge-client.tsx`。
- 更新：`app/student/courseware/[id]/page.tsx`。
- 更新：`app/student/courseware/[id]/courseware-player-client.tsx`。
- 知识点学习页错题结果卡新增 `打开课件重看本题`。
- 课件播放器页面读取 `practice` query，并传给客户端。
- 课件播放器客户端在 `practice` 合法时显示“正在重看第 N 题”，自动滚动到对应题目，并对题卡加 amber 高亮 ring。
- 课件播放器练习结果卡现在也显示 `错误原因`，与知识点学习页一致。
- 本阶段仍然只做定位、复盘和巩固，不自动生成新专项题。
- 验证：`npx tsc --noEmit` 通过。
- 浏览器验证：知识点页错题卡链接为 `/student/courseware/bc26231a-e161-4214-bfd2-3ae5d605bec5?practice=0#practice-1`。
- 浏览器验证：课件页打开后显示聚焦提示、题卡高亮、错误原因和复习入口。

## P2 阶段21交接：复习任务到错题课件的直达入口

- 当前状态：学生从智能复习页也可以回到对应错题课件位置。
- 更新：`app/student/review/page.tsx`。
- 更新：`app/student/review/student-review-client.tsx`。
- `/student/review` 查询 `student_review_tasks` 时，通过 `source_practice_record_id` 关联读取 `student_practice_records`。
- 查询结果已做对象/数组兼容归一化，避免 Supabase 嵌套类型推断差异。
- 复习任务卡展示错题来源：题目、学生答案、标准答案、错误原因。
- 有来源课件时，任务卡显示 `重看错题课件`，链接到 `/student/courseware/{courseware_id}?practice={index}#practice-{index + 1}`。
- 本阶段不新增数据库结构；利用阶段6已建立的复习任务来源字段和阶段20的课件题目聚焦能力。
- 验证：`npx tsc --noEmit` 通过。
- 浏览器验证：`/student/review?code=J-MATH-RJ-71-05-03` 显示错题来源和回看入口。
- 浏览器验证：回看入口可打开课件，并高亮对应练习题。

## P2 阶段22交接：教师端错题到课件题目的定位入口

- 当前状态：教师端学习数据页已能从学生错题定位回对应课件题目。
- 更新：`app/teacher/analytics/page.tsx`。
- 更新：`app/teacher/courseware-history/[id]/page.tsx`。
- 更新：`app/teacher/courseware-history/[id]/courseware-json-editor.tsx`。
- 最近练习记录表新增 `资源` 列，有来源课件时显示 `看课件题`。
- 待复习任务卡通过 `source_practice_record_id` 映射到 `student_practice_records`，展示错题来源、学生答案和标准答案。
- 待复习任务卡有来源课件时显示 `重看课件题目`。
- 教师课件详情支持 `?practice={index}#practice-{number}`，结构化编辑器会滚动并高亮对应基础练习题。
- 验证：`npx tsc --noEmit` 通过。
- 验证：教师测试账号经 Supabase RLS 可读取 4 条关联学生练习记录和 4 条复习任务。
- 验证：练习记录和复习任务来源均可构造 `/teacher/courseware-history/bc26231a-e161-4214-bfd2-3ae5d605bec5?practice=0#practice-1`。
- 注意：本轮浏览器插件输入登录时受虚拟剪贴板限制，教师端页面浏览器登录验证未完成；学生端类似链路已完成浏览器验证。

## P2 阶段23交接：完成复习后保留错题来源

- 当前状态：学生完成复习任务后，页面不会丢失错题来源和回看入口。
- 更新：`app/api/student-review/route.ts`。
- 更新：`app/student/review/student-review-client.tsx`。
- `POST /api/student-review` 原本完成任务后只返回基础 task 字段；前端覆盖本地任务后会丢失 `source_practice_record`。
- 现在 API 返回 `source_practice_record_id`、`created_at` 和嵌套 `source_practice_record`。
- API 对嵌套来源记录做对象/数组兼容归一化。
- 前端 `setLocalTasks` 合并返回 task 时，会优先使用 API 返回来源；如果没有返回，则保留原本的 `source_practice_record`。
- 掌握度刷新逻辑已确认仍在：完成复习后调用 `refreshStudentKnowledgeMastery`。
- 验证：`npx tsc --noEmit` 通过。
- 注意：Node 脚本直接调用本地 API 时由于 SSR Supabase 只识别 cookie，不识别脚本传入的 Bearer token，返回 401；该验证限制已记录在风险文档。

## 2026-06-14 交接节点：弱项巩固闭环补强

- 当前交接状态：P2 阶段17-23 已完成，未提交、未 push。
- 本轮主要补齐的是“学生弱项 -> 聚焦学习 -> 错题 -> 复习任务 -> 回看来源课件 -> 教师端定位题目”的闭环。
- 学生端入口：
  - `/student/mastery`：弱项卡片可跳转 `/student/review?code=...` 和 `/student/knowledge?code=...#practice`。
  - `/student/knowledge`：支持 `code` query，错题后显示复习、继续练习、打开来源课件题目。
  - `/student/review`：支持 `code` query，显示错题来源和 `重看错题课件`。
  - `/student/courseware/[id]?practice=0#practice-1`：可聚焦并高亮来源练习题。
- 教师端入口：
  - `/teacher/analytics`：弱项知识点可查课件/生成课件；最近练习和复习任务可定位到课件题目。
  - `/teacher/courseware-history/[id]?practice=0#practice-1`：可聚焦并高亮教师课件结构化练习题。
- Prompt 状态：
  - `prompts/lesson-generator.md` 已成为教案生成 Prompt 单一来源。
  - `prompts/student-qa.md` 已成为学生答疑 Prompt 单一来源。
  - 后续新增 Prompt 应继续采用文件读取模式，避免重新形成双来源。
- 关键样板数据：
  - 学生测试账号：`codex-student-e2e@example.com`。
  - 教师测试账号：`codex-courseware-teacher@example.com`。
  - 样板知识点：`J-MATH-RJ-71-05-03` 一元一次方程的解法。
  - 样板课件：`bc26231a-e161-4214-bfd2-3ae5d605bec5`。
  - 典型学生回看链接：`/student/courseware/bc26231a-e161-4214-bfd2-3ae5d605bec5?practice=0#practice-1`。
  - 典型教师回看链接：`/teacher/courseware-history/bc26231a-e161-4214-bfd2-3ae5d605bec5?practice=0#practice-1`。
- 建议下一步：
  - 继续补强完成复习后的已完成任务展示，让已完成复习任务也能保留错题来源和回看入口。
  - 加固 `POST /api/student-review` 的用户归属过滤和 not found 返回，减少只依赖 RLS 的模糊错误。
  - 继续优化动态课件的完整步骤、重点标记和“像幻灯片/视频一样”的自然演化体验。

## P2 阶段24交接：复习完成来源展示与 API 归属硬化

- 当前状态：P2 阶段23 中列出的两个直接风险已处理。
- 更新：`app/api/student-review/route.ts`。
- 更新：`app/student/review/student-review-client.tsx`。
- API 完成复习任务时已显式 `.eq("user_id", user.id)`，任务不存在或不属于当前学生时返回 404，不再落入通用 500。
- 已完成复习任务列表现在展示 `已复盘的错题来源`、学生答案、错误原因。
- 已完成复习任务如果有关联课件，继续提供 `重看错题课件`，方便学生复盘后仍能回看。
- 验证：`npx tsc --noEmit` 通过。
- 验证：未登录 `POST /api/student-review` 返回 HTTP 401。
- 注意：当前项目没有现成自动化测试框架，本阶段没有新增测试依赖；采用 TypeScript、HTTP 未登录验证和代码检索作为验证证据。
- 下一步建议：继续优化动态课件的完整演化体验，把“找同类项/移项/合并/系数化为1”等过程拆得更细，并把重点标记映射到每一步教学节点。

## P2 阶段25交接：动态课件完整讲解路径

- 当前状态：动态课件不再只在右侧展示单块说明，而是把当前步骤拆成连续教学面板。
- 更新：`lib/courseware-playback.ts`。
- 更新：`lib/courseware-playback.test.ts`。
- 更新：`app/_components/dynamic-courseware-demo.tsx`。
- 通用 storyboard 舞台现在显示“上一画面、当前画面、本步操作、为什么可以这样做、学生自查”。
- 一元一次方程样板舞台也接入同样结构，解决样板课件步骤过粗的问题。
- 该结构服务“反应慢一点的学生也能跟上”：先看到上一状态，再看到当前状态，再看到操作、依据和自查。
- 验证：`npx --yes tsx --test lib/courseware-playback.test.ts` 通过。
- 验证：`npx tsc --noEmit` 通过。
- 浏览器验证：学生账号访问样板课件，DOM 中出现新增面板文本。
- 注意：本阶段只是提升演示结构和讲解完整度，不是自动生成更高级动画；后续仍需继续优化 AI 输出的 storyboard 质量和更多数学模板。
## P2 阶段26交接：错题回看动态步骤建议

- 当前状态：已完成，不提交、不 push。
- 改动范围：
  - `lib/courseware-playback.ts`
  - `lib/courseware-playback.test.ts`
  - `app/student/courseware/[id]/courseware-player-client.tsx`
- 功能说明：
  - 学生从错题或复习任务回到课件练习时，页面会提示应回看动态演示的具体步骤。
  - 错题结果卡也会显示同样的动态步骤建议，减少学生只看答案、不知道回看哪里的情况。
  - 目前采用关键词和公式片段的轻量匹配，优先使用课件 JSON 中的 `dynamic_storyboards`；样板一元一次方程没有可匹配 storyboard 时，使用内置步骤兜底。
- 样板验证：
  - 学生账号打开 `/student/courseware/bc26231a-e161-4214-bfd2-3ae5d605bec5?practice=0`。
  - 页面显示“建议回看动态演示第 4 步：移含 x 的项”。
- 后续建议：
  - 下一步可把建议链接进一步做成可点击定位，让学生直接跳到动态演示的对应步骤。
  - 后续生成 Prompt 应要求每道练习显式标注 `target_storyboard_step`，减少纯关键词匹配的不确定性。
## P2 阶段27交接：错题回看自动定位动态演示步骤

- 当前状态：已完成，不提交、不 push。
- 改动范围：
  - `app/_components/dynamic-courseware-demo.tsx`
  - `app/student/courseware/[id]/courseware-player-client.tsx`
  - `lib/courseware-playback.ts`
  - `lib/courseware-playback.test.ts`
- 功能说明：
  - 动态课件组件新增 `initialStepIndex`。
  - 学生错题回看页会把 `buildPracticeReplaySuggestion` 的建议步骤传入动态演示。
  - 一元一次方程样板进入错题回看时，动态演示直接定位到“移含 x 的项”，而不是停在“原方程”。
- 样板验证：
  - `/student/courseware/bc26231a-e161-4214-bfd2-3ae5d605bec5?practice=0`
  - 页面动态演示显示“第 4 / 8 步”，第 4 步按钮显示“正在讲”。
- 后续建议：
  - 可以继续把提示文案改成可点击按钮，点击后滚动到动态演示区域。
  - 后续结构化 JSON 应生成 `practice_items[].target_storyboard_step`，避免长期依赖关键词匹配。
## P2 阶段28交接：错题建议一键回看动态演示

- 当前状态：已完成，不提交、不 push。
- 改动范围：
  - `lib/courseware-playback.ts`
  - `lib/courseware-playback.test.ts`
  - `app/student/courseware/[id]/courseware-player-client.tsx`
- 功能说明：
  - `getDynamicReplayTargetId(coursewareId)` 为动态演示生成稳定锚点。
  - 学生错题定位提示和错题结果卡新增“查看动态演示第 N 步”按钮。
  - 按钮调用 `scrollIntoView` 平滑滚动到动态演示区域，配合阶段27的 `initialStepIndex` 直接显示关键步骤。
- 样板验证：
  - 学生账号打开 `/student/courseware/bc26231a-e161-4214-bfd2-3ae5d605bec5?practice=0`。
  - 初始位置在练习区，`practiceTop` 约 118px，动态演示在上方。
  - 点击第 1 题错题卡“查看动态演示第 4 步”后，动态演示区域 `replayTop` 约 24px，页面显示“第 4 / 8 步”。
- 后续建议：
  - 后续可把 URL hash 同步为动态演示锚点，支持刷新后直接落到演示区。
  - 长期仍建议在结构化 JSON 中生成 `target_storyboard_step`，减少关键词匹配误差。
## P2 阶段29交接：练习题到动态步骤强关联字段

- 当前状态：已完成，不提交、不 push。
- 改动范围：
  - `lib/courseware-types.ts`
  - `lib/courseware-json.ts`
  - `lib/courseware-edit.ts`
  - `lib/courseware-playback.ts`
  - `lib/courseware-playback.test.ts`
  - `prompts/courseware-json.md`
- 功能说明：
  - `practice_items` 新增可选字段 `target_storyboard_step`。
  - 该字段使用 1-based 编号，面向 AI 生成和教师编辑更自然。
  - 前端回看时转换为 0-based `stepIndex`，并通过 `getInitialPlaybackStepIndex` 做边界保护。
  - 如果字段不存在，旧课件继续使用关键词匹配兜底。
- 验证重点：
  - 单测确认显式 `target_storyboard_step = 2` 时优先定位到第 2 步，即使题目关键词更像第 1 步。
  - 学生端旧样板课件仍能显示“第 4 / 8 步”和“查看动态演示第 4 步”按钮。
- 后续建议：
  - 下一次真实生成课件时观察 AI 是否稳定输出 `target_storyboard_step`。
  - 教师编辑 UI 后续可显示/修改每道练习的目标动态步骤。
# 知桥AI Codex 交接补充：P2 阶段32

- 本轮完成：数轴动态课件完整分镜样板。
- 关键改动：
  - `lib/courseware-playback.ts`：新增 `J-MATH-RJ-71-01-03` 数轴内置 8 步动态分镜。
  - `lib/courseware-storyboard.ts`：新增 `normalizeCoursewareStoryboardsForDisplay(courseware)`，用于展示前统一补齐/替换动态分镜。
  - `app/teacher/courseware-history/[id]/page.tsx`：教师端动态预览和编辑器使用同一个归一化课件 JSON。
  - `app/student/courseware/[id]/page.tsx`：学生端播放器使用归一化课件 JSON。
  - `app/api/student-courseware-progress/route.ts`：进度保存成功后，即使掌握度刷新失败也返回成功，失败只记录日志。
- 验证账号：
  - 教师：`codex-courseware-teacher@example.com`
  - 学生：`codex-student-e2e@example.com`
- 关键验证记录：
  - 教师端详情页：`/teacher/courseware-history/7651acd5-2d1c-4f3a-8778-3d1699082884`
  - 学生端播放器：`/student/courseware/7651acd5-2d1c-4f3a-8778-3d1699082884`
  - 该课件验证后已恢复为未发布。
- 已跑命令：
  - `npx --yes tsx --test lib/courseware-playback.test.ts`
  - `npx --yes tsx --test lib/courseware-storyboard.test.ts`
  - `npx --yes tsx --test lib/courseware-edit.test.ts`
  - `npx tsc --noEmit`
- 下一步建议：
  - 优先排查 `student_knowledge_mastery` 刷新失败的底层权限/聚合问题。
  - 继续按样板知识点路线补“一元一次方程”和“数轴”的更细粒度视觉表现，再扩展新知识点。
  - 单独清理文档和部分页面源码中的中文编码异常。

# 知桥AI Codex 交接补充：ofox / GPT 接入验证

- 本轮完成：统一 AI 网关接入 ofox OpenAI-compatible，并验证 GPT 系模型可用于教案、课件、知识点讲解和学生答疑。
- 关键改动：
  - `lib/ai.ts`：新增可选 `AI_PROXY_URL` 代理支持，`getAIClient()` 改为异步。
  - `package.json` / `package-lock.json`：新增 `undici`，用于本地 Node 代理传输。
  - `.env.example`：新增 `AI_PROXY_URL` 说明。
  - `prompts/lesson-generator.md`、`prompts/courseware.md`、`prompts/knowledge-explain.md`、`prompts/student-qa.md`：增强“去 AI 味”和“真实老师可用”约束。
- 当前本地配置：
  - `AI_PROVIDER=ofox`
  - `AI_BASE_URL=https://api.ofox.ai/v1`
  - `AI_MODEL=gpt-4.1-mini`
  - 本机需要 `AI_PROXY_URL=http://127.0.0.1:7897`
  - 不要在文档或聊天中记录 `OFOX_API_KEY`。
- 验证账号：
  - 教师：`codex-courseware-teacher@example.com`
  - 学生：`codex-student-e2e@example.com`
- 已验证接口：
  - `/api/ai-model-test` 五类任务均 200。
  - `POST /api/lesson-plan` 生成并落库。
  - `POST /api/knowledge-explain` 生成并落库。
  - `POST /api/courseware` 生成 Markdown + JSON 并落库。
  - `POST /api/student-qa` 生成并落库。
- 新验证记录：
  - 课件：`611f1a55-9643-4f5b-a127-11a5e49bbe19`
  - 教案：`c7160224-68c4-4f27-852c-7b7fa69687fc`
- 下一步建议：
  - 在教师端模型设置页继续做“任务级模型选择 + 成本提示 + 默认低成本模型 / 高质量模型切换”。
  - 继续用 `J-MATH-RJ-71-01-03` 数轴和 `J-MATH-RJ-71-05-03` 一元一次方程做 GPT 输出质量对比。
  - 后续若接入更强模型，优先用于课件生成、结构化 JSON 和动态分镜，不建议默认给学生高频答疑使用高成本模型。
