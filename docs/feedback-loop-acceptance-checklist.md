# 学生反馈课件闭环验收清单

本清单用于阶段49发布前验收。目标是确认学生课件反馈可以稳定回流到教师动作，并且候选版在老师确认前不会影响学生端正式课件。

## 前置条件

- 已配置 `.env.local`，包含 Supabase URL、anon key、service role key 和 AI 网关变量。
- 远端 Supabase 已存在并可访问：
  - `courseware_revisions`
  - `student_courseware_feedback`
  - `student_review_tasks.task_type = teacher_review`
- 至少准备 1 个教师账号、1 个已关联学生账号、1 份已发布课件。
- 本地服务启动后使用同一浏览器分别验证教师端和学生端登录态。

## 自动化基线

每次验收前先运行：

```bash
npm run typecheck
npm test
npm run test:courseware
npm run smoke:feedback-loop
git diff --check
```

如需做真实账号浏览器链路验收，先在 `.env.local` 配置以下变量，再运行半自动验收脚本：

```bash
npm run acceptance:feedback-loop
```

该脚本不会写入账号密码，也不会自动绕过登录；它会检查是否已配置教师账号、学生账号、课件 id 和知识点，并输出浏览器逐步执行 URL、动作、预期结果和证据点。缺少账号变量时应视为真实浏览器验收阻塞，不要把账号密码硬编码到脚本或文档中。

验收通过标准：

- TypeScript 无错误。
- 单测全部通过。
- 闭环预检脚本不写入数据，只检查文档、路由和远端表可查询状态；失败项必须处理或记录原因。
- `git diff --check` 退出码为 0；Windows LF/CRLF 提示不算失败。

## 浏览器链路

1. 学生打开已发布课件。
   - 预期：学生端能看到正式课件内容。
   - 预期：反馈面板可提交“没看懂”和“希望老师再讲”。

2. 学生提交负反馈。
   - 预期：请求成功。
   - 预期：刷新掌握度后，该知识点只出现“待巩固信号”，不显示完整诊断结论。

3. 教师打开 `/teacher/analytics`。
   - 预期：“学生请求老师再讲”区域出现该学生、知识点、反馈文本。
   - 预期：跟进状态初始为“待跟进”。
   - 预期：可点击“去优化课件”“看来源课件”“查资源”“布置复习”。

4. 教师点击“去优化课件”。
   - 预期：进入 `/teacher/courseware-history/{id}?feedback=student#courseware-quality-instruction`。
   - 预期：优化要求文本框已预填学生反馈摘要。
   - 预期：页面明确说明候选版采用前不会覆盖正式课件。

5. 教师生成优化候选版。
   - 预期：等待时显示生成进度提示。
   - 预期：接口返回后出现候选版对比区。
   - 预期：学生端正式课件在采用前不变化。

6. 教师采用候选版并发布。
   - 预期：采用 API 成功。
   - 预期：发布后数据库 `is_published=true`，课件元数据 `visibility=class`。
   - 预期：教师学习数据页反馈状态可变为“已采用新版”或“已发布新版”。

7. 教师布置复习，学生完成复习。
   - 预期：教师端创建 `teacher_review` 任务成功。
   - 预期：学生 `/student/review` 显示“老师布置复习”。
   - 预期：学生完成后任务状态变为 `completed`，并触发掌握度刷新。

## 记录模板

- 验收日期：
- 教师账号：
- 学生账号：
- 课件 id：
- 知识点：
- 自动化命令结果：
- 浏览器链路结果：
- 发现问题：
- 是否可发布试用：
