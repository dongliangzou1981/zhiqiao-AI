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
