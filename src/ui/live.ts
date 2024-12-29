import { Chunk, Effect, Layer, Option, pipe, Schedule } from "effect";
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

const closeMessageModal = pipe(
  selectOne<HTMLDivElement>("#messageModal"),
  Effect.filterOrFail(d => d.style.display === "block"),
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

const selectEnabledLuckButton = pipe(selectOne<HTMLButtonElement>("#luckGame"), Effect.filterOrFail(isAffordable));
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
  Effect.andThen(closeMessageModal.pipe(Effect.ignore)),
  Effect.andThen(clickFirstLuckGameBox),
  Effect.andThen(closeMessageModal),
  Effect.ignore,
);

const selectEnabledGameButton = (id: string) =>
  pipe(selectOne<HTMLButtonElement>(`#${id}`), Effect.filterOrFail(isAffordable));

const skipGame = (id: string, desc: string) =>
  pipe(
    selectEnabledGameButton(id),
    Effect.andThen(b => b.click()),
    Effect.andThen(skipGameModal),
    Effect.andThen(Effect.log(`skip ${desc}!`)),
    Effect.andThen(closeMessageModal),
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
  Effect.andThen(({ options, target }) =>
    Effect.all({
      options: Effect.succeed(options),
      answer: findLargest(
        Chunk.map(options, o => o.value),
        target,
      ),
    }),
  ),
  Effect.andThen(({ options, answer }) => {
    const loop = (
      currOpts = options,
      remAnswer = answer,
      acc: Chunk.Chunk<HTMLDivElement> = Chunk.empty(),
    ): Chunk.Chunk<HTMLDivElement> => {
      if (!remAnswer.length) {
        return acc;
      } else {
        const thisOne = remAnswer[0];
        const idx = Chunk.findFirstIndex(currOpts, o => o.value === thisOne);
        if (Option.isNone(idx)) return acc;
        else
          return loop(
            Chunk.remove(currOpts, idx.value),
            remAnswer.slice(1),
            Chunk.append(acc, Chunk.unsafeGet(currOpts, idx.value).div),
          );
      }
    };

    return loop();
  }),
  Effect.andThen(
    Effect.forEach(
      d =>
        pipe(
          Effect.sync(() => d.click()),
          Effect.andThen(Effect.sleep("100 millis")),
        ),
      { discard: true },
    ),
  ),
  Effect.andThen(closeMessageModal.pipe(doRetry)),
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

export const UILive = Layer.succeed(
  UI,
  UI.of({
    playLuckGame,
    skipSpeedGame,
    playMathGame,
    skipMemoryGame,
    anyOverlaysOpen,
  }),
);
