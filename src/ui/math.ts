import { Chunk, Effect, Order, pipe, Stream } from "effect";
import * as $C from "js-combinatorics";

const findMaxSelections = <T extends Readonly<{ value: number }>>(nums: Iterable<T>, target: number) =>
  pipe(
    Chunk.fromIterable<T>(nums),
    Chunk.sort(Order.make<T>((a, b) => (a.value < b.value ? -1 : 1))),
    Chunk.reduce({ total: 0, toTake: 0 }, (acc, num, idx) =>
      acc.total + num.value > target ? acc : { total: acc.total + num.value, toTake: 1 + idx },
    ),
    ({ toTake }) => toTake,
  );

const combinations =
  <T extends Readonly<{ value: number }>>(of: Iterable<T>) =>
  (ofSize: number) =>
    Stream.fromIterable($C.Combination.of(of, ofSize) as Iterable<readonly T[]>);

const sum = <T extends Readonly<{ value: number }>>(nums: readonly T[]) => nums.reduce((acc, i) => acc + i.value, 0);

export const findLargest = <T extends Readonly<{ value: number }>>(from: Iterable<T>, addUpTo: number) =>
  pipe(
    findMaxSelections(from, addUpTo),
    largest => Stream.fromChunk(pipe(Chunk.range(2, largest), Chunk.reverse)),
    Stream.flatMap(combinations(from)),
    Stream.filter(nums => sum(nums) === addUpTo),
    Stream.runHead,
    Effect.flatten,
  );
