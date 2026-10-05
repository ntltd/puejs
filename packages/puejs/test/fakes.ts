import type { Environment } from "../src/environment";

export class FakeParam {
  value = 0;
  events: Array<{ type: "set" | "ramp"; value: number; time: number }> = [];

  setValueAtTime(value: number, time: number): this {
    this.events.push({ type: "set", value, time });
    this.value = value;
    return this;
  }

  linearRampToValueAtTime(value: number, time: number): this {
    this.events.push({ type: "ramp", value, time });
    return this;
  }
}

class FakeNode {
  connections: unknown[] = [];
  disconnected = false;

  connect<T>(target: T): T {
    this.connections.push(target);
    return target;
  }

  disconnect(): void {
    this.disconnected = true;
  }
}

export class FakeSource extends FakeNode {
  buffer: unknown = null;
  playbackRate = new FakeParam();
  onended: (() => void) | null = null;
  startTime: number | undefined;
  /** Every stop() call; "now" when called without a time (voice stealing). */
  stopCalls: Array<number | "now"> = [];

  start(when = 0): void {
    this.startTime = when;
  }

  stop(when?: number): void {
    this.stopCalls.push(when ?? "now");
  }

  /** Simulates the end of playback. */
  end(): void {
    this.onended?.();
  }
}

export class FakeFilter extends FakeNode {
  type = "lowpass";
  frequency = new FakeParam();
  Q = new FakeParam();
  gain = new FakeParam();
}

export class FakeGain extends FakeNode {
  gain = new FakeParam();
}

export interface FakeAudioContextOptions {
  state?: "suspended" | "running";
  /** When false, resume() leaves the context suspended (no user activation). */
  allowResume?: boolean;
  /** When true, resume() never settles, like Chrome without user activation. */
  hangResume?: boolean;
  /** When true, resume() switches to running on a later macrotask, like real audio devices. */
  asyncResume?: boolean;
}

export class FakeAudioContext {
  state: "suspended" | "running" | "closed";
  currentTime = 0;
  destination = { kind: "destination" };
  sources: FakeSource[] = [];
  decodeCalls = 0;
  allowResume: boolean;
  hangResume: boolean;
  asyncResume: boolean;
  private listeners = new Set<() => void>();

  constructor({
    state = "running",
    allowResume = true,
    hangResume = false,
    asyncResume = false,
  }: FakeAudioContextOptions = {}) {
    this.state = state;
    this.allowResume = allowResume;
    this.hangResume = hangResume;
    this.asyncResume = asyncResume;
  }

  addEventListener(type: string, listener: () => void): void {
    if (type === "statechange") this.listeners.add(listener);
  }

  removeEventListener(_type: string, listener: () => void): void {
    this.listeners.delete(listener);
  }

  setState(next: "suspended" | "running" | "closed"): void {
    this.state = next;
    for (const listener of [...this.listeners]) listener();
  }

  resume(): Promise<void> {
    if (this.hangResume && !this.allowResume) return new Promise(() => {});
    if (this.asyncResume && this.allowResume && this.state === "suspended") {
      return new Promise((resolve) =>
        setTimeout(() => {
          this.setState("running");
          resolve();
        }, 20),
      );
    }
    if (this.allowResume && this.state === "suspended") this.setState("running");
    return Promise.resolve();
  }

  close(): Promise<void> {
    this.setState("closed");
    return Promise.resolve();
  }

  decodeAudioData(data: ArrayBuffer): Promise<{ duration: number; label: string }> {
    this.decodeCalls++;
    const text = new TextDecoder().decode(data);
    if (text.startsWith("BAD")) return Promise.reject(new Error("Unable to decode audio data"));
    return Promise.resolve({ duration: 0.36, label: text });
  }

  createBufferSource(): FakeSource {
    const source = new FakeSource();
    this.sources.push(source);
    return source;
  }

  createBiquadFilter(): FakeFilter {
    return new FakeFilter();
  }

  createGain(): FakeGain {
    return new FakeGain();
  }

  asAudioContext(): AudioContext {
    return this as unknown as AudioContext;
  }
}

export const dataUri = (text: string): string => `data:audio/mpeg;base64,${btoa(text)}`;

export class FakeEnvironment implements Environment {
  time = 0;
  hidden = false;
  reduced = false;
  viewport = 800;
  contextOptions: FakeAudioContextOptions = {};
  contexts: FakeAudioContext[] = [];
  errors: unknown[] = [];
  private frames = new Map<number, () => void>();
  private nextFrame = 1;
  private reducedWatchers = new Set<(reduced: boolean) => void>();
  private gestureListeners = new Set<() => void>();

  createAudioContext(): AudioContext {
    const context = new FakeAudioContext(this.contextOptions);
    this.contexts.push(context);
    return context.asAudioContext();
  }

  releaseAudioContext(context: AudioContext): void {
    void context.close();
  }

  now(): number {
    return this.time;
  }

  requestFrame(callback: () => void): number {
    const handle = this.nextFrame++;
    this.frames.set(handle, callback);
    return handle;
  }

  cancelFrame(handle: number): void {
    this.frames.delete(handle);
  }

  get pendingFrames(): number {
    return this.frames.size;
  }

  /** Advances time, then runs the frame callbacks queued before this call. */
  flushFrame(milliseconds = 16): void {
    this.time += milliseconds;
    const queued = [...this.frames.values()];
    this.frames.clear();
    for (const callback of queued) callback();
  }

  isHidden(): boolean {
    return this.hidden;
  }

  viewportHeight(): number {
    return this.viewport;
  }

  watchReducedMotion(onChange: (reduced: boolean) => void): { reduced: boolean; dispose(): void } {
    this.reducedWatchers.add(onChange);
    return { reduced: this.reduced, dispose: () => void this.reducedWatchers.delete(onChange) };
  }

  setReducedMotion(reduced: boolean): void {
    this.reduced = reduced;
    for (const watcher of this.reducedWatchers) watcher(reduced);
  }

  onUserGesture(callback: () => void): () => void {
    this.gestureListeners.add(callback);
    return () => void this.gestureListeners.delete(callback);
  }

  get gestureListenerCount(): number {
    return this.gestureListeners.size;
  }

  gesture(): void {
    for (const listener of [...this.gestureListeners]) listener();
  }

  fetchArrayBuffer(url: string): Promise<ArrayBuffer> {
    return Promise.reject(new Error(`No fake response for ${url}`));
  }

  reportError(error: unknown): void {
    this.errors.push(error);
  }
}

export class FakeScrollTarget {
  scrollY = 0;
  private listeners = new Set<() => void>();

  addEventListener(type: string, listener: () => void): void {
    if (type === "scroll") this.listeners.add(listener);
  }

  removeEventListener(_type: string, listener: () => void): void {
    this.listeners.delete(listener);
  }

  get listenerCount(): number {
    return this.listeners.size;
  }

  scrollTo(position: number): void {
    this.scrollY = position;
    for (const listener of [...this.listeners]) listener();
  }

  asTarget(): Window {
    return this as unknown as Window;
  }
}

/** Scrolls at a constant speed, flushing one animation frame per step. */
export function scrollAtSpeed(
  env: FakeEnvironment,
  target: FakeScrollTarget,
  pxPerSecond: number,
  frames: number,
  frameMs = 16,
): void {
  for (let frame = 0; frame < frames; frame++) {
    target.scrollTo(target.scrollY + (pxPerSecond * frameMs) / 1000);
    env.flushFrame(frameMs);
  }
}

/** A scrollable element: no scrollY, a scrollTop and its own visible height. */
export class FakeElementTarget {
  scrollTop = 0;
  clientHeight = 200;
  private listeners = new Set<() => void>();

  addEventListener(type: string, listener: () => void): void {
    if (type === "scroll") this.listeners.add(listener);
  }

  removeEventListener(_type: string, listener: () => void): void {
    this.listeners.delete(listener);
  }

  scrollTo(position: number): void {
    this.scrollTop = position;
    for (const listener of [...this.listeners]) listener();
  }

  asTarget(): Element {
    return this as unknown as Element;
  }
}
