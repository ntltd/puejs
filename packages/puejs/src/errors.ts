export type PueErrorCode = "E_DESTROYED" | "E_INVALID_OPTION" | "E_DECODE";

/** Every error thrown or dispatched by Pue JS. */
export class PueError extends Error {
  readonly code: PueErrorCode;

  constructor(code: PueErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "PueError";
    this.code = code;
  }
}

export const destroyedError = (): PueError => new PueError("E_DESTROYED", "This emitter has been destroyed.");
