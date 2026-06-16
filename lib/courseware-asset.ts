import type { CoursewareQualityReport } from "@/lib/courseware-quality";

export type CoursewareAssetMetadata = {
  source_type: "teacher_generated" | "platform_curated" | "official_seed";
  visibility: "private" | "class" | "school" | "public";
  quality_status: "draft" | "teacher_verified" | "platform_verified";
  license_status: "private_use" | "share_allowed" | "needs_review";
  creator_type: "teacher" | "platform" | "system";
  generated_by?: {
    markdown_provider: string;
    markdown_model: string;
    json_provider: string;
    json_model: string;
    html_provider?: string;
    html_model?: string;
  };
  generated_at?: string;
  content_quality?: CoursewareQualityReport;
};

export type CoursewareAssetLike = {
  asset_metadata?: Partial<CoursewareAssetMetadata> | null;
};

export function getDefaultCoursewareAssetMetadata(): CoursewareAssetMetadata {
  return {
    source_type: "teacher_generated",
    visibility: "private",
    quality_status: "draft",
    license_status: "private_use",
    creator_type: "teacher",
  };
}

export function getCoursewareAssetMetadata(
  json: CoursewareAssetLike | null | undefined
): CoursewareAssetMetadata {
  return {
    ...getDefaultCoursewareAssetMetadata(),
    ...(json?.asset_metadata ?? {}),
  };
}
