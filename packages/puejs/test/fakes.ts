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
}

export class FakeAudioContext {
  state: "suspended" | "running" | "closed";
  currentTime = 0;
  destination = { kind: "destination" };
  sources: FakeSource[] = [];
  decodeCalls = 0;
  allowResume: boolean;
  hangResume: boolean;
  private listeners = new Set<() => void>();

  constructor({ state = "running", allowResume = true, hangResume = false }: FakeAudioContextOptions = {}) {
    this.state = state;
    this.allowResume = allowResume;
    this.hangResume = hangResume;
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
