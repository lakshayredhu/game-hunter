import { useState } from "react";
import { GameButton, GameShell, GameTopbar } from "@freegamestore/games";
import { puzzles } from "./puzzles";

function pickPuzzle(exceptIndex?: number): number {
  if (puzzles.length < 2 || exceptIndex === undefined) {
    return Math.floor(Math.random() * puzzles.length);
  }

  const choices = puzzles
    .map((_, index) => index)
    .filter((index) => index !== exceptIndex);
  return choices[Math.floor(Math.random() * choices.length)];
}

function App() {
  const [puzzleIndex, setPuzzleIndex] = useState(() => pickPuzzle());
  const [puzzleNumber, setPuzzleNumber] = useState(1);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [wrongLines, setWrongLines] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const puzzle = puzzles[puzzleIndex];

  const chooseLine = (lineIndex: number) => {
    if (solved || gameOver || wrongLines.includes(lineIndex)) return;

    if (lineIndex === puzzle.bugLine) {
      setSolved(true);
      setScore((current) => current + 1);
      setStreak((current) => current + 1);
      return;
    }

    const remainingLives = lives - 1;
    setLives(remainingLives);
    setMistakes((current) => current + 1);
    setStreak(0);
    setWrongLines((current) => [...current, lineIndex]);
    if (remainingLives === 0) setGameOver(true);
  };

  const nextPuzzle = () => {
    setPuzzleIndex((current) => pickPuzzle(current));
    setPuzzleNumber((current) => current + 1);
    setWrongLines([]);
    setMistakes(0);
    setSolved(false);
  };

  const restartGame = () => {
    setPuzzleIndex((current) => pickPuzzle(current));
    setPuzzleNumber(1);
    setLives(3);
    setScore(0);
    setStreak(0);
    setMistakes(0);
    setWrongLines([]);
    setSolved(false);
    setGameOver(false);
  };

  return (
    <GameShell
      topbar={
        <GameTopbar
          title="Bug Hunter"
          stats={[
            { label: "Score", value: score, accent: true },
            { label: "Lives", value: lives },
            { label: "Streak", value: streak },
          ]}
        />
      }
    >
      <main className="flex h-full min-h-0 flex-col items-center justify-center gap-3 p-3 sm:gap-4 sm:p-5 [@media(max-height:400px)]:gap-1 [@media(max-height:400px)]:p-1">
        <div className="w-full max-w-3xl">
          <p className="mb-2 text-center text-sm font-semibold text-muted [@media(max-height:400px)]:mb-1">
            Puzzle {puzzleNumber} <span aria-hidden="true">·</span> Level{" "}
            {puzzle.level}
          </p>
          <section
            aria-labelledby="puzzle-title"
            className="overflow-hidden rounded-2xl border border-line bg-paper"
          >
            <h1
              id="puzzle-title"
              className="border-b border-line px-4 py-3 text-center text-base font-semibold text-ink [@media(max-height:400px)]:py-1"
            >
              Find the bug in this code
            </h1>
            <div className="p-2 sm:p-4 [@media(max-height:400px)]:p-1">
              <ol
                aria-label="JavaScript code"
                className="m-0 list-none p-0 [@media(max-height:400px)]:grid [@media(max-height:400px)]:grid-cols-2 [@media(max-height:400px)]:gap-1"
              >
                {puzzle.code.map((line, index) => (
                  <li key={`${puzzle.id}-${index}`}>
                    <button
                      type="button"
                      disabled={
                        solved ||
                        gameOver ||
                        wrongLines.includes(index)
                      }
                      onClick={() => chooseLine(index)}
                      aria-label={`Code line ${index + 1}: ${line}${
                        solved && index === puzzle.bugLine
                          ? ", correct, bug found"
                          : wrongLines.includes(index)
                            ? ", incorrect guess"
                            : ""
                      }`}
                      className={`flex min-h-11 w-full items-center gap-3 rounded-lg border border-transparent px-2 text-left font-mono text-sm text-ink transition-colors sm:px-3 [@media(max-height:400px)]:gap-1 [@media(max-height:400px)]:text-xs ${
                        solved && index === puzzle.bugLine
                          ? "border-success bg-success/10 text-success"
                          : wrongLines.includes(index)
                            ? "border-danger bg-danger/10 text-danger"
                            : "enabled:hover:border-accent enabled:hover:bg-accent/5"
                      } disabled:cursor-default`}
                    >
                      <span
                        aria-hidden="true"
                        className="w-5 shrink-0 text-right text-muted"
                      >
                        {solved && index === puzzle.bugLine
                          ? "✓"
                          : wrongLines.includes(index)
                            ? "✕"
                            : index + 1}
                      </span>
                      <span className="min-w-0 whitespace-pre-wrap break-words">
                        {line}
                      </span>
                      {solved && index === puzzle.bugLine ? (
                        <span className="ml-auto shrink-0 font-sans text-xs font-semibold">
                          Bug found
                        </span>
                      ) : wrongLines.includes(index) ? (
                        <span className="ml-auto shrink-0 font-sans text-xs font-semibold">
                          Not this line
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          </section>
          {solved ? (
            <section
              aria-live="polite"
              className="mt-3 rounded-2xl border border-success bg-success/10 p-3 text-sm [@media(max-height:400px)]:mt-1 [@media(max-height:400px)]:p-2"
            >
              <p className="m-0 font-semibold text-success">
                ✓ Correct! You found the bug.
              </p>
              <p className="mb-0 mt-1 text-ink">{puzzle.explanation}</p>
              <p className="mb-0 mt-2 font-semibold text-ink">
                Fixed line:
              </p>
              <code className="mt-1 block overflow-x-auto rounded-lg bg-paper px-2 py-2 font-mono text-xs text-ink">
                {puzzle.fix}
              </code>
              <p className="mb-0 mt-2 text-muted">
                Mistakes on this puzzle: {mistakes}
              </p>
              <div className="mt-3">
                <GameButton onClick={nextPuzzle} block>
                  Next puzzle
                </GameButton>
              </div>
            </section>
          ) : gameOver ? (
            <section
              aria-live="assertive"
              className="mt-3 rounded-2xl border border-danger bg-danger/10 p-3 text-center [@media(max-height:400px)]:mt-1 [@media(max-height:400px)]:p-2"
            >
              <p className="m-0 font-semibold text-danger">
                ✕ Game over — no lives left.
              </p>
              <p className="mb-3 mt-1 text-sm text-ink">
                The bug was on line {puzzle.bugLine + 1}. Your score: {score}.
              </p>
              <GameButton onClick={restartGame} block>
                Play again
              </GameButton>
            </section>
          ) : (
            <p aria-live="polite" className="mb-0 mt-3 text-center text-sm text-muted [@media(max-height:400px)]:mt-1">
              Tap the buggy line. Wrong guesses cost one life.
              {wrongLines.length > 0
                ? ` ${wrongLines.length} line${wrongLines.length === 1 ? "" : "s"} ruled out.`
                : ""}
            </p>
          )}
        </div>
      </main>
    </GameShell>
  );
}

export default App;
