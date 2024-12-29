import { Schema } from "effect";
import { DurationInputSchema } from "./durationInputSchema.ts";

const Config = Schema.Struct({
  autoStart: Schema.Boolean.pipe(Schema.optionalWith({ default: () => true, exact: true, nullable: true })),
  pollRate: DurationInputSchema.pipe(Schema.optionalWith({ default: () => "25 millis", exact: true, nullable: true })),
  buyFirstHotkey: Schema.Boolean.pipe(Schema.optionalWith({ default: () => true, exact: true, nullable: true })),
});

export const parseConfig = Schema.decodeOption(Config);

export type ConfigType = typeof Config.Type;

export type SomeConfigs = Partial<ConfigType>;

export const DefaultConfig = () => Config.make({});
