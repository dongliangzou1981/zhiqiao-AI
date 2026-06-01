/**
 * 知桥 AI · 初中数学本地知识库（V1）
 * 人教版 · 七年级上册 · 节选章节
 */

export type KnowledgePoint = {
  id: string;
  code: string;
  name: string;
  description: string;
};

export type Chapter = {
  id: string;
  code: string;
  name: string;
  order: number;
  knowledgePoints: KnowledgePoint[];
};

export type Semester = {
  id: string;
  name: string;
  order: number;
  chapters: Chapter[];
};

export type Grade = {
  id: string;
  name: string;
  order: number;
  semesters: Semester[];
};

export type Textbook = {
  id: string;
  code: string;
  name: string;
  subject: string;
  version: string;
  stage: string;
};

export type JuniorMathKnowledgeBase = {
  textbook: Textbook;
  grades: Grade[];
};

const TEXTBOOK: Textbook = {
  id: "textbook-j-math-rj",
  code: "J-MATH-RJ",
  name: "人教版初中数学",
  subject: "数学",
  version: "人教版",
  stage: "初中",
};

const GRADE_7_SEMESTER_1: Semester = {
  id: "semester-7-1",
  name: "上册",
  order: 1,
  chapters: [
    {
      id: "chapter-71-01",
      code: "J-MATH-RJ-71-01",
      name: "有理数",
      order: 1,
      knowledgePoints: [
        {
          id: "kp-J-MATH-RJ-71-01-01",
          code: "J-MATH-RJ-71-01-01",
          name: "正数和负数",
          description:
            "理解具有相反意义的量，会用正数和负数表示实际问题中的数量，建立符号意识。",
        },
        {
          id: "kp-J-MATH-RJ-71-01-02",
          code: "J-MATH-RJ-71-01-02",
          name: "有理数",
          description:
            "掌握有理数的概念，明确整数、分数与有理数的关系，能在数轴上表示有理数。",
        },
        {
          id: "kp-J-MATH-RJ-71-01-03",
          code: "J-MATH-RJ-71-01-03",
          name: "数轴",
          description:
            "理解数轴的三要素（原点、正方向、单位长度），会用数轴表示和比较有理数。",
        },
        {
          id: "kp-J-MATH-RJ-71-01-04",
          code: "J-MATH-RJ-71-01-04",
          name: "相反数与绝对值",
          description:
            "掌握相反数、绝对值的定义与性质，能求一个数的相反数和绝对值，并用于化简与比较。",
        },
        {
          id: "kp-J-MATH-RJ-71-01-05",
          code: "J-MATH-RJ-71-01-05",
          name: "有理数的加减法",
          description:
            "熟练运用有理数加减法则，掌握减法转化为加法，能进行加减混合运算并处理符号。",
        },
        {
          id: "kp-J-MATH-RJ-71-01-06",
          code: "J-MATH-RJ-71-01-06",
          name: "有理数的乘除法与乘方",
          description:
            "掌握有理数乘除法则、倒数概念及乘方运算，理解「同号得正、异号得负」等符号规律。",
        },
      ],
    },
    {
      id: "chapter-71-03",
      code: "J-MATH-RJ-71-03",
      name: "整式",
      order: 2,
      knowledgePoints: [
        {
          id: "kp-J-MATH-RJ-71-03-01",
          code: "J-MATH-RJ-71-03-01",
          name: "用字母表示数",
          description:
            "理解用字母表示数的意义，能把简单实际问题中的数量关系用含字母的式子表示。",
        },
        {
          id: "kp-J-MATH-RJ-71-03-02",
          code: "J-MATH-RJ-71-03-02",
          name: "代数式",
          description:
            "了解代数式的概念，能正确书写代数式，并会根据已知条件求代数式的值。",
        },
        {
          id: "kp-J-MATH-RJ-71-03-03",
          code: "J-MATH-RJ-71-03-03",
          name: "整式",
          description:
            "掌握单项式、多项式的概念，理解系数、次数、项等术语，会对整式进行分类。",
        },
        {
          id: "kp-J-MATH-RJ-71-03-04",
          code: "J-MATH-RJ-71-03-04",
          name: "同类项与合并同类项",
          description:
            "识别同类项，掌握合并同类项的方法，能对整式进行化简。",
        },
        {
          id: "kp-J-MATH-RJ-71-03-05",
          code: "J-MATH-RJ-71-03-05",
          name: "整式的加减",
          description:
            "掌握去括号法则，能进行整式的加减运算，并用于解决简单的化简求值问题。",
        },
      ],
    },
    {
      id: "chapter-71-05",
      code: "J-MATH-RJ-71-05",
      name: "一元一次方程",
      order: 3,
      knowledgePoints: [
        {
          id: "kp-J-MATH-RJ-71-05-01",
          code: "J-MATH-RJ-71-05-01",
          name: "方程与方程的解",
          description:
            "理解方程、方程的解、解方程等概念，会检验一个数是否为给定方程的解。",
        },
        {
          id: "kp-J-MATH-RJ-71-05-02",
          code: "J-MATH-RJ-71-05-02",
          name: "等式的性质",
          description:
            "掌握等式的两条性质，理解「移项」的依据，并能用于简单变形。",
        },
        {
          id: "kp-J-MATH-RJ-71-05-03",
          code: "J-MATH-RJ-71-05-03",
          name: "一元一次方程的解法",
          description:
            "熟练解一元一次方程（含去分母、去括号、移项、合并同类项等步骤）。",
        },
        {
          id: "kp-J-MATH-RJ-71-05-04",
          code: "J-MATH-RJ-71-05-04",
          name: "实际问题与一元一次方程",
          description:
            "能分析行程、工程、利润等典型应用题的数量关系，列一元一次方程求解并检验合理性。",
        },
      ],
    },
  ],
};

const GRADE_7: Grade = {
  id: "grade-7",
  name: "七年级",
  order: 7,
  semesters: [GRADE_7_SEMESTER_1],
};

/** 初中数学知识库完整数据集 */
export const juniorMathKnowledgeBase: JuniorMathKnowledgeBase = {
  textbook: TEXTBOOK,
  grades: [GRADE_7],
};

/** 七年级上册（快捷引用） */
export const grade7Semester1 = GRADE_7_SEMESTER_1;

/** 全部知识点扁平列表（便于检索与下拉选择） */
export const allKnowledgePoints: KnowledgePoint[] = GRADE_7_SEMESTER_1.chapters.flatMap(
  (chapter) => chapter.knowledgePoints
);

/** 按编码查找知识点 */
export function getKnowledgePointByCode(code: string): KnowledgePoint | undefined {
  return allKnowledgePoints.find((kp) => kp.code === code);
}

/** 默认导出 */
export default juniorMathKnowledgeBase;
