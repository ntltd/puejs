import type { ThrottleStrategy } from "./types";

export interface ThrottleState {
  readonly lastTime: number;
  readonly lastPosition: number;
}

export interface ThrottleFrame {
  time: number;
  position: number;
  tonnage: number;
  viewportHeight: number;
}

/** Minimum interval of the velocity strategy: 260 ms at tonnage 0, down to 60 ms at tonnage 1. */
const velocityInterval = (tonnage: number): number => 260 - 200 * tonnage;

export function canEmit(strategy: ThrottleStrategy, state: ThrottleState, frame: ThrottleFrame): boolean {
  if (strategy === "distance") return Math.abs(frame.position - state.lastPosition) >= frame.viewportHeight * 0.5;
  const interval = strategy === "velocity" ? velocityInterval(frame.tonnage) : strategy;
  return frame.time - state.lastTime >= interval;
}
