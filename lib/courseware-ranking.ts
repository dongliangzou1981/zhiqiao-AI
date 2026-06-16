import {
  getCoursewareAssetMetadata,
  type CoursewareAssetLike,
  type CoursewareAssetMetadata,
} from "@/lib/courseware-asset";

type RankableCourseware = {
  content_json: unknown;
  is_published?: boolean;
  created_at: string;
};

const qualityScore: Record<CoursewareAssetMetadata["quality_status"], number> = {
  platform_verified: 400,
  teacher_verified: 260,
  draft: 40,
};

const visibilityScore: Record<CoursewareAssetMetadata["visibility"], number> = {
  public: 160,
  school: 120,
  class: 90,
  private: 10,
};

const sourceScore: Record<CoursewareAssetMetadata["source_type"], number> = {
  platform_curated: 180,
  official_seed: 160,
  teacher_generated: 100,
};

const licenseScore: Record<CoursewareAssetMetadata["license_status"], number> = {
  share_allowed: 80,
  private_use: 40,
  needs_review: -160,
};

function isStructuredCourseware(value: unknown) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      (value as { version?: unknown }).version === "courseware_json_v1"
  );
}

function getAssetLike(value: unknown): CoursewareAssetLike | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as CoursewareAssetLike;
}

function createdAtScore(iso: string) {
  const time = new Date(iso).getTime();
  if (!Number.isFinite(time)) return 0;

  // Keep recency useful without letting it dominate quality.
  return Math.min(80, Math.max(0, Math.floor((time - 1_700_000_000_000) / 86_400_000)));
}

export function scoreCoursewareResource(record: RankableCourseware): number {
  const metadata = getCoursewareAssetMetadata(getAssetLike(record.content_json));

  return (
    qualityScore[metadata.quality_status] +
    visibilityScore[metadata.visibility] +
    sourceScore[metadata.source_type] +
    licenseScore[metadata.license_status] +
    (record.is_published ? 120 : 0) +
    (isStructuredCourseware(record.content_json) ? 90 : 0) +
    (metadata.generated_by ? 30 : 0) +
    createdAtScore(record.created_at)
  );
}

export function getCoursewareRecommendation(record: RankableCourseware) {
  const metadata = getCoursewareAssetMetadata(getAssetLike(record.content_json));
  const score = scoreCoursewareResource(record);

  if (metadata.license_status === "needs_review") {
    return {
      label: "需版权复核",
      tone: "warning" as const,
      score,
    };
  }

  if (metadata.quality_status === "platform_verified") {
    return {
      label: "平台优选",
      tone: "strong" as const,
      score,
    };
  }

  if (metadata.quality_status === "teacher_verified" && record.is_published) {
    return {
      label: "推荐学习",
      tone: "good" as const,
      score,
    };
  }

  if (!record.is_published) {
    return {
      label: "待发布",
      tone: "muted" as const,
      score,
    };
  }

  return {
    label: "可学习",
    tone: "neutral" as const,
    score,
  };
}

export function getCoursewareRecommendationReasons(record: RankableCourseware): string[] {
  const metadata = getCoursewareAssetMetadata(getAssetLike(record.content_json));
  const reasons: string[] = [];

  if (metadata.license_status === "needs_review") {
    return ["这份资源仍需完成版权或来源复核，暂不应作为优先推荐。"];
  }

  if (record.is_published) {
    reasons.push("已发布到学生端，可直接用于学习。");
  } else {
    reasons.push("仍是教师草稿，适合继续检查后再发布。");
  }

  if (metadata.quality_status === "platform_verified") {
    reasons.push("平台已验证，适合作为优先学习资源。");
  } else if (metadata.quality_status === "teacher_verified") {
    reasons.push("教师已确认内容，适合班级复用。");
  } else {
    reasons.push("内容还未确认，建议老师复核后再扩大使用。");
  }

  if (isStructuredCourseware(record.content_json)) {
    reasons.push("包含结构化课件数据，学生端可以复用目标、例题、练习和动态演示。");
  } else {
    reasons.push("当前主要是 Markdown 内容，后续可升级为结构化课件。");
  }

  if (metadata.visibility === "public" || metadata.visibility === "school") {
    reasons.push("可见范围较广，后续更适合沉淀为共享资源。");
  }

  return reasons.slice(0, 4);
}

export function sortCoursewareResources<T extends RankableCourseware>(records: T[]): T[] {
  return [...records].sort((left, right) => {
    const scoreDiff = scoreCoursewareResource(right) - scoreCoursewareResource(left);
    if (scoreDiff !== 0) return scoreDiff;

    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
  });
}
