# K12 知识库 Excel / CSV 导入模板

## 知识点导入模板字段

必填字段：

- `code`：知识点编码，例如 `J-MATH-RJ-71-01-03`。
- `name`：知识点名称。
- `stage`：学段，例如 `junior`。
- `subject`：学科，例如 `数学`。
- `grade`：年级，例如 `七年级`。
- `chapter`：章节名称。
- `summary`：知识点概述。
- `learning_objective`：学习目标。
- `teaching_focus`：教学重点。
- `teaching_difficulty`：教学难点。

可选字段：

- `standard_reference`：课程标准引用。
- `core_competency`：核心素养。
- `difficulty_level`：难度，建议 1-5。
- `importance_level`：重要度，建议 1-5。
- `source_name`：来源名称。
- `review_note`：导入备注。

## 题目导入模板字段

必填字段：

- `question_text`：题干。
- `answer`：答案。
- `knowledge_point_code`：建议关联知识点编码。

可选字段：

- `explanation`：解析。
- `question_type`：题型，例如 `choice`、`short_answer`、`calculation`。
- `difficulty_level`：难度，建议 1-5。
- `source_name`：来源名称。
- `copyright_note`：版权说明。

## 常见错误导入模板字段

必填字段：

- `knowledge_point_code`：知识点编码。
- `mistake_type`：错误类型。
- `description`：错误说明。

可选字段：

- `example`：错误示例。
- `correction_strategy`：纠正策略。
- `source_name`：来源名称。

## 教学资源导入模板字段

必填字段：

- `knowledge_point_code`：知识点编码。
- `resource_type`：资源类型，例如 `explanation`、`example`、`activity`。
- `title`：资源标题。

可选字段：

- `content`：资源正文。
- `source_url`：来源链接。
- `source_name`：来源名称。
- `copyright_note`：版权说明。

## 字段校验规则

- 必填字段不能为空，空字符串按缺失处理。
- `code`、`knowledge_point_code` 必须符合项目知识点编码规则。
- `difficulty_level` 和 `importance_level` 必须是 1-5 的整数。
- 题目必须至少有题干和答案；解析可以后补。
- 外部来源必须先登记到 `external_sources`，导入时绑定 `source_id`。
- 原始行数据必须保存在 `raw_payload`，不能只保存清洗后的字段。

## 重复数据处理规则

- 知识点按 `code` 去重；同名但不同编码不能自动合并。
- 题目按完全一致的 `question_text` 初步去重；相似题只标记为候选重复，不自动删除。
- 常见错误按 `knowledge_point_code + mistake_type` 初步去重。
- 教学资源按 `knowledge_point_code + title + source_name` 初步去重。
- 重复项仍进入暂存表，审核人确认后决定合并、拒绝或作为新内容保留。

## 导入失败处理规则

- 文件格式错误：导入任务状态设为 `failed`，记录 `error_message`。
- 部分行失败：任务继续解析，失败行写入暂存项的 `raw_payload` 并标记低置信度或待人工处理。
- 编码无法匹配：`suggested_knowledge_point_id` 为空，`review_status` 保持 `pending`。
- 授权不明确：不得进入正式库，只能保留在暂存表并标记审核备注。
- 审核拒绝：暂存项 `review_status` 更新为 `rejected`，并写入 `external_mapping_reviews`。
