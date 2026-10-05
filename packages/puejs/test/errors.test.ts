import { describe, expect, it } from "vitest";
import { PueError, destroyedError } from "../src/errors";

describe("PueError", () => {
  it("carries a stable code and name", () => {
    const error = new PueError("E_INVALID_OPTION", "Invalid option.");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("PueError");
    expect(error.code).toBe("E_INVALID_OPTION");
    expect(error.message).toBe("Invalid option.");
  });

  it("keeps the cause", () => {
    const cause = new Error("decode failed");
    expect(new PueError("E_DECODE", "Could not decode.", { cause }).cause).toBe(cause);
  });

  it("builds the destroyed error", () => {
    expect(destroyedError().code).toBe("E_DESTROYED");
  });
});
