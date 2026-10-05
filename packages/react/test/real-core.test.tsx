// Runs against the real @puejs/core (inert in happy-dom, which has no Web Audio): same lifecycle rules.
import { cleanup, render, renderHook, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { usePue } from "../src";

afterEach(cleanup);

function Feed() {
  const { ref, state } = usePue<HTMLDivElement>({ preset: "crisp" });
  return <div data-state={state} data-testid="feed" ref={ref} />;
}

describe("usePue with the real core", () => {
  it("binds a ref without throwing, with and without Strict Mode", () => {
    expect(() => render(<Feed />)).not.toThrow();
    expect(() =>
      render(
        <StrictMode>
          <Feed />
        </StrictMode>,
      ),
    ).not.toThrow();
    expect(screen.getAllByTestId("feed")[0].dataset.state).toBe("idle");
  });

  it("reverts a removed option to the preset value", () => {
    const { result, rerender } = renderHook(({ options }) => usePue(options), {
      initialProps: { options: { volume: 0.5 } as { volume?: number } },
    });
    rerender({ options: {} });
    expect(result.current.emitter?.options.volume).toBe(0.8);
  });
});
