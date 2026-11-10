export type Puzzle = {
  id: string;
  level: 1 | 2 | 3;
  code: string[];
  /** Zero-based index into `code`. */
  bugLine: number;
  explanation: string;
  fix: string;
};
