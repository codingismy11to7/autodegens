import { Chunk, Effect, Layer, pipe, Schedule } from "effect";
import { UI } from "./index.ts";
import { findLargest } from "./math.ts";

const doRetry = <A, E>(e: Effect.Effect<A, E>) =>
  e.pipe(Effect.retry(pipe(Schedule.intersect(Schedule.spaced("10 millis"), Schedule.recurs(10)))));

const selectOne = <E extends Element>(selector: string, from: Element | Document = document) =>
  pipe(
    Effect.sync(() => from.querySelector(selector)),
    Effect.andThen(Effect.fromNullable),
    Effect.map(e => e as E),
  );

const closeMessageModal = (withTitle?: string) =>
  pipe(
    selectOne<HTMLDivElement>("#messageModal"),
    Effect.filterOrFail(d => d.style.display === "block"),
    Effect.tap(d =>
      !withTitle
        ? Effect.void
        : pipe(
            Effect.sync(() => d.querySelector("h2")),
            Effect.andThen(Effect.fromNullable),
            Effect.andThen(d => d.innerText),
            Effect.filterOrFail(t => t === withTitle),
          ),
    ),
    Effect.andThen(d => selectOne<HTMLButtonElement>("button", d)),
    Effect.andThen(b => b.click()),
    doRetry,
  );

const playOrSkipGameModal = (type: "play" | "skip") =>
  pipe(
    selectOne<HTMLDivElement>("#miniGameStartModal"),
    Effect.filterOrFail(d => d.style.display === "block"),
    Effect.andThen(m => selectOne<HTMLButtonElement>(`button.${type}-button`, m)),
    Effect.andThen(b => b.click()),
    doRetry,
  );

const skipGameModal = playOrSkipGameModal("skip");

const isAffordable = (e: Element) => Array.from(e.classList).some(className => className.startsWith("affordable"));

const selectAffordable = <T extends Element>(selector: string) =>
  pipe(selectOne<T>(selector), Effect.filterOrFail(isAffordable));

const selectEnabledLuckButton = selectAffordable<HTMLButtonElement>("#luckGame");
const luckGameBox = selectOne<HTMLDivElement>('body > div[style*="position: fixed"]');
const clickFirstLuckGameBox = pipe(
  luckGameBox,
  Effect.andThen(gb => selectOne<HTMLDivElement>("div", gb)),
  Effect.tap(Effect.log("play luck game!")),
  Effect.andThen(first => first.click()),
  doRetry,
  // wait until the luck game box is removed from the screen, only if we successfully clicked
  Effect.andThen(pipe(luckGameBox, Effect.flip, Effect.retry(Schedule.spaced("50 millis")))),
);

const playLuckGame = pipe(
  selectEnabledLuckButton,
  Effect.andThen(b => b.click()),
  Effect.andThen(closeMessageModal().pipe(Effect.ignore)),
  Effect.andThen(clickFirstLuckGameBox),
  Effect.andThen(Effect.log("played luck game")),
  Effect.andThen(closeMessageModal()),
  Effect.ignore,
);

const selectEnabledGameButton = (id: string) => selectAffordable<HTMLButtonElement>(`#${id}`);

const skipGame = (id: string, desc: string) =>
  pipe(
    selectEnabledGameButton(id),
    Effect.tap(Effect.log(`skip ${desc}!`)),
    Effect.andThen(b => b.click()),
    Effect.andThen(skipGameModal),
    Effect.andThen(Effect.log(`${desc} skipped`)),
    Effect.andThen(closeMessageModal()),
    Effect.ignore,
  );

const skipSpeedGame = skipGame("speedGame", "Speed Game");
const skipMemoryGame = skipGame("memoryGame", "Memory Game");

type MathOption = Readonly<{ value: number; div: HTMLDivElement }>;
type MathItems = Readonly<{
  target: number;
  options: Chunk.Chunk<MathOption>;
}>;
const emptyMathItems = (): MathItems => ({ target: 0, options: Chunk.empty() });
const playMathGame = pipe(
  selectEnabledGameButton("mathGame"),
  Effect.andThen(b => b.click()),
  Effect.andThen(playOrSkipGameModal("play")),
  Effect.andThen(selectOne<HTMLDivElement>("#mathGameArea").pipe(doRetry)),
  Effect.tap(Effect.log("play math game!")),
  Effect.andThen(d => [...d.querySelectorAll("div")]),
  Effect.andThen(items =>
    items.reduce(
      (acc, div) =>
        div.style.position !== "absolute"
          ? acc
          : pipe(div.innerText, text =>
              text.startsWith("Target:")
                ? { ...acc, target: parseInt(text.replace("Target: ", ""), 10) }
                : text.startsWith("Current:")
                  ? acc
                  : { ...acc, options: Chunk.append(acc.options, { value: parseInt(text, 10), div }) },
            ),
      emptyMathItems(),
    ),
  ),
  Effect.tap(({ options, target }) =>
    Effect.logInfo(
      "target value is",
      target,
      "options are",
      pipe(
        options,
        Chunk.map(o => o.value),
        Chunk.toArray,
      ),
    ),
  ),
  Effect.andThen(({ options, target }) => findLargest(options, target)),
  Effect.tap(answer =>
    Effect.logInfo(
      `found answer with most selections (${answer.length})`,
      answer.map(a => a.value),
    ),
  ),
  Effect.andThen(
    Effect.forEach(
      ({ div }) =>
        pipe(
          Effect.sync(() => div.click()),
          Effect.andThen(Effect.sleep("100 millis")),
        ),
      { discard: true },
    ),
  ),
  Effect.andThen(Effect.log("played math game")),
  Effect.andThen(closeMessageModal().pipe(doRetry)),
  Effect.ignore,
);

const anyOverlaysOpen = pipe(
  Effect.sync(() => [...document.querySelectorAll<HTMLDivElement>("body > div")]),
  Effect.andThen(topLevels =>
    topLevels.some(
      e =>
        e.id !== "statusOverlay" &&
        (e.id.endsWith("Overlay") || e.classList.contains("modal")) &&
        e.style.display &&
        e.style.display !== "none",
    ),
  ),
);

const buyFirstUpgrade = pipe(
  Effect.sync(() =>
    Chunk.fromIterable(document.querySelectorAll<HTMLButtonElement>("div#upgradeList > div.upgrade > button")),
  ),
  Effect.andThen(Chunk.filter(isAffordable)),
  Effect.andThen(Chunk.head),
  Effect.andThen(b => b.click()),
  Effect.andThen(Effect.log("bought first upgrade")),
  Effect.catchTag("NoSuchElementException", () => Effect.log("no upgrade to buy")),
);

const toggleWarpTime = pipe(
  selectAffordable<HTMLButtonElement>("#warpTimeButton"),
  Effect.andThen(b => b.click()),
  Effect.andThen(Effect.log("clicked warp time button")),
  Effect.catchTag("NoSuchElementException", () => Effect.log("time warp isn't ready?")),
);

const closeLoserDialogs = pipe(
  closeMessageModal("You Lost"),
  Effect.andThen(Effect.log("closed loser dialog")),
  Effect.ignore,
);

export const UILive = Layer.succeed(
  UI,
  UI.of({
    playLuckGame,
    skipSpeedGame,
    playMathGame,
    skipMemoryGame,
    anyOverlaysOpen,
    buyFirstUpgrade,
    toggleWarpTime,
    closeLoserDialogs,
  }),
);
