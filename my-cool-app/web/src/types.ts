export type Puzzle = {
  id: string;
  language?: Language;
  level: 1 | 2 | 3;
  code: string[];
  /** Zero-based index into `code`. */
  bugLine: number;
  explanation: string;
  fix: string;
  expectedOutput: string;
};

export type Language = "JavaScript" | "Python";
