import { Effect } from "effect";

export type Cancellable = Readonly<{ cancel: Effect.Effect<void> }>;
