import { LogLevel, Schema } from "effect";
import { DurationInputSchema, LogLevelLiteralSchema } from "./inputSchemas.ts";

const ConfigSchema = Schema.Struct({
  autoStart: Schema.Boolean.pipe(Schema.optionalWith({ default: () => true, exact: true, nullable: true })),
  pollRate: DurationInputSchema.pipe(Schema.optionalWith({ default: () => "25 millis", exact: true, nullable: true })),
  buyFirstHotkey: Schema.Boolean.pipe(Schema.optionalWith({ default: () => true, exact: true, nullable: true })),
  warpTimeHotkey: Schema.Boolean.pipe(Schema.optionalWith({ default: () => true, exact: true, nullable: true })),
  playGames: Schema.Boolean.pipe(Schema.optionalWith({ default: () => true, exact: true, nullable: true })),
  logLevel: LogLevelLiteralSchema.pipe(
    Schema.optionalWith({ default: () => LogLevel.Info._tag, exact: true, nullable: true }),
  ),
  closeLoserDialogs: Schema.Boolean.pipe(Schema.optionalWith({ default: () => true, exact: true, nullable: true })),
});

export const parseConfig = Schema.decodeOption(ConfigSchema);

export type Config = typeof ConfigSchema.Type;

export type SomeConfigs = Partial<Config>;

export const DefaultConfig = () => ConfigSchema.make({});
