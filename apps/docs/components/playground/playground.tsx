"use client";

import Image from "next/image";
import { createEmitter, type EmissionEvent, type Emitter, type EmitterState } from "puejs";
import { useCallback, useEffect, useRef, useState } from "react";
import { css, cx } from "styled-system/css";
import { button } from "styled-system/recipes";
import { CodeLines } from "../code/code-lines";
import { EmissionRipples } from "../landing/emission-ripples";
import { CopyButton } from "../site/copy-button";
import { fieldLabel, Select, Slider } from "./controls";
import { ScrollSurfaceContent } from "./scroll-surface";
import {
  generateCode,
  ODOR_NAMES,
  ODOR_DURATIONS,
  ODORS,
  PRESET_NAMES,
  settingsFromPreset,
  TONNAGE_CURVES,
  toOptions,
  withDurationFor,
  type OdorName,
  type Settings,
  type ThrottleMode,
} from "./settings";

const card = css({ bg: "surface", borderWidth: "1px", borderColor: "border", borderRadius: "xl" });
const cardHeader = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "3",
  minHeight: "16",
  px: "4",
  py: "3",
  borderBottomWidth: "1px",
  borderColor: "border",
});

const THROTTLE_MODES: ThrottleMode[] = ["velocity", "distance", "interval"];
const LOG_SIZE = 8;

const fixed = (digits: number) => (value: number) => value.toFixed(digits);

type EmissionListener = (emission: EmissionEvent) => void;

export function Playground(): React.JSX.Element {
  const [settings, setSettings] = useState<Settings>(() => settingsFromPreset("organic"));
  const [status, setStatus] = useState<EmitterState>("idle");
  const [log, setLog] = useState<EmissionEvent[]>([]);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const emitterRef = useRef<Emitter | null>(null);
  const listenersRef = useRef(new Set<EmissionListener>());

  const subscribe = useCallback((listener: EmissionListener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  // Live updates: every control change is applied to the running emitter.
  useEffect(() => {
    emitterRef.current?.update(toOptions(settings));
  }, [settings]);

  useEffect(() => () => emitterRef.current?.destroy(), []);

  const getEmitter = (): Emitter => {
    if (!emitterRef.current) {
      const emitter = createEmitter(surfaceRef.current ?? window, toOptions(settings));
      emitter.on("statechange", ({ current }) => setStatus(current));
      emitter.on("emit", (emission) => {
        setLog((current) => [emission, ...current].slice(0, LOG_SIZE));
        for (const listener of listenersRef.current) listener(emission);
      });
      emitterRef.current = emitter;
    }
    return emitterRef.current;
  };

  const toggleAudio = (): void => {
    const emitter = getEmitter();
    if (emitter.state === "idle") void emitter.start();
    else emitter.stop();
  };

  const preview = async (name: OdorName): Promise<void> => {
    // Long odors raise the duration first, so the preview is heard in full.
    const next = withDurationFor(settings, name);
    if (next !== settings) setSettings(next);
    const emitter = getEmitter();
    emitter.update(toOptions(next));
    if (emitter.state === "idle") await emitter.start();
    emitter.emit({ odor: ODORS[name], tonnage: 0.7 });
  };

  const set = <K extends keyof Settings>(key: K, value: Settings[K]): void =>
    setSettings((current) => ({ ...current, [key]: value }));

  const setPitch = (bound: "pitchMin" | "pitchMax", value: number): void =>
    setSettings((current) => {
      const next = { ...current, [bound]: value };
      if (next.pitchMin > next.pitchMax) {
        if (bound === "pitchMin") next.pitchMax = value;
        else next.pitchMin = value;
      }
      return next;
    });

  const toggleOdor = (name: OdorName): void =>
    setSettings((current) => {
      const selected = current.odors.includes(name);
      // At least one odor must stay selected.
      if (selected && current.odors.length === 1) return current;
      const odors = selected ? current.odors.filter((odor) => odor !== name) : [...current.odors, name];
      const next = { ...current, odors: ODOR_NAMES.filter((odor) => odors.includes(odor)) };
      return selected ? next : withDurationFor(next, name);
    });

  const running = status === "running" || status === "suspended";
  const code = generateCode(settings);
  const last = log[0];

  return (
    <div className={css({ display: "flex", flexDirection: "column", gap: "4" })}>
      <div
        className={css({
          display: "grid",
          gridTemplateColumns: { base: "minmax(0, 1fr)", lg: "340px minmax(0, 1fr)" },
          gap: "4",
          alignItems: "start",
        })}
      >
        {/* Controls */}
        <section aria-label="Acoustic parameters" className={card}>
          <div className={cardHeader}>
            <span className={fieldLabel}>Parameters</span>
            <button
              className={css({ fontFamily: "mono", fontSize: "xs", color: "fg.subtle", _hover: { color: "fg" } })}
              onClick={() => setSettings(settingsFromPreset(settings.preset))}
              type="button"
            >
              Reset
            </button>
          </div>
          <div className={css({ display: "flex", flexDirection: "column", gap: "5", p: "4" })}>
            <Select
              label="Preset"
              onChange={(preset) => setSettings(settingsFromPreset(preset))}
              options={PRESET_NAMES}
              value={settings.preset}
            />

            <fieldset className={css({ display: "flex", flexDirection: "column", gap: "2" })}>
              <legend className={cx(fieldLabel, css({ mb: "2" }))}>Odors</legend>
              {ODOR_NAMES.map((name) => (
                <div className={css({ display: "flex", alignItems: "center", gap: "2" })} key={name}>
                  <label
                    className={css({
                      flex: "1",
                      display: "flex",
                      alignItems: "center",
                      gap: "2",
                      fontFamily: "mono",
                      fontSize: "sm",
                      color: "fg.muted",
                      cursor: "pointer",
                    })}
                  >
                    <input
                      checked={settings.odors.includes(name)}
                      className={css({ accentColor: "lime" })}
                      onChange={() => toggleOdor(name)}
                      type="checkbox"
                    />
                    {name}
                    <span className={css({ ml: "auto", fontSize: "xs", color: "fg.subtle" })}>
                      {(ODOR_DURATIONS[name] / 1000).toFixed(2)} s
                    </span>
                  </label>
                  <button
                    aria-label={`Preview ${name}`}
                    className={css({
                      px: "2",
                      py: "1",
                      borderWidth: "1px",
                      borderColor: "border",
                      borderRadius: "sm",
                      fontSize: "xs",
                      color: "fg.subtle",
                      cursor: "pointer",
                      _hover: { color: "primary", borderColor: "primary" },
                    })}
                    onClick={() => void preview(name)}
                    type="button"
                  >
                    ▶
                  </button>
                </div>
              ))}
            </fieldset>

            <Slider
              format={fixed(2)}
              label="Pitch min"
              max={2}
              min={0.3}
              onChange={(value) => setPitch("pitchMin", value)}
              step={0.01}
              value={settings.pitchMin}
            />
            <Slider
              format={fixed(2)}
              label="Pitch max"
              max={2}
              min={0.3}
              onChange={(value) => setPitch("pitchMax", value)}
              step={0.01}
              value={settings.pitchMax}
            />
            <Slider
              format={fixed(2)}
              label="Resonance"
              max={1}
              min={0}
              onChange={(value) => set("resonance", value)}
              step={0.01}
              value={settings.resonance}
            />
            <Slider
              format={(value) => `${value} ms`}
              label="Duration"
              max={3000}
              min={100}
              onChange={(value) => set("duration", value)}
              step={10}
              value={settings.duration}
            />
            <Slider
              format={fixed(2)}
              label="Volume"
              max={1}
              min={0}
              onChange={(value) => set("volume", value)}
              step={0.01}
              value={settings.volume}
            />
            <Slider
              format={(value) => `${value} px/s`}
              label="Threshold"
              max={1000}
              min={0}
              onChange={(value) => set("threshold", value)}
              step={10}
              value={settings.threshold}
            />
            <Select
              label="Throttle"
              onChange={(value) => set("throttle", value)}
              options={THROTTLE_MODES}
              value={settings.throttle}
            />
            {settings.throttle === "interval" ? (
              <Slider
                format={(value) => `${value} ms`}
                label="Interval"
                max={2000}
                min={0}
                onChange={(value) => set("interval", value)}
                step={10}
                value={settings.interval}
              />
            ) : null}
            <Select
              label="Tonnage curve"
              onChange={(value) => set("tonnage", value)}
              options={TONNAGE_CURVES}
              value={settings.tonnage}
            />
          </div>
        </section>

        <div className={css({ display: "flex", flexDirection: "column", gap: "4", minWidth: "0" })}>
          {/* Scroll surface */}
          <section aria-label="Scroll surface" className={card}>
            <div className={cardHeader}>
              <span className={css({ display: "inline-flex", alignItems: "center", gap: "2" })}>
                <span
                  aria-hidden="true"
                  className={css({
                    width: "2",
                    height: "2",
                    borderRadius: "full",
                    bg: status === "running" ? "primary" : status === "suspended" ? "accent" : "fg.subtle",
                  })}
                />
                <span className={fieldLabel}>{status}</span>
              </span>
              <button
                className={cx(button({ variant: running ? "secondary" : "primary" }), css({ height: "9", px: "4" }))}
                onClick={toggleAudio}
                type="button"
              >
                {running ? "Stop" : "Enable audio"}
              </button>
            </div>
            <div
              className={css({ height: "480px", overflowY: "auto", overscrollBehavior: "contain" })}
              ref={surfaceRef}
              tabIndex={0}
            >
              <ScrollSurfaceContent />
            </div>
          </section>

          {/* Telemetry */}
          <section
            aria-label="Telemetry"
            className={cx(card, css({ display: "grid", gridTemplateColumns: { base: "1fr", md: "200px 1fr" } }))}
          >
            <div
              className={css({
                position: "relative",
                display: "grid",
                placeItems: "center",
                height: "200px",
                overflow: "hidden",
                borderRightWidth: { md: "1px" },
                borderBottomWidth: { base: "1px", md: "0" },
                borderColor: "border",
              })}
            >
              <EmissionRipples subscribe={subscribe} />
              <Image alt="" height={72} src="/logo.png" width={47} />
            </div>
            <dl
              className={css({
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "4",
                p: "5",
                fontFamily: "mono",
                fontSize: "sm",
                "& dt": { fontSize: "xs", color: "fg.subtle", textTransform: "uppercase", letterSpacing: "0.06em" },
                "& dd": { mt: "1", color: "fg" },
              })}
            >
              <div>
                <dt>Odor</dt>
                <dd>{last?.odor ?? "—"}</dd>
              </div>
              <div>
                <dt>Tonnage</dt>
                <dd>{last ? last.tonnage.toFixed(2) : "—"}</dd>
              </div>
              <div>
                <dt>Velocity</dt>
                <dd>{last ? `${Math.round(last.velocity)} px/s` : "—"}</dd>
              </div>
              <div>
                <dt>Pitch</dt>
                <dd>{last ? last.pitch.toFixed(2) : "—"}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>

      <div
        className={css({ display: "grid", gridTemplateColumns: { base: "minmax(0, 1fr)", lg: "1fr 1fr" }, gap: "4" })}
      >
        {/* Emission log */}
        <section aria-label="Emission log" className={card}>
          <div className={cardHeader}>
            <span className={fieldLabel}>Emission log</span>
          </div>
          <ol
            aria-live="polite"
            className={css({ p: "4", fontFamily: "mono", fontSize: "xs", minHeight: "200px", color: "fg.muted" })}
          >
            {log.length === 0 ? (
              <li className={css({ color: "fg.subtle" })}>No emissions yet. Enable audio, then scroll the panel.</li>
            ) : (
              log.map((emission) => (
                <li
                  className={css({
                    display: "grid",
                    gridTemplateColumns: "100px repeat(3, 1fr)",
                    gap: "2",
                    py: "1.5",
                    borderBottomWidth: "1px",
                    borderColor: "border",
                    _last: { borderBottomWidth: "0" },
                  })}
                  key={emission.timestamp}
                >
                  <span className={css({ color: "primary" })}>{emission.odor}</span>
                  <span>t {emission.tonnage.toFixed(2)}</span>
                  <span>{Math.round(emission.velocity)} px/s</span>
                  <span>× {emission.pitch.toFixed(2)}</span>
                </li>
              ))
            )}
          </ol>
        </section>

        {/* Generated code */}
        <section aria-label="Generated code" className={card}>
          <div className={cardHeader}>
            <span className={fieldLabel}>Generated code</span>
            <CopyButton label="Copy code" text={code} />
          </div>
          <CodeLines code={code} />
        </section>
      </div>
    </div>
  );
}
