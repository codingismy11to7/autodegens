import { Chunk, Option, Order, pipe } from "effect";
import * as $C from "js-combinatorics";

const findMaxSelections = (nums: Iterable<number>, target: number) =>
  pipe(
    nums,
    Chunk.fromIterable,
    Chunk.sort(Order.number),
    Chunk.reduce({ total: 0, toTake: 0 }, (acc, num, idx) =>
      acc.total + num > target ? acc : { total: acc.total + num, toTake: 1 + idx },
    ),
    ({ toTake }) => toTake,
  );

const combinations = (of: Iterable<number>, ofSize: number): ReadonlyArray<readonly number[]> => [
  ...$C.Combination.of(of, ofSize),
];

const sum = (nums: readonly number[]) => nums.reduce((acc, i) => acc + i, 0);

export const findLargest = (from: Iterable<number>, addUpTo: number) =>
  pipe(
    findMaxSelections(from, addUpTo),
    largest => pipe(Chunk.range(2, largest), Chunk.reverse),
    sizes => {
      const loop = (rem = sizes, acc = Option.none<readonly number[]>()): Option.Option<readonly number[]> => {
        if (Option.isSome(acc)) return acc;
        else {
          const size = Chunk.headNonEmpty(rem);
          const rest = Chunk.tailNonEmpty(rem);
          const combs = combinations(from, size);
          const found = Option.fromNullable(combs.find(nums => sum(nums) === addUpTo));
          if (Chunk.isNonEmpty(rest)) return loop(rest, found);
          else return found;
        }
      };
      return loop();
    },
  );
