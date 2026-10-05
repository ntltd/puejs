export interface KinematicsState {
  readonly position: number;
  readonly time: number;
  /** Signed, smoothed velocity in px/s. */
  readonly velocity: number;
}

/** Time constant of the low-pass filter applied to velocity, in milliseconds. */
export const SMOOTHING = 50;

export const createKinematics = (position: number, time: number): KinematicsState => ({ position, time, velocity: 0 });

/** Derives the instantaneous velocity and smooths it to absorb trackpad jitter. */
export function updateKinematics(
  state: KinematicsState,
  position: number,
  time: number,
  smoothing: number = SMOOTHING,
): KinematicsState {
  const elapsed = time - state.time;
  if (elapsed <= 0) return state;
  const instant = ((position - state.position) / elapsed) * 1000;
  const alpha = 1 - Math.exp(-elapsed / smoothing);
  return { position, time, velocity: state.velocity + (instant - state.velocity) * alpha };
}
