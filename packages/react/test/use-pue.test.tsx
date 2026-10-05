import { createEmitter } from "@puejs/core";
import { act, cleanup, render, renderHook, screen } from "@testing-library/react";
import { StrictMode, useEffect, useState } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePue } from "../src";
import { fakes, liveFakes } from "./fake-core";

afterEach(cleanup);

vi.mock("@puejs/core", async () => {
  const { createFakeEmitter } = await import("./fake-core");
  return { createEmitter: vi.fn(createFakeEmitter) };
});

beforeEach(() => {
  fakes.length = 0;
  vi.mocked(createEmitter).mockClear();
});

function Feed({ id = "feed" }: { id?: string }) {
  const { ref } = usePue<HTMLDivElement>({ preset: "crisp" });
  return <div data-testid={id} ref={ref} />;
}

describe("usePue", () => {
  it("observes window when the ref is unused, without starting audio", () => {
    const { result } = renderHook(() => usePue({ volume: 0.5 }));
    expect(liveFakes()).toHaveLength(1);
    const [emitter] = liveFakes();
    expect(emitter.target).toBe(window);
    expect(emitter.options).toEqual({ volume: 0.5 });
    expect(emitter.start).not.toHaveBeenCalled();
    expect(result.current.state).toBe("idle");
    expect(result.current.emitter).toBe(emitter);
  });

  it("binds to the element passed to ref", () => {
    render(<Feed />);
    expect(liveFakes()).toHaveLength(1);
    expect(liveFakes()[0].target).toBe(screen.getByTestId("feed"));
  });

  it("does not update for equal inline options, only for real changes", () => {
    const { rerender } = renderHook(({ volume }) => usePue({ volume, pitch: { min: 0.9, max: 1.1 } }), {
      initialProps: { volume: 0.5 },
    });
    const [emitter] = liveFakes();
    rerender({ volume: 0.5 });
    rerender({ volume: 0.5 });
    expect(emitter.update).not.toHaveBeenCalled();
    rerender({ volume: 0.6 });
    expect(emitter.update).toHaveBeenCalledTimes(1);
    expect(emitter.update).toHaveBeenCalledWith({ volume: 0.6, pitch: { min: 0.9, max: 1.1 } });
    expect(liveFakes()).toHaveLength(1);
  });

  it("follows the emitter state and delegates start, stop and emit", async () => {
    const { result } = renderHook(() => usePue());
    const [emitter] = liveFakes();
    await act(() => result.current.start());
    expect(emitter.start).toHaveBeenCalledTimes(1);
    expect(result.current.state).toBe("running");
    act(() => result.current.emit({ tonnage: 1 }));
    expect(emitter.emit).toHaveBeenCalledWith({ tonnage: 1 });
    act(() => result.current.stop());
    expect(result.current.state).toBe("idle");
  });

  it("starts once with autoStart", async () => {
    renderHook(() => usePue({}, { autoStart: true }));
    await act(async () => {});
    expect(liveFakes()[0].start).toHaveBeenCalledTimes(1);
  });

  it("destroys the emitter when disabled and recreates it when re-enabled", () => {
    const { result, rerender } = renderHook(({ enabled }) => usePue(enabled ? { volume: 0.4 } : false), {
      initialProps: { enabled: true },
    });
    const [first] = liveFakes();
    rerender({ enabled: false });
    expect(first.destroyed).toBe(true);
    expect(result.current.emitter).toBeNull();
    expect(result.current.state).toBe("idle");
    rerender({ enabled: true });
    expect(liveFakes()).toHaveLength(1);
    expect(liveFakes()[0]).not.toBe(first);
  });

  it("recreates the emitter when the ref moves to another element", () => {
    function Switcher() {
      const [second, setSecond] = useState(false);
      const { ref } = usePue<HTMLDivElement>();
      return (
        <>
          <button onClick={() => setSecond(true)} type="button">
            switch
          </button>
          <div data-testid="one" ref={second ? undefined : ref} />
          <div data-testid="two" ref={second ? ref : undefined} />
        </>
      );
    }
    render(<Switcher />);
    expect(liveFakes()[0].target).toBe(screen.getByTestId("one"));
    act(() => screen.getByText("switch").click());
    expect(liveFakes()).toHaveLength(1);
    expect(liveFakes()[0].target).toBe(screen.getByTestId("two"));
  });

  it("destroys the emitter on unmount", () => {
    const { unmount } = renderHook(() => usePue());
    const [emitter] = liveFakes();
    unmount();
    expect(emitter.destroyed).toBe(true);
    expect(liveFakes()).toHaveLength(0);
  });

  it("leaves exactly one live emitter under Strict Mode", () => {
    renderHook(() => usePue(), { wrapper: StrictMode });
    expect(liveFakes()).toHaveLength(1);
  });

  it("binds to the element on the first commit, without a throwaway window emitter", async () => {
    function Started() {
      const { ref } = usePue<HTMLDivElement>({}, { autoStart: true });
      return <div data-testid="started" ref={ref} />;
    }
    render(<Started />);
    await act(async () => {});
    expect(createEmitter).toHaveBeenCalledTimes(1);
    expect(fakes[0].target).toBe(screen.getByTestId("started"));
    expect(fakes[0].start).toHaveBeenCalledTimes(1);
  });

  it("binds to the element under Strict Mode without throwing", () => {
    render(
      <StrictMode>
        <Feed />
      </StrictMode>,
    );
    expect(liveFakes()).toHaveLength(1);
    expect(liveFakes()[0].target).toBe(screen.getByTestId("feed"));
  });

  it("does not fall back to window when the element goes away", () => {
    function Panel() {
      const [open, setOpen] = useState(true);
      const { ref } = usePue<HTMLDivElement>();
      return (
        <>
          <button onClick={() => setOpen(false)} type="button">
            close
          </button>
          {open ? <div data-testid="panel" ref={ref} /> : null}
        </>
      );
    }
    render(<Panel />);
    act(() => screen.getByText("close").click());
    expect(liveFakes()).toHaveLength(0);
  });

  it("does not loop on inline options compared by identity", () => {
    const { rerender } = renderHook(
      ({ n }) => usePue({ tonnage: (velocity: number) => velocity / n, volume: Number.NaN }),
      {
        initialProps: { n: 3000 },
      },
    );
    expect(() => {
      rerender({ n: 3000 });
      rerender({ n: 3000 });
    }).not.toThrow();
    expect(liveFakes()).toHaveLength(1);
  });

  it("reverts removed options to their defaults", () => {
    const { rerender } = renderHook(({ options }) => usePue(options), {
      initialProps: { options: { volume: 0.5, threshold: 120 } as Record<string, number> },
    });
    rerender({ options: { volume: 0.5 } });
    const [[partial]] = liveFakes()[0].update.mock.calls as [[Record<string, unknown>]];
    // The removed key must be sent explicitly as undefined so that the core falls back to its default.
    expect(Object.keys(partial).sort()).toEqual(["threshold", "volume"]);
    expect(partial.threshold).toBeUndefined();
  });

  it("keeps start, stop and emit safe after the emitter is gone", async () => {
    let captured: ReturnType<typeof usePue> | undefined;
    function Holder({ enabled }: { enabled: boolean }) {
      const result = usePue(enabled ? {} : false);
      useEffect(() => {
        if (result.emitter) captured ??= result;
      });
      return null;
    }
    const { rerender } = render(<Holder enabled />);
    expect(captured?.emitter).not.toBeNull();
    rerender(<Holder enabled={false} />);
    await expect(captured?.start()).resolves.toBeUndefined();
    expect(() => captured?.stop()).not.toThrow();
    expect(() => captured?.emit()).not.toThrow();
  });

  it("renders on the server without creating an emitter", () => {
    let state: string | undefined;
    function Probe() {
      state = usePue().state;
      return null;
    }
    renderToString(<Probe />);
    expect(state).toBe("idle");
    expect(createEmitter).not.toHaveBeenCalled();
  });
});
