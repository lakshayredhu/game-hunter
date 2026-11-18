import assert from "node:assert/strict";
import { test } from "node:test";
import { puzzles } from "./puzzles.ts";

test("puzzle IDs are unique", () => {
  const ids = puzzles.map((puzzle) => puzzle.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("every puzzle points to an existing code line", () => {
  for (const puzzle of puzzles) {
    assert.ok(puzzle.code.length > 1, `${puzzle.id} needs multiple code lines`);
    assert.ok(
      Number.isInteger(puzzle.bugLine) &&
        puzzle.bugLine >= 0 &&
        puzzle.bugLine < puzzle.code.length,
      `${puzzle.id} has an invalid bug line`,
    );
    assert.ok(puzzle.explanation.trim(), `${puzzle.id} needs an explanation`);
    assert.ok(puzzle.fix.trim(), `${puzzle.id} needs a corrected line`);
    assert.ok(puzzle.expectedOutput.trim(), `${puzzle.id} needs expected output`);
  }
});

test("JavaScript and Python puzzles cover every difficulty", () => {
  for (const language of ["JavaScript", "Python"]) {
    for (const level of [1, 2, 3]) {
      assert.ok(
        puzzles.some(
          (puzzle) =>
            (puzzle.language ?? "JavaScript") === language &&
            puzzle.level === level,
        ),
        `Missing ${language} level ${level} puzzles`,
      );
    }
  }
});

test("the voting-age puzzle prints the function result", () => {
  const puzzle = puzzles.find((entry) => entry.id === "include-boundary");
  assert.ok(puzzle);
  assert.ok(puzzle.code.includes("console.log(canVote(age));"));
});
