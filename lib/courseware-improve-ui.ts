type GetCoursewareImproveButtonLabelParams = {
  loading: boolean;
  issueCount: number;
  passedRequired: boolean;
};

export function getCoursewareImproveButtonLabel({
  loading,
  issueCount,
  passedRequired,
}: GetCoursewareImproveButtonLabelParams) {
  if (loading) {
    return "正在生成优化候选版...";
  }

  if (issueCount > 0) {
    return `按 ${issueCount} 个问题生成优化候选版`;
  }

  if (passedRequired) {
    return "再生成一个优化候选版";
  }

  return "生成优化候选版";
}

export function getCoursewareImproveProgressMessage(elapsedSeconds: number) {
  if (elapsedSeconds >= 120) {
    return "仍在生成结构化课件内容。此步骤依赖模型响应，完成前不会覆盖正式课件。";
  }

  if (elapsedSeconds >= 45) {
    return "正在等待结构化课件生成结果。候选版生成较慢时，请先不要重复点击。";
  }

  if (elapsedSeconds >= 10) {
    return "正在根据质量问题和学生反馈生成优化候选版。";
  }

  return "正在整理质量问题、学生反馈和当前课件参考。";
}
