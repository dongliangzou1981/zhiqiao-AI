export type ExternalSource = {
  id: string;
  name: string;
  source_type: string;
  homepage_url: string | null;
  license: string | null;
  allowed_usage: string | null;
  description: string | null;
  created_at: string;
};

export type ExternalImportJobStatus =
  | "pending"
  | "parsing"
  | "parsed"
  | "reviewing"
  | "completed"
  | "failed";

export type ExternalImportJob = {
  id: string;
  source_id: string;
  import_type: string;
  file_name: string | null;
  status: ExternalImportJobStatus;
  total_items: number;
  parsed_items: number;
  accepted_items: number;
  rejected_items: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type ExternalReviewStatus = "pending" | "approved" | "rejected";

export type ExternalKnowledgeItem = {
  id: string;
  import_job_id: string;
  source_id: string;
  raw_payload: Record<string, unknown>;
  normalized_name: string | null;
  normalized_summary: string | null;
  suggested_subject: string | null;
  suggested_stage: string | null;
  suggested_grade: string | null;
  suggested_knowledge_point_id: string | null;
  match_confidence: number | null;
  review_status: ExternalReviewStatus;
  reviewer_note: string | null;
  created_at: string;
};

export type ExternalQuestionItem = {
  id: string;
  import_job_id: string;
  source_id: string;
  raw_payload: Record<string, unknown>;
  question_text: string | null;
  answer: string | null;
  explanation: string | null;
  suggested_subject: string | null;
  suggested_stage: string | null;
  suggested_grade: string | null;
  suggested_knowledge_point_id: string | null;
  match_confidence: number | null;
  review_status: ExternalReviewStatus;
  reviewer_note: string | null;
  created_at: string;
};

export type ExternalMappingReview = {
  id: string;
  external_item_type: "external_knowledge_item" | "external_question_item";
  external_item_id: string;
  target_table: string;
  target_id: string | null;
  action: "approve" | "reject";
  reviewer_id: string | null;
  note: string | null;
  created_at: string;
};

export type CreateExternalImportJobInput = {
  sourceId: string;
  importType: string;
  fileName?: string | null;
};

export type ExternalReviewInput = {
  itemId: string;
  reviewerId?: string | null;
  targetId?: string | null;
  note?: string | null;
};
