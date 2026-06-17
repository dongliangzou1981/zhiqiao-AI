import { createClient } from "@/lib/supabase/server";
import { findKnowledgePointByText } from "./context";
import type {
  Chapter,
  CommonMistake,
  K12KnowledgeContext,
  KnowledgePoint,
  KnowledgePointGraph,
  KnowledgePointRelation,
  Question,
  SchoolStage,
  StudentWeaknessRecord,
  Subject,
  TextbookBook,
  TextbookVersion,
  Grade,
} from "./types";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function getSupabase(client?: SupabaseClient) {
  return client ?? (await createClient());
}

function asArray<T>(value: T[] | null) {
  return value ?? [];
}

export async function getStages(client?: SupabaseClient): Promise<SchoolStage[]> {
  const supabase = await getSupabase(client);
  const { data, error } = await supabase
    .from("school_stages")
    .select("id, name, code, order_index")
    .order("order_index");
  if (error) throw error;
  return asArray(data) as SchoolStage[];
}

export async function getSubjectsByStage(
  stageCode: string,
  client?: SupabaseClient
): Promise<Subject[]> {
  const supabase = await getSupabase(client);
  const { data: stage, error: stageError } = await supabase
    .from("school_stages")
    .select("id")
    .eq("code", stageCode)
    .single();
  if (stageError) throw stageError;

  const { data, error } = await supabase
    .from("subjects")
    .select("id, stage_id, name, code, description")
    .eq("stage_id", stage.id)
    .order("code");
  if (error) throw error;
  return asArray(data) as Subject[];
}

export async function getGradesByStage(
  stageCode: string,
  client?: SupabaseClient
): Promise<Grade[]> {
  const supabase = await getSupabase(client);
  const { data: stage, error: stageError } = await supabase
    .from("school_stages")
    .select("id")
    .eq("code", stageCode)
    .single();
  if (stageError) throw stageError;

  const { data, error } = await supabase
    .from("grades")
    .select("id, stage_id, name, code, order_index")
    .eq("stage_id", stage.id)
    .order("order_index");
  if (error) throw error;
  return asArray(data) as Grade[];
}

export async function getTextbookVersions(
  subjectId: string,
  client?: SupabaseClient
): Promise<TextbookVersion[]> {
  const supabase = await getSupabase(client);
  const { data, error } = await supabase
    .from("textbook_versions")
    .select("id, subject_id, name, publisher, code, description")
    .eq("subject_id", subjectId)
    .order("code");
  if (error) throw error;
  return asArray(data) as TextbookVersion[];
}

export async function getBooksByTextbookVersion(
  textbookVersionId: string,
  client?: SupabaseClient
): Promise<TextbookBook[]> {
  const supabase = await getSupabase(client);
  const { data, error } = await supabase
    .from("textbook_books")
    .select("id, textbook_version_id, grade_id, name, semester, book_code, description")
    .eq("textbook_version_id", textbookVersionId)
    .order("book_code");
  if (error) throw error;
  return asArray(data) as TextbookBook[];
}

export async function getChaptersByBook(
  bookId: string,
  client?: SupabaseClient
): Promise<Chapter[]> {
  const supabase = await getSupabase(client);
  const { data, error } = await supabase
    .from("chapters")
    .select("id, textbook_book_id, parent_id, title, chapter_code, order_index, description")
    .eq("textbook_book_id", bookId)
    .order("order_index");
  if (error) throw error;
  return asArray(data) as Chapter[];
}

export async function getKnowledgePointsByChapter(
  chapterId: string,
  client?: SupabaseClient
): Promise<KnowledgePoint[]> {
  const supabase = await getSupabase(client);
  const { data, error } = await supabase
    .from("knowledge_points")
    .select("*")
    .eq("chapter_id", chapterId)
    .order("code");
  if (error) throw error;
  return asArray(data) as KnowledgePoint[];
}

export async function getKnowledgePointGraph(
  knowledgePointId: string,
  client?: SupabaseClient
): Promise<KnowledgePointGraph> {
  const supabase = await getSupabase(client);
  const { data: knowledgePoint, error: pointError } = await supabase
    .from("knowledge_points")
    .select("*")
    .eq("id", knowledgePointId)
    .maybeSingle();
  if (pointError) throw pointError;

  const { data: relations, error: relationError } = await supabase
    .from("knowledge_point_relations")
    .select("id, source_knowledge_point_id, target_knowledge_point_id, relation_type, description, weight")
    .or(
      `source_knowledge_point_id.eq.${knowledgePointId},target_knowledge_point_id.eq.${knowledgePointId}`
    );
  if (relationError) throw relationError;

  const typedRelations = asArray(relations) as KnowledgePointRelation[];
  const relatedIds = [
    ...new Set(
      typedRelations
        .flatMap((relation) => [
          relation.source_knowledge_point_id,
          relation.target_knowledge_point_id,
        ])
        .filter((id) => id !== knowledgePointId)
    ),
  ];

  let relatedKnowledgePoints: KnowledgePoint[] = [];
  if (relatedIds.length > 0) {
    const { data: related, error: relatedError } = await supabase
      .from("knowledge_points")
      .select("*")
      .in("id", relatedIds)
      .order("code");
    if (relatedError) throw relatedError;
    relatedKnowledgePoints = asArray(related) as KnowledgePoint[];
  }

  return {
    knowledgePoint: (knowledgePoint as KnowledgePoint | null) ?? null,
    relations: typedRelations,
    relatedKnowledgePoints,
  };
}

export async function getCommonMistakes(
  knowledgePointId: string,
  client?: SupabaseClient
): Promise<CommonMistake[]> {
  const supabase = await getSupabase(client);
  const { data, error } = await supabase
    .from("common_mistakes")
    .select("id, knowledge_point_id, mistake_type, description, example, correction_strategy")
    .eq("knowledge_point_id", knowledgePointId)
    .order("mistake_type");
  if (error) throw error;
  return asArray(data) as CommonMistake[];
}

export async function getQuestionsByKnowledgePoint(
  knowledgePointId: string,
  client?: SupabaseClient
): Promise<Question[]> {
  const supabase = await getSupabase(client);
  const { data, error } = await supabase
    .from("question_knowledge_points")
    .select("question:question_bank(*)")
    .eq("knowledge_point_id", knowledgePointId);
  if (error) throw error;
  return asArray(data)
    .map((row) => (row as { question?: Question | Question[] }).question)
    .flat()
    .filter(Boolean) as Question[];
}

export async function getStudentWeaknessRecords(
  studentId: string,
  client?: SupabaseClient
): Promise<StudentWeaknessRecord[]> {
  const supabase = await getSupabase(client);
  const { data, error } = await supabase
    .from("student_weakness_records")
    .select(
      "id, student_id, knowledge_point_id, mastery_level, mistake_count, last_mistake_at, suggested_review_strategy, updated_at"
    )
    .eq("student_id", studentId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return asArray(data) as StudentWeaknessRecord[];
}

export async function getK12KnowledgeContextByCode(
  code: string,
  client?: SupabaseClient
): Promise<K12KnowledgeContext | null> {
  const supabase = await getSupabase(client);
  const { data: point, error } = await supabase
    .from("knowledge_points")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  if (error || !point) return null;

  return buildKnowledgeContext(point as KnowledgePoint, supabase);
}

export async function getK12KnowledgeContextByQuestion(
  question: string,
  client?: SupabaseClient
): Promise<K12KnowledgeContext | null> {
  const supabase = await getSupabase(client);
  const { data, error } = await supabase.from("knowledge_points").select("*").order("code");
  if (error) return null;

  const point = findKnowledgePointByText(question, asArray(data) as KnowledgePoint[]);
  if (!point) return null;

  return buildKnowledgeContext(point, supabase);
}

async function buildKnowledgeContext(
  point: KnowledgePoint,
  supabase: SupabaseClient
): Promise<K12KnowledgeContext> {
  const [mistakes, graph] = await Promise.all([
    getCommonMistakes(point.id, supabase).catch(() => []),
    getKnowledgePointGraph(point.id, supabase).catch(() => ({
      knowledgePoint: point,
      relations: [],
      relatedKnowledgePoints: [],
    })),
  ]);

  return {
    knowledgePoint: point,
    commonMistakes: mistakes,
    relations: graph.relations,
    relatedKnowledgePoints: graph.relatedKnowledgePoints,
  };
}
