import { createEmitter } from "@puejs/core";
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PueProvider, usePue } from "../src";
import { fakes, liveFakes } from "./fake-core";

vi.mock("@puejs/core", async () => {
  const { createFakeEmitter } = await import("./fake-core");
  return { createEmitter: vi.fn(createFakeEmitter) };
});

beforeEach(() => {
  fakes.length = 0;
  vi.mocked(createEmitter).mockClear();
});

describe("PueProvider", () => {
  it("merges defaults under the hook's options", () => {
    renderHook(() => usePue({ volume: 0.9 }), {
      wrapper: ({ children }) => <PueProvider defaults={{ preset: "deep", volume: 0.3 }}>{children}</PueProvider>,
    });
    expect(liveFakes()[0].options).toEqual({ preset: "deep", volume: 0.9 });
  });

  it("shares its audio context", () => {
    const context = {} as AudioContext;
    renderHook(() => usePue(), {
      wrapper: ({ children }) => <PueProvider audioContext={context}>{children}</PueProvider>,
    });
    expect(liveFakes()[0].options).toEqual({ audioContext: context });
  });
});
