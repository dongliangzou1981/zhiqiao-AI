import type { CoursewareAssetMetadata } from "@/lib/courseware-asset";

export type CoursewareJson = {
  version: "courseware_json_v1";
  knowledge_point_code: string;
  knowledge_point_name: string;
  subject: string;
  grade: string;
  semester: string;
  chapter: string;
  learning_goals: string[];
  prerequisite_knowledge: Array<{
    title: string;
    description: string;
  }>;
  core_concept: {
    title: string;
    explanation: string;
  };
  slides: Array<{
    slide_type: string;
    title: string;
    content: string;
    knowledge_point_code: string;
    teacher_notes?: string;
  }>;
  examples: Array<{
    title: string;
    question: string;
    solution_steps: string[];
    answer: string;
    knowledge_point_code: string;
  }>;
  common_mistakes: Array<{
    mistake: string;
    reason: string;
    correction: string;
    knowledge_point_code: string;
  }>;
  practice_items: Array<{
    question: string;
    difficulty: "基础" | "易错纠正" | "拓展挑战";
    answer: string;
    explanation: string;
    knowledge_point_code: string;
    target_storyboard_step?: number;
  }>;
  summary_points: string[];
  review_plan: Array<{
    timing: string;
    task: string;
  }>;
  interactive_html?: CoursewareInteractiveHtml;
  dynamic_storyboards?: DynamicStoryboard[];
  asset_metadata?: CoursewareAssetMetadata;
};

export type CoursewareInteractiveHtml = {
  title: string;
  html: string;
  instructions?: string;
};

export type DynamicStoryboard = {
  title: string;
  scene_type: "derivation" | "number_line" | "concept_evolution" | "process" | "comparison";
  learning_objective: string;
  knowledge_point_code: string;
  steps: DynamicStoryboardStep[];
  summary: string;
};

export type DynamicStoryboardStep = {
  step_title: string;
  narration: string;
  visual_state: string;
  formula_or_state?: string;
  visual_elements?: DynamicVisualElement[];
  operation?: string;
  operation_reason?: string;
  emphasis_points?: string[];
  teacher_prompt?: string;
  student_check?: string;
};

export type DynamicVisualElement = {
  kind:
    | "title"
    | "text"
    | "formula"
    | "badge"
    | "panel"
    | "arrow"
    | "highlight"
    | "number_line"
    | "comparison";
  text: string;
  role?: "primary" | "secondary" | "emphasis" | "success" | "warning" | "muted";
  group?: string;
  items?: string[];
};
