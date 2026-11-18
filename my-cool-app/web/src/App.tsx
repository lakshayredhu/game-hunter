import { useEffect, useState } from "react";
import { GameButton, GameShell, GameTopbar } from "@freegamestore/games";
import { puzzles } from "./puzzles";
import type { Language, Puzzle } from "./types";

type DifficultyFilter = "all" | Puzzle["level"];
type Theme = "light" | "dark";

const keywordPattern =
  /\b(?:const|let|var|function|return|if|else|for|while|async|await|new|true|false|null|undefined|typeof|of|in|import|from|class|def|print|and|or|not|None|range|len|sum)\b/;
const tokenPattern =
  /(\/\/.*|#.*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:const|let|var|function|return|if|else|for|while|async|await|new|true|false|null|undefined|typeof|of|in|import|from|class|def|print|and|or|not|None|range|len|sum)\b|\b\d+(?:\.\d+)?\b|===|!==|=>|==|!=|<=|>=|&&|\|\||[=+\-*\/<>!])/g;

function highlightLine(line: string) {
  return line.split(tokenPattern).map((token, index) => {
    if (!token) return null;
    let tokenClass = "";
    if (token.startsWith("//") || token.startsWith("#")) {
      tokenClass = "syntax-comment";
    } else if (/^["'`]/.test(token)) {
      tokenClass = "syntax-string";
    } else if (/^\d/.test(token)) {
      tokenClass = "syntax-number";
    } else if (keywordPattern.test(token)) {
      tokenClass = "syntax-keyword";
    } else if (/^(===|!==|=>|==|!=|<=|>=|&&|\|\||[=+\-*\/<>!])$/.test(token)) {
      tokenClass = "syntax-operator";
    }

    return tokenClass ? (
      <span className={tokenClass} key={index}>{token}</span>
    ) : (
      token
    );
  });
}

function pickPuzzle(
  language: Language,
  difficulty: DifficultyFilter,
  exceptIndex?: number,
): number {
  const choices = puzzles
    .map((puzzle, index) => ({ puzzle, index }))
    .filter(
      ({ puzzle, index }) =>
        (puzzle.language ?? "JavaScript") === language &&
        (difficulty === "all" || puzzle.level === difficulty) &&
        index !== exceptIndex,
    )
    .map(({ index }) => index);
  const available = choices.length > 0
    ? choices
    : puzzles
        .map((puzzle, index) => ({ puzzle, index }))
        .filter(
          ({ puzzle }) =>
            (puzzle.language ?? "JavaScript") === language &&
            (difficulty === "all" || puzzle.level === difficulty),
        )
        .map(({ index }) => index);
  return available[Math.floor(Math.random() * available.length)];
}

function App() {
  const [language, setLanguage] = useState<Language>("JavaScript");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
  const [puzzleIndex, setPuzzleIndex] = useState(() =>
    pickPuzzle("JavaScript", "all"),
  );
  const [puzzleNumber, setPuzzleNumber] = useState(1);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [wrongLines, setWrongLines] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [theme, setTheme] = useState<Theme>(() =>
    localStorage.getItem("bug-hunter-theme") === "dark" ? "dark" : "light",
  );
  const puzzle = puzzles[puzzleIndex];

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("bug-hunter-theme", theme);
  }, [theme]);

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

  const resetGame = (
    nextLanguage: Language = language,
    nextDifficulty: DifficultyFilter = difficulty,
  ) => {
    setLanguage(nextLanguage);
    setDifficulty(nextDifficulty);
    setPuzzleIndex(pickPuzzle(nextLanguage, nextDifficulty));
    setPuzzleNumber(1);
    setLives(3);
    setScore(0);
    setStreak(0);
    setMistakes(0);
    setWrongLines([]);
    setSolved(false);
    setGameOver(false);
  };

  const nextPuzzle = () => {
    setPuzzleIndex((current) =>
      pickPuzzle(language, difficulty, current),
    );
    setPuzzleNumber((current) => current + 1);
    setWrongLines([]);
    setMistakes(0);
    setSolved(false);
  };

  const progress = Math.min((score / 10) * 100, 100);

  return (
    <GameShell
      topbar={
        <GameTopbar
          title="Bug Hunter"
          stats={[
            { label: "Score", value: score, accent: true },
            { label: "Lives", value: `${lives} / 3` },
            { label: "Streak", value: streak },
          ]}
        />
      }
    >
      <main className="flex h-full min-h-0 flex-col items-center justify-start gap-3 overflow-y-auto p-3 sm:gap-4 sm:p-5 [@media(max-height:400px)]:gap-1 [@media(max-height:400px)]:p-1">
        <div className="w-full max-w-3xl">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-sm font-medium text-ink">
                Language
                <select
                  aria-label="Programming language"
                  className="rounded-lg border border-line bg-paper px-2 py-1.5 text-ink"
                  value={language}
                  onChange={(event) =>
                    resetGame(event.target.value as Language, difficulty)
                  }
                >
                  <option value="JavaScript">JavaScript</option>
                  <option value="Python">Python</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-ink">
                Difficulty
                <select
                  aria-label="Difficulty"
                  className="rounded-lg border border-line bg-paper px-2 py-1.5 text-ink"
                  value={difficulty}
                  onChange={(event) =>
                    resetGame(
                      language,
                      event.target.value === "all"
                        ? "all"
                        : (Number(event.target.value) as Puzzle["level"]),
                    )
                  }
                >
                  <option value="all">All levels</option>
                  <option value={1}>Easy</option>
                  <option value={2}>Medium</option>
                  <option value={3}>Hard</option>
                </select>
              </label>
            </div>
            <button
              type="button"
              onClick={() => setTheme((current) => current === "light" ? "dark" : "light")}
              className="rounded-lg border border-line bg-paper px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-panel"
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? "🌙 Dark mode" : "☀️ Light mode"}
            </button>
          </div>

          <section aria-label="Game progress" className="mb-3 rounded-xl border border-line bg-paper p-3">
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-ink">Lives</span>
              <span className="text-muted" aria-label={`${lives} of 3 lives remaining`}>
                {"♥ ".repeat(lives)}
                <span className="text-line-strong">{"♥ ".repeat(3 - lives)}</span>
              </span>
            </div>
            <div className="mb-1 flex items-center justify-between text-xs text-muted">
              <span>Progress to 10 points</span>
              <span>{score} / 10</span>
            </div>
            <div
              role="progressbar"
              aria-label="Progress to 10 points"
              aria-valuemin={0}
              aria-valuemax={10}
              aria-valuenow={Math.min(score, 10)}
              className="h-2 overflow-hidden rounded-full bg-panel"
            >
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </section>

          <p className="mb-2 text-center text-sm font-semibold text-muted [@media(max-height:400px)]:mb-1">
            Puzzle {puzzleNumber} <span aria-hidden="true">·</span>{" "}
            {puzzle.language ?? "JavaScript"} <span aria-hidden="true">·</span> Level{" "}
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
            <div className="border-b border-line bg-panel px-4 py-2">
              <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted">
                Expected output
              </p>
              <pre className="mb-0 mt-1 overflow-x-auto whitespace-pre-wrap font-mono text-sm text-ink">
                {puzzle.expectedOutput}
              </pre>
            </div>
            <div className="p-2 sm:p-4 [@media(max-height:400px)]:p-1">
              <ol
                aria-label={`${puzzle.language ?? "JavaScript"} code`}
                className="m-0 list-none p-0 [@media(max-height:400px)]:grid [@media(max-height:400px)]:grid-cols-2 [@media(max-height:400px)]:gap-1"
              >
                {puzzle.code.map((line, index) => (
                  <li key={`${puzzle.id}-${index}`}>
                    <button
                      type="button"
                      disabled={solved || gameOver || wrongLines.includes(index)}
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
                        {highlightLine(line)}
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

          {solved || wrongLines.length > 0 ? (
            <section
              aria-live="polite"
              className={`mt-3 rounded-2xl border p-3 text-sm [@media(max-height:400px)]:mt-1 [@media(max-height:400px)]:p-2 ${
                solved
                  ? "border-success bg-success/10"
                  : "border-warning bg-warning/10"
              }`}
            >
              <p className={`m-0 font-semibold ${solved ? "text-success" : "text-warning"}`}>
                {solved
                  ? "✓ Correct! You found the bug."
                  : `That line is not the bug. ${lives} ${
                      lives === 1 ? "life" : "lives"
                    } remaining.`}
              </p>
              <p className="mb-0 mt-1 text-ink">{puzzle.explanation}</p>
              <p className="mb-0 mt-2 font-semibold text-ink">
                Corrected line:
              </p>
              <code className="mt-1 block overflow-x-auto whitespace-pre rounded-lg bg-paper px-2 py-2 font-mono text-xs text-ink">
                {highlightLine(puzzle.fix)}
              </code>
              <p className="mb-0 mt-2 text-muted">
                Mistakes on this puzzle: {mistakes}
              </p>
              {solved ? (
                <div className="mt-3">
                  <GameButton onClick={nextPuzzle} block>
                    Next puzzle
                  </GameButton>
                </div>
              ) : null}
            </section>
          ) : null}

          {gameOver ? (
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
              <GameButton onClick={() => resetGame()} block>
                Play again
              </GameButton>
            </section>
          ) : !solved ? (
            <p aria-live="polite" className="mb-0 mt-3 text-center text-sm text-muted [@media(max-height:400px)]:mt-1">
              Tap the buggy line. Wrong guesses cost one life.
              {wrongLines.length > 0
                ? ` ${wrongLines.length} line${wrongLines.length === 1 ? "" : "s"} ruled out.`
                : ""}
            </p>
          ) : null}
        </div>
        <footer className="w-full max-w-3xl pb-2 text-center text-xs text-muted">
          Built for{" "}
          <a
            href="https://freegamestore.online"
            className="underline underline-offset-2"
          >
            FreeGameStore
          </a>
        </footer>
      </main>
    </GameShell>
  );
}

export default App;
