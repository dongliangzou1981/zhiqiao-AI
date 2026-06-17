import assert from "node:assert/strict";
import test from "node:test";
import {
  findKnowledgePointByText,
  formatK12KnowledgeContext,
} from "./k12-knowledge/context";
import type { K12KnowledgeContext, KnowledgePoint } from "./k12-knowledge/types";

const points: KnowledgePoint[] = [
  {
    id: "kp-1",
    subject_id: null,
    stage_id: null,
    grade_id: null,
    chapter_id: null,
    code: "K1",
    name: "有理数",
    summary: "理解有理数范围。",
    curriculum_standard_id: null,
    standard_reference: null,
    core_competency: null,
    learning_objective: null,
    teaching_focus: null,
    teaching_difficulty: null,
    difficulty_level: null,
    importance_level: null,
  },
  {
    id: "kp-2",
    subject_id: null,
    stage_id: null,
    grade_id: null,
    chapter_id: null,
    code: "K2",
    name: "有理数加法",
    summary: "掌握加法法则。",
    curriculum_standard_id: null,
    standard_reference: null,
    core_competency: null,
    learning_objective: null,
    teaching_focus: null,
    teaching_difficulty: null,
    difficulty_level: null,
    importance_level: null,
  },
];

test("findKnowledgePointByText prefers the longest matching knowledge point", () => {
  const match = findKnowledgePointByText("有理数加法为什么异号要相减？", points);
  assert.equal(match?.code, "K2");
});

test("formatK12KnowledgeContext injects objectives, mistakes and related points", () => {
  const context: K12KnowledgeContext = {
    knowledgePoint: {
      ...points[1],
      learning_objective: "会判断同号、异号两类加法。",
      teaching_focus: "有理数加法法则。",
      teaching_difficulty: "异号两数相加的符号判断。",
    },
    commonMistakes: [
      {
        id: "m1",
        knowledge_point_id: "kp-2",
        mistake_type: "有理数加减符号错误",
        description: "把异号相加直接相加绝对值。",
        example: null,
        correction_strategy: null,
      },
    ],
    relations: [],
    relatedKnowledgePoints: [points[0]],
  };

  const formatted = formatK12KnowledgeContext(context);
  assert.match(formatted, /学习目标：会判断同号、异号两类加法/);
  assert.match(formatted, /常见错误：有理数加减符号错误/);
  assert.match(formatted, /相关知识点：有理数/);
});
