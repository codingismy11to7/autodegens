import { Duration, Option, Schema } from "effect";
import { DurationInput } from "effect/Duration";

export const DurationInputSchema = Schema.declare(
  (input: unknown): input is DurationInput => Duration.decodeUnknown(input).pipe(Option.isSome),
  {
    identifier: "DurationInputSchema",
    description: "Schema to decode the DurationInput strings from Effect",
  },
);
