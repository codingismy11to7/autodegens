import { format } from "date-fns/fp";
import { Layer, Logger, ManagedRuntime } from "effect";
import { ExtensionLive } from "./extension/live.ts";
import { UILive } from "./ui/live.ts";

const MainLive = ExtensionLive.pipe(
  Layer.provide(UILive),
  Layer.provide(
    Logger.replace(
      Logger.defaultLogger,
      Logger.prettyLogger({ colors: "auto", mode: "browser", formatDate: format("MM/dd/yyyy hh:mm:ss.SSS aa") }),
    ),
  ),
);
const MainLiveRuntime = ManagedRuntime.make(MainLive);
export const runP = MainLiveRuntime.runPromise;
export const runS = MainLiveRuntime.runSync;
export const runFork = MainLiveRuntime.runFork;
