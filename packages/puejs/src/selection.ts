import type { Odor } from "./odor";
import type { Random } from "./random";

const distanceToRange = (odor: Odor, tonnage: number): number => {
  const [min, max] = odor.tonnage;
  if (tonnage < min) return min - tonnage;
  if (tonnage > max) return tonnage - max;
  return 0;
};

/** Picks an odor eligible for the tonnage; overlapping candidates are drawn from the seeded random source. */
export function selectOdor(odors: readonly Odor[], tonnage: number, random: Random): Odor | undefined {
  if (odors.length === 0) return undefined;
  const eligible = odors.filter((odor) => distanceToRange(odor, tonnage) === 0);
  if (eligible.length > 0) return eligible[Math.floor(random() * eligible.length)];
  return odors.reduce((closest, odor) =>
    distanceToRange(odor, tonnage) < distanceToRange(closest, tonnage) ? odor : closest,
  );
}
