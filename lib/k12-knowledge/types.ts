export type SchoolStage = {
  id: string;
  name: string;
  code: string;
  order_index: number;
};

export type Subject = {
  id: string;
  stage_id: string;
  name: string;
  code: string;
  description: string | null;
};

export type Grade = {
  id: string;
  stage_id: string;
  name: string;
  code: string;
  order_index: number;
};

export type TextbookVersion = {
  id: string;
  subject_id: string;
  name: string;
  publisher: string | null;
  code: string;
  description: string | null;
};

export type TextbookBook = {
  id: string;
  textbook_version_id: string;
  grade_id: string;
  name: string;
  semester: string | null;
  book_code: string | null;
  description: string | null;
};

export type Chapter = {
  id: string;
  textbook_book_id: string;
  parent_id: string | null;
  title: string;
  chapter_code: string | null;
  order_index: number | null;
  description: string | null;
};

export type KnowledgePoint = {
  id: string;
  subject_id: string | null;
  stage_id: string | null;
  grade_id: string | null;
  chapter_id: string | null;
  code: string;
  name: string;
  description?: string | null;
  summary: string | null;
  curriculum_standard_id: string | null;
  standard_reference: string | null;
  core_competency: string | null;
  learning_objective: string | null;
  teaching_focus: string | null;
  teaching_difficulty: string | null;
  difficulty_level: number | null;
  importance_level: number | null;
  created_at?: string;
  updated_at?: string | null;
};

export type KnowledgePointRelationType =
  | "prerequisite"
  | "next"
  | "related"
  | "includes"
  | "part_of"
  | "commonly_confused_with"
  | "same_method"
  | "same_question_type";

export type KnowledgePointRelation = {
  id: string;
  source_knowledge_point_id: string;
  target_knowledge_point_id: string;
  relation_type: KnowledgePointRelationType;
  description: string | null;
  weight: number | null;
};

export type CommonMistake = {
  id: string;
  knowledge_point_id: string;
  mistake_type: string;
  description: string | null;
  example: string | null;
  correction_strategy: string | null;
};

export type Question = {
  id: string;
  subject_id: string | null;
  stage_id: string | null;
  grade_id: string | null;
  question_text: string;
  question_type: string | null;
  answer: string | null;
  explanation: string | null;
  difficulty_level: number | null;
  source_type: string | null;
  created_at: string;
};

export type TeachingResource = {
  id: string;
  knowledge_point_id: string;
  resource_type: string | null;
  title: string;
  content: string | null;
  source_url: string | null;
  source_name: string | null;
  copyright_note: string | null;
  created_at: string;
};

export type StudentWeaknessRecord = {
  id: string;
  student_id: string;
  knowledge_point_id: string;
  mastery_level: number | null;
  mistake_count: number;
  last_mistake_at: string | null;
  suggested_review_strategy: string | null;
  updated_at: string;
};

export type KnowledgePointGraph = {
  knowledgePoint: KnowledgePoint | null;
  relations: KnowledgePointRelation[];
  relatedKnowledgePoints: KnowledgePoint[];
};

export type K12KnowledgeContext = {
  knowledgePoint: KnowledgePoint;
  commonMistakes: CommonMistake[];
  relations: KnowledgePointRelation[];
  relatedKnowledgePoints: KnowledgePoint[];
};
