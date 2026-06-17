# PROJECT_CONTROL

## 1. 项目路径

`D:\Codex\Projects\Active\zhiqiao-AI`

## 2. 当前分支

`codex/content-quality-revision`

## 3. 当前基线

- `git status --short` 为空
- `npm run typecheck` 通过
- `npm test` 通过，78 passed
- `npm run test:courseware` 通过，46 passed
- `npm run smoke:feedback-loop` 通过，5 passed
- `git diff --check` 通过

## 4. 当前最近提交

- `759b3ad` test: add feedback loop validation tooling
- `9cfa1a9` feat: add teacher review assignments
- `2b2b59c` feat: add courseware feedback loop
- `75a66a1` feat: add k12 external import staging
- `796bbc9` feat: add k12 knowledge base foundation

## 5. Codex 每轮执行规则

- 每轮开始必须先 `git status --short`
- 不得覆盖已有未提交改动
- 每轮只做一个明确任务
- 不得顺手优化
- 不得大规模重构
- 不得修改无关文件
- 测试失败必须停止并汇报
- 通过测试后才允许提交

## 6. GPT 使用规则

- GPT 只能基于 `PROJECT_CONTROL.md` 和 Codex 输出生成下一轮指令
- 不得重新规划整个项目
- 不得扩大任务范围
- 不得推翻已有提交
- 每轮只生成一个明确 Codex 任务

## 7. 当前下一步

等待 GPT 基于本次接回状态生成下一轮唯一任务，Codex 不得自行继续开发。
