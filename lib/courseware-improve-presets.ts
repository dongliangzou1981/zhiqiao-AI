export type CoursewareImprovePreset = {
  id: string;
  label: string;
  instruction: string;
};

export const coursewareImprovePresets: CoursewareImprovePreset[] = [
  {
    id: "complete-derivation",
    label: "补全推导",
    instruction: "补全关键推导步骤，每一步都说明为什么这样变形，不能跳步。",
  },
  {
    id: "student-friendly",
    label: "讲得更慢",
    instruction: "用更像一线老师讲课的方式解释，给基础薄弱学生更多提示和过渡。",
  },
  {
    id: "reduce-ai-tone",
    label: "减少 AI 腔",
    instruction: "减少套话和空泛表述，改成自然、具体、可直接上课讲的语言。",
  },
  {
    id: "projection-layout",
    label: "优化投屏",
    instruction: "优化 16:9 投屏版式，一页一重点，重点步骤高亮，避免滚动和拥挤。",
  },
];

export function getCoursewareImprovePresetText(id: string) {
  return coursewareImprovePresets.find((preset) => preset.id === id)?.instruction ?? "";
}
