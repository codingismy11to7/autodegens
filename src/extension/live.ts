import { Effect, Fiber, Layer, Option, pipe, Ref, Schedule, SynchronizedRef } from "effect";
import { UI, UIType } from "../ui";
import { Extension } from "./index.ts";

const startRunning = (ui: UIType) => {
  const loop = pipe(
    Effect.logTrace("running loop"),
    Effect.andThen(ui.playLuckGame),
    Effect.andThen(ui.skipSpeedGame),
    Effect.andThen(ui.skipMemoryGame),
    Effect.andThen(ui.playMathGame),
  );

  return pipe(loop, Effect.schedule(Schedule.spaced("25 millis")), Effect.asVoid, Effect.forkDaemon);
};

export const ExtensionLive = Layer.effect(
  Extension,
  Effect.Do.pipe(
    Effect.bind("ui", () => UI),
    Effect.bind("running", () => SynchronizedRef.make(Option.none<Fiber.Fiber<void>>())),
    Effect.andThen(({ ui, running }) => {
      const disable = pipe(
        SynchronizedRef.getAndSet(running, Option.none()),
        Effect.flatten,
        Effect.tap(Fiber.interrupt),
        Effect.catchTag("NoSuchElementException", () => Effect.void),
      );

      const enable = SynchronizedRef.updateEffect(
        running,
        Option.match({
          onSome: r => Effect.succeed(Option.some(r)),
          onNone: () => pipe(startRunning(ui), Effect.asSome),
        }),
      );

      return {
        enabled: pipe(running, Ref.get, Effect.andThen(Option.isSome)),
        setEnabled: (enabled: boolean) => (enabled ? enable : disable),
      };
    }),
  ),
);
