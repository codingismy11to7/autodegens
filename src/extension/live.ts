import { Effect, Fiber, HashMap, Layer, Logger, Option, pipe, Ref, Schedule, SynchronizedRef } from "effect";
import { nanoid } from "nanoid";
import { runFork } from "../bootstrap.ts";
import { Config, DefaultConfig, parseConfig, SomeConfigs } from "../config";
import { UI, UIType } from "../ui";
import { BooleanListener, ConfigListener, Extension, Listener } from "./index.ts";

const startRunning =
  (ui: UIType) =>
  (config: Config): Fiber.Fiber<void> => {
    const closeDialogs = !config.closeLoserDialogs
      ? Effect.void
      : pipe(Effect.logDebug("closing loser dialog"), Effect.andThen(ui.closeLoserDialogs));

    const playGames = Effect.if(
      pipe(
        ui.anyOverlaysOpen,
        Effect.andThen(open => open || !config.playGames),
      ),
      {
        onTrue: () => Effect.void,
        onFalse: () =>
          pipe(
            Effect.logDebug("playing games"),
            Effect.andThen(ui.playLuckGame),
            Effect.andThen(ui.skipSpeedGame),
            Effect.andThen(ui.skipMemoryGame),
            Effect.andThen(ui.playMathGame),
          ),
      },
    );

    const loop = pipe(
      Effect.logDebug("running loop"),
      Effect.andThen(closeDialogs),
      Effect.andThen(playGames),
      Effect.andThen(Effect.logDebug("done running loop")),
      Effect.withLogSpan("poll loop"),
    );

    return pipe(
      loop,
      Effect.schedule(Schedule.spaced(config.pollRate)),
      Effect.asVoid,
      Logger.withMinimumLogLevel(Config.logLevel(config)),
      runFork,
    );
  };

const localStorageKey = "___autodegens";
const loadConfig = (): Config =>
  pipe(
    localStorage.getItem(localStorageKey),
    Option.fromNullable,
    Option.andThen(Option.liftThrowable(JSON.parse)),
    Option.andThen(parseConfig),
    Option.andThen(fillInDefaults),
    Option.getOrElse(DefaultConfig),
  );
const storeConfig = (c: Config) => Effect.sync(() => localStorage.setItem(localStorageKey, JSON.stringify(c)));

const fillInDefaults = (c: SomeConfigs): Config => ({ ...DefaultConfig(), ...c });

const callListenersWith = <T>(ref: Ref.Ref<HashMap.HashMap<string, Listener<T>>>, value: T, desc: string) =>
  pipe(
    ref.get,
    Effect.andThen(HashMap.values),
    Effect.andThen(
      Effect.forEach(
        list =>
          pipe(
            Effect.try(() => list(value)),
            Effect.catchAllCause(c => Effect.logError(`Error handling ${desc} listener change`, c)),
          ),
        { discard: true },
      ),
    ),
  );

export const ExtensionLive = Layer.effect(
  Extension,
  Effect.Do.pipe(
    Effect.bind("ui", () => UI),
    Effect.bind("running", () => SynchronizedRef.make(Option.none<Fiber.Fiber<void>>())),
    Effect.bind("config", () => SynchronizedRef.make(loadConfig())),
    Effect.bind("configListeners", () => Ref.make(HashMap.empty<string, ConfigListener>())),
    Effect.bind("enabledListeners", () => Ref.make(HashMap.empty<string, BooleanListener>())),
    Effect.andThen(({ ui, running, config, configListeners, enabledListeners }) => {
      const notifyEnabled = (enabled: boolean) => callListenersWith(enabledListeners, enabled, "enabled");
      const disable = pipe(
        SynchronizedRef.getAndSet(running, Option.none()),
        Effect.flatten,
        Effect.tap(Effect.logInfo("stopping extension")),
        Effect.tap(Fiber.interrupt),
        Effect.andThen(notifyEnabled(false)),
        Effect.catchTag("NoSuchElementException", () => Effect.void),
      );

      const enable = SynchronizedRef.updateEffect(
        running,
        Option.match({
          onSome: r => Effect.succeed(Option.some(r)),
          onNone: () =>
            pipe(
              Effect.logInfo("starting extension"),
              Effect.andThen(config.get),
              Effect.map(startRunning(ui)),
              Effect.asSome,
              Effect.tap(notifyEnabled(true)),
            ),
        }),
      );
      const restartIfRunning = pipe(
        running,
        Effect.andThen(Option.isSome),
        Effect.andThen(running =>
          !running
            ? Effect.void
            : pipe(Effect.logInfo("restarting due to config change"), Effect.andThen(disable), Effect.andThen(enable)),
        ),
      );

      const addListener =
        <T>(lists: Ref.Ref<HashMap.HashMap<string, Listener<T>>>) =>
        (list: Listener<T>) =>
          Effect.Do.pipe(
            Effect.let("id", () => nanoid()),
            Effect.let("cancel", ({ id }) => lists.pipe(Ref.update(HashMap.remove(id)))),
            Effect.andThen(({ id, cancel }) => lists.pipe(Ref.update(HashMap.set(id, list)), Effect.as({ cancel }))),
          );

      const addEnabledListener = addListener(enabledListeners);

      const addConfigListener = addListener(configListeners);

      const storeAndNotify = (c: Config) =>
        pipe(storeConfig(c), Effect.andThen(callListenersWith(configListeners, c, "settings")), Effect.andThen(c));

      const patchConfig = (patch: (c: Config) => SomeConfigs) =>
        pipe(
          config,
          SynchronizedRef.getAndUpdateEffect(c => storeAndNotify({ ...c, ...patch(c) })),
          Effect.andThen(restartIfRunning),
        );

      const updateConfig = (c: SomeConfigs) =>
        pipe(
          config,
          SynchronizedRef.updateEffect(conf => storeAndNotify({ ...conf, ...c })),
          Effect.andThen(restartIfRunning),
        );

      return {
        enabled: pipe(running, Ref.get, Effect.andThen(Option.isSome)),
        setEnabled: (enabled: boolean) => (enabled ? enable : disable),
        config: config.get,
        addEnabledListener,
        addConfigListener,
        patchConfig,
        updateConfig,
        buyFirstUpgradeOrCloseBattle: pipe(config.get, Effect.andThen(ui.buyFirstUpgradeOrCloseBattle)),
        toggleWarpTime: ui.toggleWarpTime,
      };
    }),
    Effect.tap(e =>
      pipe(
        e.config,
        Effect.andThen(c => c.autoStart),
        Effect.if({ onTrue: () => e.setEnabled(true), onFalse: () => Effect.void }),
        Effect.andThen(Effect.logInfo("AutoDegens loaded")),
      ),
    ),
  ),
);
