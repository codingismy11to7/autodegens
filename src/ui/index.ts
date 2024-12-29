import { Context, Effect } from "effect";

export class UI extends Context.Tag("UI")<
  UI,
  Readonly<{
    playLuckGame: Effect.Effect<void>;
    skipSpeedGame: Effect.Effect<void>;
    skipMemoryGame: Effect.Effect<void>;
    playMathGame: Effect.Effect<void>;
  }>
>() {}

export type UIType = Context.Tag.Service<UI>;
