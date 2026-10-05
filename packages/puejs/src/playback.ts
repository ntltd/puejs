import type { Odor } from "./odor";

export interface VoiceParams {
  pitch: number;
  resonance: number;
  /** Maximum length of the emission, in milliseconds. */
  duration: number;
  gain: number;
  /** Start time, in the context's time coordinate system. */
  when: number;
}

export const FADE_OUT = 0.06;
export const RESONANCE_FREQUENCY = 180;
export const RESONANCE_MAX_GAIN = 12;

type FetchArrayBuffer = (url: string) => Promise<ArrayBuffer>;

const decoded = new WeakMap<BaseAudioContext, Map<string, Promise<AudioBuffer>>>();

/** Decodes a base64 data URI without a network request, which also keeps it clear of connect-src policies. */
export function decodeDataUri(uri: string): ArrayBuffer {
  const comma = uri.indexOf(",");
  if (!uri.startsWith("data:") || comma === -1 || !uri.slice(0, comma).endsWith(";base64")) {
    throw new TypeError("Expected a base64 data URI.");
  }
  const binary = atob(uri.slice(comma + 1));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return bytes.buffer;
}

/** Loads and decodes an odor once per context. Failed loads are evicted so they can be retried. */
export function loadOdor(
  context: BaseAudioContext,
  odor: Odor,
  fetchArrayBuffer: FetchArrayBuffer,
): Promise<AudioBuffer> {
  let cache = decoded.get(context);
  if (!cache) {
    cache = new Map();
    decoded.set(context, cache);
  }
  const cached = cache.get(odor.src);
  if (cached) return cached;

  const entries = cache;
  const promise = (async () => {
    const data = odor.src.startsWith("data:") ? decodeDataUri(odor.src) : await fetchArrayBuffer(odor.src);
    return context.decodeAudioData(data);
  })();
  entries.set(odor.src, promise);
  promise.catch(() => entries.delete(odor.src));
  return promise;
}

/** Plays one emission: source (pitch) → peaking filter (resonance) → gain (envelope) → destination. */
export function playVoice(
  context: BaseAudioContext,
  buffer: AudioBuffer,
  params: VoiceParams,
  onEnded: () => void,
): AudioBufferSourceNode {
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = params.pitch;

  const filter = context.createBiquadFilter();
  filter.type = "peaking";
  filter.frequency.value = RESONANCE_FREQUENCY;
  filter.Q.value = 1;
  filter.gain.value = params.resonance * RESONANCE_MAX_GAIN;

  const envelope = context.createGain();
  const end = params.when + params.duration / 1000;
  const fadeStart = Math.max(params.when, end - FADE_OUT);
  envelope.gain.setValueAtTime(params.gain, params.when);
  envelope.gain.setValueAtTime(params.gain, fadeStart);
  envelope.gain.linearRampToValueAtTime(0, end);

  source.connect(filter);
  filter.connect(envelope);
  envelope.connect(context.destination);
  source.onended = () => {
    source.disconnect();
    filter.disconnect();
    envelope.disconnect();
    onEnded();
  };
  source.start(params.when);
  source.stop(end);
  return source;
}
