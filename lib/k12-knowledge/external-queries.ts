import { createClient } from "@/lib/supabase/server";
import type {
  CreateExternalImportJobInput,
  ExternalImportJob,
  ExternalKnowledgeItem,
  ExternalQuestionItem,
  ExternalReviewInput,
  ExternalSource,
} from "./external-types";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function getSupabase(client?: SupabaseClient) {
  return client ?? (await createClient());
}

function asArray<T>(value: T[] | null) {
  return value ?? [];
}

function clean(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed || null;
}

export function normalizeCreateExternalImportJobInput(
  input: CreateExternalImportJobInput
) {
  const sourceId = clean(input.sourceId);
  const importType = clean(input.importType);

  if (!sourceId) {
    throw new Error("sourceId is required");
  }
  if (!importType) {
    throw new Error("importType is required");
  }

  return {
    source_id: sourceId,
    import_type: importType,
    file_name: clean(input.fileName),
  };
}

export function normalizeExternalReviewInput(input: ExternalReviewInput) {
  const itemId = clean(input.itemId);
  if (!itemId) {
    throw new Error("itemId is required");
  }

  return {
    itemId,
    reviewerId: clean(input.reviewerId),
    targetId: clean(input.targetId),
    note: clean(input.note),
  };
}

export async function getExternalSources(
  client?: SupabaseClient
): Promise<ExternalSource[]> {
  const supabase = await getSupabase(client);
  const { data, error } = await supabase
    .from("external_sources")
    .select("id, name, source_type, homepage_url, license, allowed_usage, description, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return asArray(data) as ExternalSource[];
}

export async function createExternalImportJob(
  input: CreateExternalImportJobInput,
  client?: SupabaseClient
): Promise<ExternalImportJob> {
  const supabase = await getSupabase(client);
  const payload = normalizeCreateExternalImportJobInput(input);
  const { data, error } = await supabase
    .from("external_import_jobs")
    .insert(payload)
    .select(
      "id, source_id, import_type, file_name, status, total_items, parsed_items, accepted_items, rejected_items, error_message, created_at, updated_at"
    )
    .single();
  if (error) throw error;
  return data as ExternalImportJob;
}

export async function getExternalImportJobs(
  client?: SupabaseClient
): Promise<ExternalImportJob[]> {
  const supabase = await getSupabase(client);
  const { data, error } = await supabase
    .from("external_import_jobs")
    .select(
      "id, source_id, import_type, file_name, status, total_items, parsed_items, accepted_items, rejected_items, error_message, created_at, updated_at"
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return asArray(data) as ExternalImportJob[];
}

export async function getPendingExternalKnowledgeItems(
  client?: SupabaseClient
): Promise<ExternalKnowledgeItem[]> {
  const supabase = await getSupabase(client);
  const { data, error } = await supabase
    .from("external_knowledge_items")
    .select(
      "id, import_job_id, source_id, raw_payload, normalized_name, normalized_summary, suggested_subject, suggested_stage, suggested_grade, suggested_knowledge_point_id, match_confidence, review_status, reviewer_note, created_at"
    )
    .eq("review_status", "pending")
    .order("match_confidence", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return asArray(data) as ExternalKnowledgeItem[];
}

export async function getPendingExternalQuestionItems(
  client?: SupabaseClient
): Promise<ExternalQuestionItem[]> {
  const supabase = await getSupabase(client);
  const { data, error } = await supabase
    .from("external_question_items")
    .select(
      "id, import_job_id, source_id, raw_payload, question_text, answer, explanation, suggested_subject, suggested_stage, suggested_grade, suggested_knowledge_point_id, match_confidence, review_status, reviewer_note, created_at"
    )
    .eq("review_status", "pending")
    .order("match_confidence", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return asArray(data) as ExternalQuestionItem[];
}

export async function approveExternalKnowledgeItem(
  input: ExternalReviewInput,
  client?: SupabaseClient
) {
  return reviewExternalItem({
    input,
    table: "external_knowledge_items",
    itemType: "external_knowledge_item",
    status: "approved",
    action: "approve",
    targetTable: "knowledge_points",
    client,
  });
}

export async function rejectExternalKnowledgeItem(
  input: ExternalReviewInput,
  client?: SupabaseClient
) {
  return reviewExternalItem({
    input,
    table: "external_knowledge_items",
    itemType: "external_knowledge_item",
    status: "rejected",
    action: "reject",
    targetTable: "external_knowledge_items",
    client,
  });
}

export async function approveExternalQuestionItem(
  input: ExternalReviewInput,
  client?: SupabaseClient
) {
  return reviewExternalItem({
    input,
    table: "external_question_items",
    itemType: "external_question_item",
    status: "approved",
    action: "approve",
    targetTable: "question_bank",
    client,
  });
}

export async function rejectExternalQuestionItem(
  input: ExternalReviewInput,
  client?: SupabaseClient
) {
  return reviewExternalItem({
    input,
    table: "external_question_items",
    itemType: "external_question_item",
    status: "rejected",
    action: "reject",
    targetTable: "external_question_items",
    client,
  });
}

async function reviewExternalItem(params: {
  input: ExternalReviewInput;
  table: "external_knowledge_items" | "external_question_items";
  itemType: "external_knowledge_item" | "external_question_item";
  status: "approved" | "rejected";
  action: "approve" | "reject";
  targetTable: string;
  client?: SupabaseClient;
}) {
  const supabase = await getSupabase(params.client);
  const normalized = normalizeExternalReviewInput(params.input);
  const targetId = params.action === "approve" ? normalized.targetId : normalized.itemId;

  const { data, error } = await supabase
    .from(params.table)
    .update({
      review_status: params.status,
      reviewer_note: normalized.note,
    })
    .eq("id", normalized.itemId)
    .select("*")
    .single();
  if (error) throw error;

  const { error: reviewError } = await supabase
    .from("external_mapping_reviews")
    .insert({
      external_item_type: params.itemType,
      external_item_id: normalized.itemId,
      target_table: params.targetTable,
      target_id: targetId,
      action: params.action,
      reviewer_id: normalized.reviewerId,
      note: normalized.note,
    });
  if (reviewError) throw reviewError;

  return data as ExternalKnowledgeItem | ExternalQuestionItem;
}
