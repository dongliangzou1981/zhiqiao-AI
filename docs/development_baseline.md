# 知桥AI开发基线

## P2 阶段33：内容效果优先质量门禁

- 当前状态：已完成，准备提交并推送。
- 目标：将知桥AI后续开发重心从“功能是否实现”调整为“内容是否真正帮助老师讲清、学生学会”。
- 核心原则：
  - 功能只是载体，生成内容必须服务老师备课、课堂讲解、学生自学、基础练习和复习闭环。
  - 所有课件、练习、动态演示继续围绕 `knowledge_point_code` 组织。
  - 样板知识点优先，不追求一次覆盖全部初中数学。
- 新增能力：
  - 新增 `lib/courseware-quality.ts`，提供课件内容质量规则检查。
  - 新增 `lib/courseware-quality.test.ts`，覆盖合格课件与低质量课件的规则判断。
  - 动态课件生成会把质量问题反馈给模型，要求重新生成。
  - 生成后的质量报告写入 `asset_metadata.content_quality`，不新增数据库字段。
  - 教师课件详情页新增“内容效果检查”面板，展示质量分、必选项、建议项和下一步动作。
- Prompt 调整：
  - `prompts/lesson-generator.md`：强调教案要服务讲清基础知识和后续课件/复习复用。
  - `prompts/courseware.md`：强化完整推导、练习解析、去 AI 套话和学生复用要求。
  - `prompts/courseware-json.md`：强化结构化课件的内容有效性、练习到动态步骤绑定和自检标准。
  - `prompts/courseware-html.md`：要求每页 `data-layout`，禁止技术标签外露，强化投屏、完整过程和慢学生友好。
- 验证：
  - `npx tsc --noEmit` 通过。
  - 浏览器验证教师详情页出现“内容效果检查”面板。
  - 当前样板课件 `2e60da6f-ba1e-4f99-9aee-9efc71ce65c2` 内容质量分为 93，并提示“幻灯片版式有变化”建议优化。
  - 浏览器验证 `/teacher/courseware-preview/2e60da6f-ba1e-4f99-9aee-9efc71ce65c2` 预览页工具栏和 iframe 正常。
  - 浏览器控制台 error/warn 为 0。

## P2 阶段31：动态课件低质量分镜回退与 Prompt 强化

- 当前状态：已完成。
- 目标：减少动态课件中“第 N 步”“按顺序完成本步变形”等泛化步骤，优先展示清晰、完整、可教学的演化过程。
- 新增能力：
  - `normalizeDynamicStoryboards` 会识别低质量 AI 分镜。
  - 对已有内置高质量分镜的样板知识点，低质量 AI 分镜会自动回退到内置分镜。
  - 教师端练习题绑定动态步骤下拉会显示更清晰的步骤名。
  - `prompts/courseware-json.md` 明确禁止泛化 `step_title`、`operation`、`formula_or_state`、`visual_state`。
- 新增/调整文件：
  - `lib/courseware-storyboard.ts`
  - `lib/courseware-storyboard.test.ts`
  - `lib/courseware-playback.ts`
  - `prompts/courseware-json.md`
- 验证：
  - `npx --yes tsx --test lib/courseware-storyboard.test.ts` 通过。
  - `npx --yes tsx --test lib/courseware-playback.test.ts` 通过。
  - `npx tsc --noEmit` 通过。
  - Playwright 验证样本课件下拉选项已显示“原方程、确定整理目标、两边同减 2x、移含 x 的项”等清晰步骤。

## P2 阶段30：教师端练习题绑定动态步骤编辑能力

- 当前状态：已完成。
- 目标：让老师在课件编辑时，可以为每道基础练习手动指定对应的动态讲解步骤。
- 价值：学生做错某道题后，可以优先回到老师指定的完整演化步骤，减少“自动匹配不准”或“讲解跳步”的问题。
- 数据主线：继续使用 `practice_items[].target_storyboard_step`，保持 1-based 步骤编号，指向 `dynamic_storyboards[0].steps`。
- 新增/调整文件：
  - `lib/courseware-edit.ts`
  - `lib/courseware-edit.test.ts`
  - `app/teacher/courseware-history/[id]/courseware-json-editor.tsx`
- 验证：
  - `npx --yes tsx --test lib/courseware-edit.test.ts` 通过。
  - `npx --yes tsx --test lib/courseware-playback.test.ts` 通过。
  - `npx tsc --noEmit` 通过。
  - Playwright 验证教师课件详情页出现“对应动态讲解步骤”下拉控件。
- 说明：旧样本课件的部分动态步骤标题仍偏泛化，后续需要继续优化 AI 生成的 storyboard 文案质量。

## 当前阶段

P2 阶段14：动态课件已从小组件式演示升级为幻灯片式演示舞台 MVP，并已补强为“完整演化过程 + 本步重点标记”的全局课件标准。P2 阶段14后续补强已新增统一 AI 模型网关，方便对接 DeepSeek、OpenAI、OpenAI-compatible 和 ofox 类服务。P2 阶段12/13已完成掌握度规则与学生弱项知识点视图。

当前不进入学情分析。后续路线调整为先补齐教师端，再补齐学生端，再做两端数据整合，最后进入学情分析。

核心原则：所有教师端和学生端功能都必须服务“教育大纲基础知识打牢”，并以 `knowledge_point_code` 作为长期数据主线。

## 已完成

- 教师端
- 学生端
- 教案生成
- 学生答疑
- 知识库
- Supabase基础
- Auth
- Profile
- Role
- Middleware
- lesson_plans
- qa_records
- knowledge_points
- lesson-history Supabase 化
- P2 阶段1：知识点页面读取 `knowledge_points`
- P2 阶段1：知识点 AI 讲解生成
- `POST /api/knowledge-explain`
- `prompts/knowledge-explain.md`
- `lib/knowledge-explain.ts`
- `knowledge_explanations` 表
- P2 阶段2：AI 课件生成 MVP 代码实现
- `POST /api/courseware`
- `prompts/courseware.md`
- `lib/courseware.ts`
- `coursewares` 表
- `/teacher/courseware` 知识点导向课件生成页
- P2 阶段2收尾：教师端课件历史
- `/teacher/courseware-history`
- `/teacher/courseware-history/[id]`
- `lib/coursewares.ts`
- P2 阶段3：结构化课件 JSON
- `prompts/courseware-json.md`
- `lib/courseware-json.ts`
- `coursewares.content_json` 写入与详情摘要展示
- P2 阶段4：学生端知识点学习闭环只读 MVP
- P2 阶段4收尾：课件发布与学生端可见范围 MVP
- P2 阶段5：基础练习与掌握记录 MVP
- `student_practice_records` 表
- `POST /api/student-practice`
- P2 阶段6：日/周复习系统 MVP
- `student_review_tasks` 表
- `POST /api/student-review`
- `/student/review` 学生端智能复习页
- P2 阶段7：两端数据整合最小版
- `teacher_student_links` 表
- `/teacher/analytics` 学习数据只读视图
- 教师可查看已关联学生的练习记录、复习任务与知识点维度统计
- P2 阶段8准备：教师端学生范围管理 MVP
- `/teacher/students` 学生范围管理页
- `app/teacher/students/actions.ts`
- `/student` 展示“我的学生ID”
- P2 阶段9：课件编辑与可视化预览 MVP
- P2 阶段10：学生端可视化课件播放器 MVP
- P2 阶段11：学生学习进度与课件学习记录 MVP
- `student_courseware_progress` 表
- `POST /api/student-courseware-progress`
- `/student/courseware/[id]` 支持打开、翻页和完成课件学习进度记录
- `/teacher/analytics` 已展示课件学习完成信号
- P2 阶段12：掌握度规则 MVP
- `student_knowledge_mastery` 表
- `POST /api/student-mastery/refresh`
- `lib/student-mastery.ts`
- `/teacher/analytics` 已展示基础掌握快照和待巩固数
- P2 阶段13：学生弱项知识点视图 MVP
- `/student/mastery`
- `/student` 已新增“弱项知识点”入口
- P2 阶段14：动态课件 HTML 互动 MVP
- `app/_components/dynamic-courseware-demo.tsx`
- `/student/courseware/[id]` 已展示可操作动态演示
- `/teacher/courseware-history/[id]` 已展示动态课件预览
- P2 阶段14补强：所有新生成结构化课件预留 `dynamic_storyboards`
- 动态脚本支持逐步讲解、画面状态、操作依据、学生检查点和重点标记
- 教师端课件编辑器已支持调整动态演示脚本与每步重点标记
- P2 阶段14后续补强：统一 AI 模型网关
- `lib/ai.ts`
- `GET /api/ai-model-test`
- `POST /api/ai-model-test`
- 课件、结构化课件、知识点讲解、教案生成、学生答疑已接入统一 AI 模型网关

## 进行中

- P2 阶段15：弱项巩固练习入口准备

## 未完成

- 教学素材库
- 教学示例库
- 学情分析
- 多语种扩展

## 当前技术债

- `lesson-plan` / `student-qa` 仍有 Prompt 双来源问题
- localStorage历史问题
- 文档旧路线曾将学情分析列为下一步；已按最新产品判断调整为教师端完整化优先

## 推荐开发顺序

### P0

- Supabase连通验证
- Auth
- Profile

### P1

- lesson_plans落库
- qa_records落库
- knowledge_points导入

### P2

- 阶段1：知识点讲解（已完成）
- 阶段2：教师端课件生成 MVP 与课件历史（已完成）
- 阶段3：结构化课件 JSON（已完成）
- 阶段4：学生端知识点学习闭环
- 阶段5：基础练习与掌握记录（已完成）
- 阶段6：日/周复习系统（已完成）
- 阶段7：两端数据整合（已完成最小版）
- 阶段8：学情分析
- 阶段9：多语种扩展

## AI 课件生成 MVP 规格

- 语言：中文。
- 学科：先做初中数学。
- 目标：帮助老师把一个教育大纲/教材基础知识点讲清楚。
- 页面：`/teacher/courseware`。
- API：`POST /api/courseware`。
- Prompt：`prompts/courseware.md`。
- AI 调用封装：`lib/courseware.ts`。
- 数据库：后续新增 `coursewares` 表，必须关联 `knowledge_point_code`。
- 输出形态：先生成 Markdown 课件，后续预留结构化 JSON。
- 必须包含：本课对应知识点、学习目标、前置知识、核心概念、分步讲解、典型例题、易错点、基础练习、小结、课后巩固。
- 约束：不生成泛泛而谈的普通课件；每页课件后续都要能追溯到知识点；练习题后续必须标注知识点和难度。
- 动态要求：所有课件后续都必须尽量生成完整演化脚本，不得随意抽掉学生理解所需的中间步骤。
- 重点要求：每一步必须标记 1-3 个关键知识节点或易漏点，学生端用醒目高亮提示，帮助反应慢的学生跟上每个环节。

## AI 模型网关配置

- 默认兼容旧 DeepSeek 配置；未设置 `AI_PROVIDER` 时按 `deepseek` 处理。
- 推荐新配置：
  - `AI_PROVIDER=deepseek|openai|openai-compatible|ofox`
  - `AI_API_KEY`
  - `AI_BASE_URL`
  - `AI_MODEL`
  - `AI_JSON_RESPONSE_FORMAT=enabled|disabled`
- 可按任务覆盖模型：
  - `AI_LESSON_PLAN_MODEL`
  - `AI_STUDENT_QA_MODEL`
  - `AI_KNOWLEDGE_EXPLAIN_MODEL`
  - `AI_COURSEWARE_MODEL`
  - `AI_COURSEWARE_JSON_MODEL`
- 教师专用测试接口：
  - `GET /api/ai-model-test`：查看当前服务端模型配置。
  - `POST /api/ai-model-test`：发送短 prompt 验证当前模型是否可用。
- 不允许前端传入 API key；所有模型密钥只从服务端环境变量读取。
- 若 OpenAI-compatible 服务不支持 `response_format=json_object`，可设置 `AI_JSON_RESPONSE_FORMAT=disabled`，结构化课件仍会通过 Prompt 和 JSON 提取器解析模型输出。

## 长期数据主线

后续所有核心数据模型围绕 `knowledge_point_code` 组织：

- `knowledge_points`：知识点主数据。
- `coursewares`：课件，关联知识点。
- `teaching_examples`：教学示例，关联知识点。
- `practice_items`：练习题，关联知识点和难度。
- `student_practice_records`：学生练习记录。
- `student_review_tasks`：日/周复习任务。
- `student_courseware_progress`：学生课件学习进度。
- `student_knowledge_mastery`：学生-知识点基础掌握信号。
- `teacher_student_links`：教师可查看的学生数据范围。
- `student_knowledge_mastery`：学生知识点掌握状态。
- `class_knowledge_mastery`：班级知识点掌握聚合，后置生成。

近期不一次性建完这些表；设计课件、素材、示例时必须预留知识点关联。

## P2 阶段2任务2验证状态

- `coursewares` 表已应用到 Supabase 项目。
- `coursewares` RLS 已启用。
- `coursewares` 当前仅向 authenticated 授予 `select`、`insert`。
- `coursewares_teacher_select_own` 与 `coursewares_teacher_insert_own` 策略已存在。
- `npx tsc --noEmit`：通过。
- `git diff --check`：通过，仅有 Windows 换行提示。
- `POST /api/courseware` 缺少字段：HTTP 400。
- `POST /api/courseware` 未登录完整请求：HTTP 401。
- `/teacher/courseware` 未登录访问会跳转登录页，说明教师端保护仍生效。
- 教师登录态真实浏览器点击验证：通过。
- 已使用测试教师账号打开 `/teacher/courseware`，默认选中 `J-MATH-RJ-71-01-03` 数轴并点击生成。
- DeepSeek 已返回中文 Markdown 课件，页面显示“已保存”。
- 最新浏览器验证写入记录：`coursewares.id = bf05108c-7062-475b-a228-4e3dbe7276c5`。
- 记录关联：`knowledge_point_code = J-MATH-RJ-71-01-03`，`knowledge_point_name = 数轴`。

## P2 阶段2收尾验证状态

- 新增 `lib/coursewares.ts`，封装 `coursewares` 列表与详情读取。
- 新增 `/teacher/courseware-history`，展示当前教师自己的课件记录。
- 新增 `/teacher/courseware-history/[id]`，展示课件详情与 Markdown 正文。
- 教师工作台已新增“课件历史”入口。
- `/teacher/courseware` 已新增“查看课件历史”入口。
- 课件生成成功后已提供“查看详情”入口。
- 未登录访问 `/teacher/courseware-history`：HTTP 307，跳转 `/auth/login?redirect=%2Fteacher%2Fcourseware-history`。
- RLS 验证：测试教师可读取自己的课件，另一个教师读取不到。
- 真实浏览器验证：列表页能看到 `J-MATH-RJ-71-01-03` 数轴课件，点击后进入详情页并显示 Markdown 正文。
- 不存在的详情 id 显示“未找到该课件记录”。

## P2 阶段3验证状态

- 新增 `prompts/courseware-json.md`，作为结构化课件 JSON Prompt 来源。
- 新增 `lib/courseware-json.ts`，生成并校验结构化课件 JSON。
- `POST /api/courseware` 现在会生成 Markdown 与结构化 JSON，并同步写入 `coursewares.content_markdown` 与 `coursewares.content_json`。
- 结构化 JSON 版本：`courseware_json_v1`。
- 结构化 JSON 已包含：知识点编码、知识点名称、学习目标、前置知识、核心概念、课件页、例题、易错点、基础练习、小结与复习计划。
- `/teacher/courseware-history/[id]` 已展示结构化 JSON 摘要。
- 第二样板点 `J-MATH-RJ-71-05-03` 一元一次方程的解法已完成真实 API 生成。
- 验证写入记录：`coursewares.id = bc26231a-e161-4214-bfd2-3ae5d605bec5`。
- 该记录 `content_json.version = courseware_json_v1`，`slides = 12`，`practice_items = 3`，`learning_goals = 3`。
- RLS 验证：测试教师可读取该结构化 JSON，另一个教师读取不到。
- 真实浏览器验证：详情页显示“结构化 JSON 已保存”。

## P2 阶段4验证状态

- 学生端知识点学习闭环只读 MVP 已完成。
- `/student/knowledge` 现在读取 `knowledge_points`、当前学生自己的最新 `knowledge_explanations`，以及可学习复用的 `coursewares.content_json`。
- 学生端页面会优先打开已有结构化学习包的样板知识点，当前验证点为 `J-MATH-RJ-71-05-03` 一元一次方程的解法。
- 学生端已展示知识点导向的学习包：学习目标、核心概念、例题、易错点、基础练习与 AI 讲解入口。
- 新增 RLS 策略 `coursewares_student_select_learning`：允许学生读取 `content_json is not null` 的课件资源用于学习复用。
- 数据权限验证：未登录不能读取 `coursewares`；学生可读取结构化学习资源；学生不能插入 `coursewares`。
- 真实浏览器验证：学生登录访问 `/student/knowledge` 后能看到“知识点学习”“基础知识学习包”“基础练习”“有练习”和“一元一次方程的解法”。
- 该阶段本身不记录学生作答、不生成掌握度、不进入学情分析；后续已由 P2 阶段5/6/7补上练习记录、复习任务与教师只读学习数据视图。

## P2 阶段4收尾验证状态：课件发布与学生端可见范围

- 教师端课件发布/取消发布 MVP 已完成。
- `coursewares` 新增 `is_published` 与 `published_at` 字段；AI 课件生成默认 `is_published = false`。
- `/teacher/courseware-history` 已显示课件发布状态和已发布数量。
- `/teacher/courseware-history/[id]` 已提供“发布到学生端 / 取消发布”操作。
- 新增 server action：`app/teacher/courseware-history/actions.ts`。
- 新增 SQL：`supabase/add-courseware-publishing.sql`。
- 学生端 `/student/knowledge` 现在只读取 `is_published = true` 且 `content_json is not null` 的课件学习资源。
- RLS 策略 `coursewares_student_select_learning` 已收紧为“已发布 + 有结构化 JSON + 学生角色”。
- RLS 验证：发布前学生读不到；教师发布后学生可读；取消发布后学生再次读不到；其他教师不能更新该课件。
- 真实浏览器验证：教师点击发布 `bc26231a-e161-4214-bfd2-3ae5d605bec5` 后，学生端可见 `J-MATH-RJ-71-05-03` 一元一次方程的解法学习包。

## P2 阶段5验证状态：基础练习与掌握记录 MVP

- 学生基础练习作答记录 MVP 已完成。
- 新增数据表：`student_practice_records`。
- 新增 API：`POST /api/student-practice`。
- 新增 SQL：`supabase/add-student-practice-records.sql`。
- `/student/knowledge` 的基础练习已支持输入答案、提交答案、显示判定结果、标准答案、解析和最近记录时间。
- `POST /api/student-practice` 只接收 `coursewareId`、`practiceItemIndex`、`studentAnswer`；题目、标准答案、知识点编码均由服务端从已发布 `coursewares.content_json` 读取，避免客户端伪造标准答案。
- 当前判定方式为最小规则：答案标准化后精确匹配；不做复杂数学等价判断。
- RLS 验证：学生可以写入并读取自己的练习记录；教师不能读取或写入学生练习记录。
- 浏览器验证：学生提交 `J-MATH-RJ-71-05-03` 第 1 道基础练习后，页面显示“需要再复习”，数据库生成 `student_practice_records.id = cbe035a3-76c9-4522-880c-a155091439d6`。
- 当前阶段仍不生成班级学情分析；日/周复习任务已在 P2 阶段6实现。

## P2 阶段6验证状态：日/周复习系统 MVP

- 学生日/周复习系统 MVP 已完成。
- 新增数据表：`student_review_tasks`。
- 新增 API：`POST /api/student-review`。
- 新增 SQL：`supabase/add-student-review-tasks.sql`。
- `/student/review` 已从占位页改为智能复习页，支持查看待复习任务、最近完成任务和完成复习操作。
- `POST /api/student-practice` 已在学生提交练习后自动生成复习任务：答错生成次日错题复习，所有作答生成一周回顾。
- 复习任务继续围绕 `knowledge_point_code` 与 `knowledge_point_name` 组织，后续可接入学生知识点掌握状态。
- RLS 验证：学生只能读取和更新自己的复习任务；教师不能读取或更新学生复习任务。
- 浏览器验证：学生提交 `J-MATH-RJ-71-05-03` 练习错题后生成 2 条复习任务。
- 验证写入记录：`student_practice_records.id = fc34886a-ca37-4eb6-b01a-3b22d5438e9e`。
- 生成错题复习任务：`student_review_tasks.id = 0d6af99b-bfed-446b-8ff7-bb9eb7b20b5b`，`due_date = 2026-06-14`。
- 生成一周回顾任务：`student_review_tasks.id = 13e9d330-4dea-49c0-935a-4c93e3404dcc`，`due_date = 2026-06-20`。
- 浏览器验证：学生访问 `/student/review` 能看到“智能复习”“错题复习”“一周回顾”，点击“完成复习”后任务状态更新为 `completed`。
- 当前阶段仍不生成教师端班级学情分析，只完成学生个人复习闭环。

## P2 阶段7验证状态：两端数据整合最小版

- 教师端学习数据只读视图已完成。
- 新增数据表：`teacher_student_links`。
- 新增 SQL：`supabase/add-teacher-student-links.sql`。
- `/teacher/analytics` 已由占位页改为学习数据页。
- 教师工作台入口文案已从“学情分析”调整为“学习数据”，避免过早承诺完整学情分析。
- `/teacher/analytics` 展示：关联学生数、练习提交数、正确率、待复习数、知识点基础掌握信号、学生概览、最近练习记录、待复习任务。
- RLS 已收紧：教师只能读取 `teacher_student_links` 中已关联学生的 `student_practice_records` 与 `student_review_tasks`。
- `profiles` 远端 RLS 已启用并修复：教师只能读取自己的 profile 与已关联学生 profile。
- 新增 private schema 辅助函数：`private.is_teacher(user_id uuid)`，用于避免 RLS 策略递归；函数不放在 public 暴露 schema。
- 远端 Supabase 已应用迁移：`add_teacher_student_links`、`harden_profiles_rls_for_teacher_student_links`、`fix_teacher_student_links_rls_recursion`。
- 测试教师与测试学生已建立验证关联：`teacher_id = 852ce6cb-175e-4b99-be6f-f5075ed48647`，`student_id = 3b2421b0-5dc9-46e1-a9dd-719d36067a1e`。
- RLS 验证：测试教师可读取 1 个关联学生、3 条练习记录、2 条复习任务。
- RLS 验证：另一个教师读取不到该学生的练习与复习数据。
- RLS 验证：学生读取不到 `teacher_student_links`。
- 真实浏览器验证：测试教师登录 `/teacher/analytics` 后可见 `J-MATH-RJ-71-05-03` 一元一次方程的解法学习数据。
- 真实浏览器验证：另一个教师登录 `/teacher/analytics` 后只显示空状态，不能看到样板学生数据。
- 当前阶段仍不生成掌握度模型、不做班级学情大屏、不做教师端编辑学生范围 UI。

## P2 阶段8准备验证状态：教师端学生范围管理 MVP

- 教师端学生范围管理 MVP 已完成。
- 新增页面：`/teacher/students`。
- 新增 server actions：`app/teacher/students/actions.ts`。
- 新增 SQL：`supabase/add-teacher-student-link-management.sql`。
- `/teacher/page.tsx` 已新增“学生范围”入口。
- `/teacher/analytics` 已新增“管理学生范围”入口，空状态也可跳转到学生范围管理。
- `/student` 已展示当前学生自己的“我的学生ID”，用于发给老师建立关联。
- `teacher_student_links` 已增加教师 insert/delete RLS 策略。
- 新增 private schema 辅助函数：`private.is_student(user_id uuid)`，用于校验被添加账号必须是学生。
- 远端 Supabase 已应用迁移：`add_teacher_student_link_management`。
- RLS 验证：测试教师可移除并重新添加测试学生。
- RLS 验证：教师不能把教师账号作为学生添加。
- RLS 验证：学生不能写入 `teacher_student_links`。
- 真实浏览器验证：教师可在 `/teacher/students` 移除测试学生，页面进入空状态。
- 真实浏览器验证：教师可在 `/teacher/students` 输入学生ID重新添加测试学生。
- 真实浏览器验证：重新添加后 `/teacher/analytics` 恢复显示 `J-MATH-RJ-71-05-03` 学习数据。
- 当前阶段仍不做全量学生搜索、不做班级导入、不做掌握度模型。

## Codex接管时间

2026-06-12

## 接管工具链

GPT
↓
Cursor
↓
Codex

## P2 阶段9验证状态：课件编辑与可视化预览 MVP

- 教师端课件编辑与可视化预览 MVP 已完成。
- 新增页面组件：`app/teacher/courseware-history/[id]/courseware-json-editor.tsx`。
- 新增 API：`PUT /api/courseware/[id]`。
- 新增编辑校验封装：`lib/courseware-edit.ts`。
- 新增 SQL：`supabase/allow-teacher-update-courseware-content-json.sql`。
- `/teacher/courseware-history/[id]` 已支持结构化课件卡片式预览。
- 教师可编辑学习目标、课堂小结、课件页面标题、页面正文、老师备注、基础练习题、答案、解析和难度。
- 教师可删除不合适的课件页面和基础练习，但至少保留 1 页和 1 道练习。
- 保存编辑后自动将课件设为未发布，要求老师重新确认后发布给学生。
- 远端 Supabase 已应用迁移：`allow_teacher_update_courseware_content_json`。
- API 验证：未登录调用 `PUT /api/courseware/[id]` 返回 HTTP 401。
- RLS/API 验证：其他教师编辑不属于自己的课件返回 HTTP 404。
- 浏览器验证：测试教师可打开编辑器、保存编辑、课件变为未发布；重新发布后课件恢复为已发布。
- 当前阶段仍不做 PPTX 导出、复杂动画、三维演示或多模型接入。

## P2 阶段10验证状态：学生端可视化课件播放器 MVP

- 学生端可视化课件播放器 MVP 已完成。
- 新增页面：`/student/courseware/[id]`。
- 新增组件：`app/student/courseware/[id]/courseware-player-client.tsx`。
- `/student/knowledge` 已新增“打开课件学习”入口，指向老师已发布课件。
- 播放器读取 `coursewares.content_json`，仅展示 `is_published = true` 且 `content_json is not null` 的课件。
- 播放器支持课件目录、进度条、上一页、下一页、学习目标、核心概念、课后巩固和基础练习。
- 学生可在播放器内提交基础练习，继续复用 `POST /api/student-practice`，并沉淀练习记录和复习任务。
- 未登录访问 `/student/courseware/[id]` 返回 HTTP 307 跳转登录。
- 浏览器验证：学生从 `/student/knowledge` 点击“打开课件学习”可进入 `/student/courseware/bc26231a-e161-4214-bfd2-3ae5d605bec5`。
- 浏览器验证：播放器显示“课件目录”“基础练习”，下一页切换可用。
- 浏览器验证：学生在播放器内提交练习后显示“回答正确”或“需要再复习”。
- 当前阶段仍不做复杂动画、三维演示、PPTX 导出或课堂互动回收。

## P2 阶段11验证状态：学生学习进度与课件学习记录 MVP

- 学生学习进度与课件学习记录 MVP 已完成。
- 新增数据表：`student_courseware_progress`。
- 新增 API：`POST /api/student-courseware-progress`。
- 新增 SQL：`supabase/add-student-courseware-progress.sql`。
- 远端 Supabase 已应用迁移：`add_student_courseware_progress`。
- `/student/courseware/[id]` 已在进入课件、翻页和点击“标记完成学习”时记录课件学习进度。
- 记录字段包括：学生、课件、知识点编码、知识点名称、最后浏览页、页数、学习状态、首次打开时间、最近学习时间、完成时间。
- `/teacher/analytics` 已展示课件学习指标、学生概览中的课件完成数，以及最近课件学习记录。
- `POST /api/student-courseware-progress` 缺字段返回 HTTP 400。
- `POST /api/student-courseware-progress` 未登录完整请求返回 HTTP 401。
- RLS 验证：学生可读取自己的课件进度，关联教师可读取该学生课件进度，其他教师读取不到。
- 浏览器验证：学生登录后打开 `/student/courseware/bc26231a-e161-4214-bfd2-3ae5d605bec5`，翻页并标记完成，页面显示“已完成学习”。
- 浏览器验证：教师登录 `/teacher/analytics` 后显示“课件学习 1/1”、学生概览“课件 1/1”和最近课件学习记录。
- `npx tsc --noEmit`：通过。
- `git diff --check`：通过，仅有 Windows LF/CRLF 提示。
- 当前阶段仍不计算掌握度模型、不生成完整学情分析报告。

## P2 阶段12验证状态：掌握度规则 MVP

- 掌握度规则 MVP 已完成。
- 新增数据表：`student_knowledge_mastery`。
- 新增 API：`POST /api/student-mastery/refresh`。
- 新增计算封装：`lib/student-mastery.ts`。
- 新增 SQL：`supabase/add-student-knowledge-mastery.sql`。
- 远端 Supabase 已应用迁移：`add_student_knowledge_mastery`。
- 掌握度输入包括：`student_courseware_progress`、`student_practice_records`、`student_review_tasks`。
- 掌握度输出包括：课件打开/完成数、练习次数、正确次数、错误次数、正确率、待复习数、已完成复习数、掌握分、掌握等级和原因。
- 掌握等级当前仅为轻量信号：`needs_work`、`basic`、`stable`。
- `POST /api/student-mastery/refresh` 未登录返回 HTTP 401。
- 学生登录后刷新样板知识点掌握度成功，生成记录 `student_knowledge_mastery.id = 757875f7-5439-4728-af86-3d7d0259723a`。
- RLS 验证：学生可读自己的掌握度；关联教师可读该学生掌握度；另一个教师读不到。
- `/teacher/analytics` 已展示“待巩固”指标和“基础掌握快照”。
- 当前阶段仍不生成完整学情分析报告，不做复杂遗忘曲线或题目难度加权。

## P2 阶段13验证状态：学生弱项知识点视图 MVP

- 学生弱项知识点视图 MVP 已完成。
- 新增页面：`/student/mastery`。
- `/student` 学习中心已新增“弱项知识点”入口。
- `/student/mastery` 展示知识点掌握等级、掌握分、练习正确率、复习任务、课件学习完成情况、原因和下一步建议。
- 未登录访问 `/student/mastery` 返回 HTTP 307。
- 浏览器验证：学生登录后可从 `/student` 点击“弱项知识点”进入 `/student/mastery`。
- 浏览器验证：页面显示 `J-MATH-RJ-71-05-03` 一元一次方程的解法，并显示“待巩固”和下一步建议。
- `npx tsc --noEmit`：通过。
- `git diff --check`：通过，仅有 Windows LF/CRLF 提示。
- 当前阶段仍不生成新练习题，只引导学生回到智能复习和知识点学习。

## P2 阶段14验证状态：动态课件幻灯片式演示舞台 MVP

- 动态课件已从嵌入式小组件升级为幻灯片式演示舞台 MVP。
- 新增共享组件：`app/_components/dynamic-courseware-demo.tsx`。
- 学生课件播放器 `/student/courseware/[id]` 已接入动态演示。
- 教师课件详情 `/teacher/courseware-history/[id]` 已接入“动态课件预览”。
- 样板点 `J-MATH-RJ-71-05-03` 一元一次方程的解法已支持单屏演示舞台：完整推导链、当前变化面板、播放/暂停、上一页/下一页、底部时间轴。
- 样板点 `J-MATH-RJ-71-01-03` 数轴已支持 16:9 演示舞台：拖动点观察当前数、相反数、距离区间和到 0 距离。
- 其他知识点先使用幻灯片式“分步理解”演示舞台。
- 浏览器验证：学生端课件页面显示“幻灯片式动态课件”，同一画面可见完整演化，点击“播放”后步骤推进。
- 浏览器验证：教师端课件详情显示“动态课件预览”和同一套幻灯片式演示舞台。
- `npx tsc --noEmit`：通过。
- `git diff --check`：通过，仅有 Windows LF/CRLF 提示。
- 当前仍不是视频导出、PPTX 导出或三维演示；后续需要继续按知识点沉淀动态模板。

## P2 阶段14补强验证状态：完整演化与重点标记

- `CoursewareJson` 已新增可选 `dynamic_storyboards`，用于承载所有课件的完整动态演化脚本。
- `prompts/courseware.md` 与 `prompts/courseware-json.md` 已明确要求：不能跳步，必须保留观察、操作、依据、中间结果、检查点和重点标记。
- `dynamic_storyboards[].steps[].emphasis_points` 用于前端标红或重点提示关键知识节点。
- 学生端动态舞台已优先渲染 `dynamic_storyboards`；旧课件没有脚本时继续使用样板模板或兜底脚本。
- 一元一次方程样板已从 4 步扩展为 8 步，补齐“观察所有项、确定整理目标、两边同减 2x、合并同类项、两边同加 3、合并常数、两边同除以 2、结果检查”。
- 教师端课件编辑器已支持编辑动态演示脚本和每一步“本步重点标记”。
- 浏览器验证：学生端样板课件显示 8 步演化过程、“本步重点”，并在第 3 步显示“不能只减一边”“2x - 2x = 0”。
- 浏览器验证：教师端详情页显示动态课件预览、动态演示脚本编辑区和“本步重点标记”字段。
- `npx tsc --noEmit`：通过。
- `git diff --check`：通过，仅有 Windows LF/CRLF 提示。

## P2 阶段14补充：课件资产化与低成本复用准备

- 当前不新增数据库表、不改 `coursewares` schema，先在 `coursewares.content_json.asset_metadata` 中记录课件资产元信息。
- 新增客户端安全类型模块：`lib/courseware-asset.ts`、`lib/courseware-types.ts`。
- `POST /api/courseware` 保存课件时写入模型来源：Markdown 生成模型、JSON 生成模型、provider、生成时间。
- 教师发布/取消发布课件时，同步更新元数据：发布后标记为 `teacher_verified` + `class`，取消发布后回到 `draft` + `private`。
- 教师课件历史列表和详情页展示资源来源、质量状态、可见范围、授权状态和模型记录状态。
- 学生知识点学习页展示课件来源标签，为后续“老师课件 / 平台精选课件 / 官方基础资源”选择做准备。
- 本阶段目标是降低长期模型调用成本：老师或平台生成好的优质课件沉淀为可复用资产，学生端优先消费已保存内容，不重复调用高成本模型。

## P2 阶段15：课件资源库与学生多课件选择 MVP

- 完成状态：已完成。
- 新增教师端页面：`/teacher/courseware-library`，作为当前教师个人课件资源库入口。
- 数据来源：继续读取 `coursewares`，不新增数据库表，不改变现有 RLS 策略。
- 资源库能力：按已发布资源和草稿/待确认资源分组展示，显示知识点编码、课件发布状态、资产来源、质量状态、可见范围、版权状态、模型来源记录。
- 教师工作台入口：`/teacher` 新增“课件资源库”卡片，和“AI课件生成”“课件历史”形成生成、确认、沉淀、复用闭环。
- 学生端能力：`/student/knowledge` 不再只保留同知识点最新一份课件，改为保留所有已发布且有 `content_json` 的结构化课件。
- 学生端选择：同一 `knowledge_point_code` 下存在多份课件时，学生可以切换不同课件版本；单份课件时保持原有学习体验。
- 产品原则：优先沉淀老师确认过的高质量课件，学生端优先复用已保存资源，降低重复调用高成本模型的次数。
- 验证：`npx tsc --noEmit` 通过；`git diff --check` 通过，仅有 Windows LF/CRLF 提示。
- 后续方向：继续完善平台精选/班级共享规则、资源质量审核、学生端课件推荐排序，不进入复杂三维和完整学情分析。

### P2 阶段15补充修正

- 新增 `lib/courseware-storyboard.ts`：将动态课件 storyboard 规范化逻辑拆到客户端安全文件，避免前端误打包依赖 `fs/promises` 的 `lib/courseware-json.ts`。
- 已将 `courseware-edit`、课件历史详情页、课件历史列表、发布 action、学生练习/进度 API 的纯类型引用改为 `lib/courseware-types.ts` 或 `lib/courseware-storyboard.ts`。
- 当前 `lib/courseware-json.ts` 仅保留给服务端 AI 结构化课件生成 API 使用。

## P2 阶段16：资源推荐排序、资源库筛选与模型设置页

- 完成状态：已完成。
- 新增推荐排序封装：`lib/courseware-ranking.ts`，用于给课件资源计算推荐分、推荐标签和推荐理由。
- 学生端 `/student/knowledge` 已按推荐分排序同知识点下的可用课件，并展示“为什么推荐这份学习包”。
- 教师端 `/teacher/courseware-library` 已展示推荐分、推荐标签、推荐依据，并支持按知识点名称/编码/章节搜索。
- 教师端资源库新增筛选：全部、已发布、草稿、推荐资源、需复核。
- 新增教师端页面：`/teacher/model-settings`，展示各 AI 任务当前 provider/model/baseURL 配置状态。
- `/teacher/model-settings` 支持对单个任务发起短提示词连通性测试，不在前端保存或展示 API Key。
- `/teacher` 已新增“AI模型设置”入口。
- `GET /api/ai-model-test` 已返回默认配置和任务级模型配置矩阵。
- `POST /api/ai-model-test` 已支持按任务测试模型。
- `middleware.ts` 已优化：非受保护路径不再先请求 Supabase；受保护路径无 Supabase session cookie 时直接跳登录，降低无登录访问超时风险。
- 验证：`npx tsc --noEmit` 通过；相关文件 `git diff --check` 通过。
- 浏览器验证：教师端 `/teacher/model-settings` 可打开，模型矩阵可见，短提示词模型测试返回成功。
- 浏览器验证：教师端 `/teacher` 可见“AI模型设置”入口。
- HTTP 验证：未登录访问 `/teacher/model-settings` 返回 307 到 `/auth/login?redirect=%2Fteacher%2Fmodel-settings`。

## P2 阶段17：弱项巩固入口与 Prompt 单来源收口

- 完成状态：已完成。
- 学生弱项页 `/student/mastery` 的操作按钮已从泛跳转改为按知识点直达。
- “针对复习”跳转到 `/student/review?code={knowledge_point_code}`。
- “去做基础练习”跳转到 `/student/knowledge?code={knowledge_point_code}#practice`。
- 学生知识点学习页 `/student/knowledge` 已支持 `code` query，进入后优先选中对应知识点。
- 学生知识点学习页基础练习区已增加 `#practice` 锚点。
- 智能复习页 `/student/review` 已支持 `code` query，能聚焦单个知识点的复习任务。
- 当某知识点暂无复习任务时，`/student/review?code=...` 会提示学生先回到对应知识点基础练习。
- `middleware.ts` 已修复登录跳转丢 query 的问题：受保护路径跳登录时 `redirect` 会保留完整 path + search。
- 教案生成 Prompt 已从 `lib/deepseek.ts` 内联模板迁移到 `prompts/lesson-generator.md`。
- 学生答疑 Prompt 已新增 `prompts/student-qa.md`，`lib/student-qa.ts` 只保留角色型 system prompt 和模型调用逻辑。
- 教案生成逻辑已迁移到 `lib/lesson-plan.ts`，`lib/deepseek.ts` 仅保留兼容导出。
- 验证：`npx tsc --noEmit` 通过。
- 验证：相关文件 `git diff --check` 通过，仅有 Windows LF/CRLF 提示。
- HTTP 验证：未登录访问 `/student/knowledge?code=J-MATH-RJ-71-05-03` 会跳转到 `/auth/login?redirect=%2Fstudent%2Fknowledge%3Fcode%3DJ-MATH-RJ-71-05-03`，不再丢失知识点编码。
- HTTP 验证：未登录访问 `/student/review?code=J-MATH-RJ-71-05-03` 会跳转到 `/auth/login?redirect=%2Fstudent%2Freview%3Fcode%3DJ-MATH-RJ-71-05-03`。

## P2 阶段18：教师数据到课件资源操作入口

- 完成状态：已完成。
- 教师端学习数据页 `/teacher/analytics` 的“知识点基础掌握信号”表已新增“资源”列。
- 老师可从知识点汇总行直接进入 `/teacher/courseware-library?q={knowledge_point_code}` 查找已有课件。
- 老师可从知识点汇总行直接进入 `/teacher/courseware?knowledgePointCode={knowledge_point_code}&source=analytics` 生成该知识点课件。
- “基础掌握快照”表已新增“查看资源”入口，指向对应知识点的课件资源库筛选结果。
- 学生端 `/student/knowledge?code=...` 已新增“正在巩固一个弱项知识点”提示，说明当前学习包与弱项巩固目标相关。
- 验证：`npx tsc --noEmit` 通过。
- 浏览器验证：教师账号访问 `/teacher/analytics` 后，页面显示“资源”列、`查课件`、`生成`、`查看资源`，链接携带 `J-MATH-RJ-71-05-03`。

## P2 阶段19：学生错题后的直达巩固动作

- 完成状态：已完成。
- 学生端知识点学习页 `/student/knowledge` 的基础练习结果卡已补齐错题后动作。
- 学生答错后显示 `复习这个知识点`，跳转到 `/student/review?code={knowledge_point_code}`。
- 学生答错后显示 `继续基础练习`，跳转到 `/student/knowledge?code={knowledge_point_code}#practice`。
- 学生端课件播放器 `/student/courseware/[id]` 的练习结果卡已接入同一套动作。
- 正确作答不显示额外动作，避免打扰学生正常学习节奏。
- 本阶段继续复用 `student_practice_records`、`student_review_tasks` 和既有 RLS，不新增表、不进入完整学情分析。
- 验证：`npx tsc --noEmit` 通过。
- 浏览器验证：学生测试账号访问 `/student/knowledge?code=J-MATH-RJ-71-05-03#practice`，提交错误答案后显示“需要再复习”“复习这个知识点”“继续基础练习”。
- 浏览器验证：学生课件播放器 `/student/courseware/bc26231a-e161-4214-bfd2-3ae5d605bec5` 的错题结果卡显示同样两个入口。
- 浏览器验证：`/student/review?code=J-MATH-RJ-71-05-03` 显示聚焦弱项知识点、待复习任务、`去做基础练习` 和 `查看全部复习`。

### P2 阶段19补充：动态课件播放节奏修正

- 修复 `DynamicCoursewareDemo` 通用 storyboard 舞台自动播放仍写死 `1800ms` 的问题。
- 通用 storyboard 舞台现在和方程样板舞台一样，按每一步文字量、重点标记数量和慢放模式计算 `stepDuration`。
- 修复后长步骤会停留更久，点击“慢放”会真实影响自动播放节奏，更符合“学生能看清完整演化过程”的目标。
- 验证：`npx tsc --noEmit` 通过。
- 浏览器验证：学生课件播放器中动态课件普通状态显示 `4 秒节奏`，点击 `慢放` 后显示 `慢放中` 和 `6 秒节奏`。

## P2 阶段20：错题到课件练习位置的直达聚焦

- 完成状态：已完成。
- 学生知识点学习页错题结果卡新增 `打开课件重看本题` 入口。
- 入口指向 `/student/courseware/{courseware_id}?practice={practice_index}#practice-{practice_number}`。
- 学生课件播放器 `/student/courseware/[id]` 已支持读取 `practice` query。
- 当 `practice` 合法时，播放器会显示“正在重看第 N 题”提示，并自动滚动到对应练习卡片。
- 对应练习卡片会使用 amber ring 高亮，帮助学生从错题快速定位回课件中的原题。
- 课件播放器练习结果卡已补齐 `错误原因` 展示，与知识点学习页保持一致。
- 本阶段不新增表、不改 RLS、不生成新题，继续复用已有课件、练习记录和复习任务。
- 验证：`npx tsc --noEmit` 通过。
- 浏览器验证：`/student/knowledge?code=J-MATH-RJ-71-05-03#practice` 的错题卡显示 `打开课件重看本题`，href 为 `/student/courseware/bc26231a-e161-4214-bfd2-3ae5d605bec5?practice=0#practice-1`。
- 浏览器验证：打开该课件链接后，页面显示“正在重看第 1 题”，`#practice-1` 卡片有高亮 ring，并显示错误原因和复习入口。

## P2 阶段21：复习任务到错题课件的直达入口

- 完成状态：已完成。
- `/student/review` 已从 `student_review_tasks.source_practice_record_id` 关联读取错题来源练习记录。
- 复习任务类型新增来源信息：题目、学生答案、标准答案、错误原因和来源课件题号。
- 错题复习任务卡新增 `重看错题课件` 入口。
- 入口指向 `/student/courseware/{courseware_id}?practice={practice_item_index}#practice-{practice_item_index + 1}`。
- 查询层对 Supabase 嵌套返回做了对象/数组兼容归一化，避免不同类型推断影响页面渲染。
- 本阶段继续复用已有 `student_review_tasks` 与 `student_practice_records`，不新增表、不改 RLS。
- 验证：`npx tsc --noEmit` 通过。
- 浏览器验证：学生访问 `/student/review?code=J-MATH-RJ-71-05-03` 后，页面显示“错题来源”“你的答案”“标准答案”“错误原因”和 `重看错题课件`。
- 浏览器验证：`重看错题课件` href 为 `/student/courseware/bc26231a-e161-4214-bfd2-3ae5d605bec5?practice=0#practice-1`。
- 浏览器验证：打开该链接后，课件页显示“正在重看第 1 题”，目标题卡高亮，并显示错误原因。

## P2 阶段22：教师端错题到课件题目的定位入口

- 完成状态：已完成。
- 教师学习数据页 `/teacher/analytics` 的最近练习记录新增 `资源` 列。
- 最近练习记录有 `courseware_id` 时显示 `看课件题`，指向 `/teacher/courseware-history/{courseware_id}?practice={practice_item_index}#practice-{practice_item_index + 1}`。
- 教师学习数据页的待复习任务卡已通过 `source_practice_record_id` 映射到对应练习记录。
- 待复习任务卡已显示错题来源、学生答案、标准答案，并在可定位时显示 `重看课件题目`。
- 教师课件详情 `/teacher/courseware-history/[id]` 已支持读取 `practice` query。
- 教师课件结构化编辑器已支持自动滚动并高亮指定基础练习题。
- 本阶段不新增表、不修改 RLS，复用 `student_practice_records.courseware_id`、`practice_item_index` 和 `student_review_tasks.source_practice_record_id`。
- 验证：`npx tsc --noEmit` 通过。
- RLS/数据验证：教师测试账号可读取 4 条关联学生练习记录、4 条复习任务。
- RLS/链接验证：练习记录可构造 `/teacher/courseware-history/bc26231a-e161-4214-bfd2-3ae5d605bec5?practice=0#practice-1`。
- RLS/链接验证：复习任务来源 `source_practice_record_id = 465e3f73-867c-48f7-9809-64faa0c2faf1` 可构造同一课件题目链接。

## P2 阶段23：完成复习后保留错题来源

- 完成状态：已完成。
- 已确认 `POST /api/student-review` 完成复习后会调用 `refreshStudentKnowledgeMastery` 刷新掌握度。
- 修复问题：API 原本完成复习后只返回任务基础字段，前端会用返回 task 覆盖本地 task，导致 `source_practice_record` 丢失。
- `POST /api/student-review` 返回字段已扩展为包含 `source_practice_record_id`、`created_at` 和嵌套 `source_practice_record`。
- API 侧已对 Supabase 嵌套返回的对象/数组做归一化。
- `/student/review` 客户端完成复习后合并 task 状态时，会保留原有 `source_practice_record`。
- 结果：学生点击 `完成复习` 后，错题来源和 `重看错题课件` 不会从页面消失。
- 验证：`npx tsc --noEmit` 通过。
- 代码验证：`app/api/student-review/route.ts` 已返回归一化后的 `source_practice_record`。
- 代码验证：`app/student/review/student-review-client.tsx` 已在 `setLocalTasks` 中保留来源记录。

## 2026-06-14 节点记录：弱项巩固闭环补强

- 当前节点完成范围：P2 阶段17 到 P2 阶段23。
- 核心目标：围绕“教育大纲基础知识打牢”，把学生弱项、错题、复习任务、课件回看和教师端数据定位串成可用闭环。
- 已完成：学生掌握页弱项入口可直达聚焦复习和基础练习。
- 已完成：`/student/knowledge` 和 `/student/review` 支持 `code` query，可围绕单个 `knowledge_point_code` 聚焦学习。
- 已完成：`lesson-plan` 与 `student-qa` 的 Prompt 双来源技术债已处理，业务 Prompt 统一落到 `prompts/lesson-generator.md` 与 `prompts/student-qa.md`。
- 已完成：教师学习数据页可从弱项知识点跳转到课件资源库或预选知识点生成课件。
- 已完成：学生答错题后可进入复习、继续基础练习，并可回到来源课件的具体题目。
- 已完成：复习任务可展示错题来源、学生答案、标准答案、错误原因，并可回看来源课件题目。
- 已完成：教师端可从学生错题和复习任务定位到教师课件详情中的对应题目。
- 已完成：完成复习任务后，前端仍保留错题来源和回看入口。
- 已完成：动态课件播放节奏从固定 1800ms 修正为使用 `stepDuration`，支持更完整的步骤停留和慢放。
- 数据主线：继续以 `knowledge_point_code` 串联 `coursewares`、`student_practice_records`、`student_review_tasks`、`student_knowledge_mastery` 和教师端数据视图。
- 当前样板验证知识点：`J-MATH-RJ-71-05-03` 一元一次方程的解法。
- 当前样板课件：`coursewares.id = bc26231a-e161-4214-bfd2-3ae5d605bec5`。

## P2 阶段24：复习完成后的来源保留与 API 归属硬化

- 完成状态：已完成。
- `POST /api/student-review` 更新复习任务时已显式追加 `.eq("user_id", user.id)`，避免只依赖 RLS 表达用户归属。
- `POST /api/student-review` 已从 `.single()` 改为 `.maybeSingle()`，当任务不存在或不属于当前学生时返回 404 和 `未找到可完成的复习任务`。
- `/student/review` 的“最近完成”列表已展示已复盘的错题来源、学生答案、错误原因。
- “最近完成”列表在来源课件仍可定位时继续显示 `重看错题课件`，指向来源课件的具体题目。
- 本阶段不新增数据库表、不改 RLS、不进入学情分析，只加固已有复习闭环。
- 验证：`npx tsc --noEmit` 通过。
- 验证：未登录 `POST /api/student-review` 仍返回 HTTP 401 和 `请先登录`。
- 代码验证：`app/api/student-review/route.ts` 已包含用户归属过滤、`maybeSingle()` 和 404 分支。
- 代码验证：`app/student/review/student-review-client.tsx` 已在 completed task 区域展示来源和回看入口。

## P2 阶段25：动态课件完整讲解路径补强

- 完成状态：已完成。
- 新增 `lib/courseware-playback.ts`，提供 `buildTeachingPanels`，把动态步骤拆为“上一画面、当前画面、本步操作、为什么可以这样做、学生自查”。
- 新增 `lib/courseware-playback.test.ts`，用 Node 内置测试验证步骤面板顺序、上一/当前状态和重点标记。
- `app/_components/dynamic-courseware-demo.tsx` 的通用 storyboard 舞台已接入完整讲解路径。
- 一元一次方程样板舞台已接入同一套完整讲解路径，避免“找同类项、移项、合并”等过程展示过粗。
- 右侧详情区域继续支持纵向滚动，并在当前步骤中展示操作、依据、自查和重点标记。
- 本阶段不引入复杂动画引擎、不做三维、不接入新模型，先提升当前动态课件的讲解完整度。
- 验证：`npx --yes tsx --test lib/courseware-playback.test.ts` 通过。
- 验证：`npx tsc --noEmit` 通过。
- 浏览器验证：学生账号打开 `/student/courseware/bc26231a-e161-4214-bfd2-3ae5d605bec5?practice=0`，页面显示“当前画面”“本步操作”“为什么可以这样做”“学生自查”。
- 浏览器验证：Next dev 构建错误已清除；唯一 console error 是 `/favicon.ico` 404，不属于本阶段功能错误。
## P2 阶段26：错题回看动态步骤建议

- 阶段状态：已完成。
- 目标：学生做错基础练习后，不只看到标准答案，还能知道应该回看动态课件中的哪一个关键步骤。
- 新增能力：`lib/courseware-playback.ts` 增加 `buildPracticeReplaySuggestion`，按练习题文本、答案、解析和动态演示步骤做轻量关键词匹配。
- 页面更新：`/student/courseware/[id]?practice={index}` 的定位提示和错题结果卡会显示“建议回看动态演示第 N 步”。
- 兜底策略：当已有课件 JSON 未携带 `dynamic_storyboards` 时，`J-MATH-RJ-71-05-03` 一元一次方程样板会复用内置动态步骤，避免学生看不到回看建议。
- 测试覆盖：`lib/courseware-playback.test.ts` 覆盖教学面板顺序、练习题到动态步骤匹配、无 storyboard 时的内置步骤兜底。
- 已验证样板：`bc26231a-e161-4214-bfd2-3ae5d605bec5?practice=0` 显示“建议回看动态演示第 4 步：移含 x 的项”。
## P2 阶段27：错题回看自动定位动态演示步骤

- 阶段状态：已完成。
- 目标：学生从错题回到课件时，动态演示不再默认停在第 1 步，而是直接打开错题建议对应的关键步骤。
- 新增能力：`DynamicCoursewareDemo` 支持 `initialStepIndex`，`StoryboardStage`、一元一次方程内置演示和通用分步演示都会将初始步骤夹在合法范围内。
- 学生端接入：`/student/courseware/[id]?practice={index}` 将 `buildPracticeReplaySuggestion` 算出的 `stepIndex` 传给动态课件。
- 样板验证：`bc26231a-e161-4214-bfd2-3ae5d605bec5?practice=0` 进入后动态演示直接显示“第 4 / 8 步”，第 4 步“移含 x 的项”处于“正在讲”状态。
- 测试覆盖：`getInitialPlaybackStepIndex` 覆盖正常、负数、越界、空值、无步骤数量等情况。
## P2 阶段28：错题建议一键回看动态演示

- 阶段状态：已完成。
- 目标：学生看到“建议回看动态演示第 N 步”后，可以直接点击按钮回到动态演示区域，减少在长页面里手动寻找演示的成本。
- 新增能力：`lib/courseware-playback.ts` 增加 `getDynamicReplayTargetId`，为课件动态演示区域生成稳定 DOM 锚点。
- 页面更新：`/student/courseware/[id]?practice={index}` 的错题定位提示和错题结果卡新增“查看动态演示第 N 步”按钮。
- 交互效果：点击按钮后，页面平滑滚动到动态演示区域；动态演示仍保持阶段27的建议步骤定位。
- 样板验证：从第 1 题错题卡点击“查看动态演示第 4 步”后，页面滚动回动态演示区域，`replayTop` 约为 24px，且仍显示“第 4 / 8 步”。
## P2 阶段29：练习题到动态步骤强关联字段

- 阶段状态：已完成。
- 目标：减少错题回看依赖关键词匹配的不确定性，让结构化课件 JSON 能直接标注每道练习题对应的动态演示步骤。
- 新增字段：`practice_items[].target_storyboard_step`，使用从 1 开始的步骤编号，指向 `dynamic_storyboards[0].steps` 中最应该回看的讲解步骤。
- 类型更新：`lib/courseware-types.ts` 和 `lib/courseware-json.ts` 的 `CoursewareJson.practice_items` 均支持 `target_storyboard_step`。
- 归一化更新：`lib/courseware-json.ts` 和 `lib/courseware-edit.ts` 会保留正整数 `target_storyboard_step`，无效值归一化为 `undefined`。
- 回看逻辑更新：`buildPracticeReplaySuggestion` 优先使用 `target_storyboard_step`；没有该字段时继续使用阶段26的关键词/公式片段匹配兜底。
- Prompt 更新：`prompts/courseware-json.md` 要求后续 AI 生成的每道练习题必须带 `target_storyboard_step`。
# 知桥AI 开发基线补充：P2 阶段32 数轴动态课件完整分镜

- 状态：P2 阶段32已完成，未提交，未 push。
- 本阶段目标：把 `J-MATH-RJ-71-01-03` 数轴从粗略交互演示提升为“同一画面完整演化”的 8 步内置动态分镜样板。
- 新增能力：
  - `lib/courseware-playback.ts` 为数轴增加内置 `DynamicStoryboard`，覆盖三要素、原点、正方向、单位长度、正数、负数、相反数、大小比较。
  - `lib/courseware-storyboard.ts` 新增 `normalizeCoursewareStoryboardsForDisplay`，教师端预览、教师编辑器、学生端播放器统一使用归一化后的动态分镜。
  - `/teacher/courseware-history/[id]` 上方“动态课件预览”现在能显示完整数轴分镜，不再只在编辑器里显示。
  - `/student/courseware/[id]` 学生播放器同样使用完整数轴分镜。
  - `POST /api/student-courseware-progress` 已将掌握度刷新改为非阻塞副作用，避免进度已保存但掌握度刷新失败时让学生端报错。
- 验证：
  - `npx --yes tsx --test lib/courseware-playback.test.ts` 通过。
  - `npx --yes tsx --test lib/courseware-storyboard.test.ts` 通过。
  - `npx --yes tsx --test lib/courseware-edit.test.ts` 通过。
  - `npx tsc --noEmit` 通过。
  - Playwright 验证教师端 `/teacher/courseware-history/7651acd5-2d1c-4f3a-8778-3d1699082884` 显示“数轴完整演化”和 8 步脚本，并可切换到第 2 步“确定原点”。
  - Playwright 验证学生端 `/student/courseware/7651acd5-2d1c-4f3a-8778-3d1699082884` 显示“数轴完整演化”，且不再出现“保存课件学习进度失败”。
- 说明：学生端验证期间临时发布测试课件 `7651acd5-2d1c-4f3a-8778-3d1699082884`，验证后已恢复为未发布。
- 剩余风险：
  - 目前只有数轴和一元一次方程具备高质量内置分镜，其他知识点仍依赖 AI JSON 或通用 fallback。
  - 数轴仍是 HTML 分镜式动态课件，不是 PPTX 导出、视频渲染或真实几何动画引擎。
  - `student_knowledge_mastery` 刷新失败已被隔离为非阻塞，但底层权限/聚合失败原因还需后续单独排查。
  - 旧文档和部分页面源码存在中文编码显示异常，后续需要单独做编码清理。

# 知桥AI 开发基线补充：ofox / GPT 接入验证

- 状态：已完成本地接入验证，未提交，未 push。
- 目标：让教案、课件、结构化课件 JSON、知识点讲解、学生答疑可以通过统一 AI 网关切换到 ofox OpenAI-compatible 接口，便于对比 GPT 系模型生成质量。
- 配置：
  - `.env.local` 当前使用 `AI_PROVIDER=ofox`、`AI_BASE_URL=https://api.ofox.ai/v1`、`gpt-4.1-mini`。
  - 本机 Node 访问 ofox 需要系统代理，已新增可选 `AI_PROXY_URL` 支持；`.env.example` 已记录该变量，部署环境可留空。
- 技术调整：
  - `lib/ai.ts` 支持按需加载 `undici` 的 `ProxyAgent`，只在设置 `AI_PROXY_URL` 时启用代理。
  - `getAIClient()` 改为异步，教案、课件、知识点讲解、学生答疑、模型测试接口均已同步 `await`。
  - 教案、课件、知识点讲解、学生答疑 Prompt 已补充“不要 AI 套话、不要 Markdown 代码围栏、像真实老师课堂使用”的约束。
- 验证：
  - `/api/ai-model-test` 的 `lesson-plan`、`courseware`、`courseware-json`、`knowledge-explain`、`student-qa` 任务均返回 200。
  - 真实业务接口验证通过：`POST /api/lesson-plan`、`POST /api/knowledge-explain`、`POST /api/courseware`、`POST /api/student-qa`。
  - 新生成课件 `611f1a55-9643-4f5b-a127-11a5e49bbe19` 使用 ofox 生成 Markdown 和 JSON，JSON 包含 9 页、3 道练习、1 个动态分镜。
  - Prompt 调整后抽测教案 `c7160224-68c4-4f27-852c-7b7fa69687fc` 不再输出 ```markdown 代码围栏。
  - 页面 HTTP 回归通过：`/teacher`、`/teacher/lesson-generator`、`/teacher/courseware`、`/teacher/courseware-history`、`/teacher/knowledge-explain`、`/teacher/model-settings` 均返回 200。
  - `npx tsc --noEmit` 通过。
- 剩余风险：
  - ofox/GPT 生成质量需要更多样板知识点人工验收。
  - 本次以 HTTP 和受保护 API 验证为主，未做真实浏览器点击生成流程复验。
  - `AI_PROXY_URL` 只用于本地网络需要代理的环境，线上部署应根据实际网络决定是否配置。
  - 不同 GPT 模型成本不同，后续需要按任务区分默认模型和高质量模型，避免教师/学生端成本失控。
