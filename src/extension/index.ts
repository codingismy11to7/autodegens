import { Context, Effect } from "effect";
import { createContext } from "react";

export class Extension extends Context.Tag("Extension")<
  Extension,
  Readonly<{ enabled: Effect.Effect<boolean>; setEnabled: (enabled: boolean) => Effect.Effect<void> }>
>() {}

export type ExtensionType = Context.Tag.Service<Extension>;

export const ExtensionContext = createContext<ExtensionType>(null!);
