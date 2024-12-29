import { Effect, Layer, pipe, Schedule } from "effect";
import { UI } from "./index.ts";

const doRetry = <A, E>(e: Effect.Effect<A, E>) =>
  e.pipe(Effect.retry(pipe(Schedule.intersect(Schedule.spaced("10 millis"), Schedule.recurs(10)))));

const selectOne = <E extends Element>(selector: string, from: Element | Document = document) =>
  pipe(
    Effect.sync(() => from.querySelector(selector)),
    Effect.andThen(Effect.fromNullable),
    Effect.map(e => e as E),
  );

const closeMessageModal = (withTitle: string) =>
  pipe(
    selectOne<HTMLDivElement>("#messageModal"),
    Effect.filterOrFail(d => d.style.display === "block"),
    Effect.tap(d =>
      pipe(
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

const skipGameModal = pipe(
  selectOne<HTMLDivElement>("#miniGameStartModal"),
  Effect.filterOrFail(d => d.style.display === "block"),
  Effect.andThen(m => selectOne<HTMLButtonElement>("button.skip-button", m)),
  Effect.andThen(b => b.click()),
  doRetry,
);

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
  Effect.andThen(closeMessageModal("Luck Game").pipe(Effect.ignore)),
  Effect.andThen(clickFirstLuckGameBox),
  Effect.andThen(closeMessageModal("Luck Game Result")),
  Effect.ignore,
);

const skipGame = (id: string, desc: string) => {
  const selectEnabledGameButton = pipe(selectOne<HTMLButtonElement>(`#${id}`), Effect.filterOrFail(isAffordable));

  return pipe(
    selectEnabledGameButton,
    Effect.andThen(b => b.click()),
    Effect.andThen(skipGameModal),
    Effect.andThen(Effect.log(`skip ${desc}!`)),
    Effect.andThen(closeMessageModal(`Skipped ${desc} Result`)),
    Effect.ignore,
  );
};

const skipSpeedGame = skipGame("speedGame", "Speed Game");
const skipMathGame = skipGame("mathGame", "Math Game");
const skipMemoryGame = skipGame("memoryGame", "Memory Game");

export const UILive = Layer.succeed(
  UI,
  UI.of({
    playLuckGame,
    skipSpeedGame,
    skipMathGame,
    skipMemoryGame,
  }),
);
