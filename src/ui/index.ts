import { Context, Effect } from "effect";
import { Config } from "../config";

export class UI extends Context.Tag("UI")<
  UI,
  Readonly<{
    playLuckGame: Effect.Effect<void>;
    skipSpeedGame: Effect.Effect<void>;
    skipMemoryGame: Effect.Effect<void>;
    playMathGame: Effect.Effect<void>;
    anyOverlaysOpen: Effect.Effect<boolean>;
    buyFirstUpgradeOrCloseBattle: (c: Config) => Effect.Effect<void>;
    toggleWarpTime: Effect.Effect<void>;
    closeLoserDialogs: Effect.Effect<void>;
  }>
>() {}

export type UIType = Context.Tag.Service<UI>;
