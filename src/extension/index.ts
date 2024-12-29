import { Context, Effect } from "effect";
import { createContext } from "react";
import { ConfigType, SomeConfigs } from "../config";
import { Cancellable } from "../util/misc.ts";

export type Listener<T> = (value: T) => void;
export type ConfigListener = Listener<ConfigType>;
export type BooleanListener = Listener<boolean>;

export class Extension extends Context.Tag("Extension")<
  Extension,
  Readonly<{
    enabled: Effect.Effect<boolean>;
    setEnabled: (enabled: boolean) => Effect.Effect<void>;
    addEnabledListener: (listener: BooleanListener) => Effect.Effect<Cancellable>;
    config: Effect.Effect<ConfigType>;
    addConfigListener: (listener: ConfigListener) => Effect.Effect<Cancellable>;
    patchConfig: (patch: (c: ConfigType) => SomeConfigs) => Effect.Effect<void>;
    updateConfig: (c: SomeConfigs) => Effect.Effect<void>;
    buyFirstUpgrade: Effect.Effect<void>;
  }>
>() {}

export type ExtensionType = Context.Tag.Service<Extension>;

export const ExtensionContext = createContext<ExtensionType>(null!);
