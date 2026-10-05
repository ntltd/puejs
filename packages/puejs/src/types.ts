export type TonnageCurveName = "linear" | "logarithmic" | "exponential";

/** Maps a smoothed scroll velocity, in px/s, to a tonnage between 0 and 1. */
export type TonnageCurve = (velocity: number) => number;

export type ThrottleStrategy = "velocity" | "distance" | number;
