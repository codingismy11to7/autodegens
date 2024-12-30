import { Duration, LogLevel, Option, Schema } from "effect";
import { DurationInput } from "effect/Duration";
import { isString } from "effect/String";

export const DurationInputSchema = Schema.declare(
  (input: unknown): input is DurationInput => Duration.decodeUnknown(input).pipe(Option.isSome),
  {
    identifier: "DurationInputSchema",
    description: "Schema to decode the DurationInput strings from Effect",
  },
);

export const LogLevelLiteralSchema = Schema.declare(
  (input: unknown): input is LogLevel.Literal => isString(input) && LogLevel.allLevels.some(ll => ll._tag === input),
  {
    identifier: "LogLevelLiteralSchema",
    description: "_tag value of a LogLevel",
  },
);
