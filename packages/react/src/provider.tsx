import type { EmitterOptions } from "@puejs/core";
import { createContext, useContext, useMemo } from "react";

interface PueContextValue {
  defaults?: EmitterOptions;
  audioContext?: AudioContext;
}

const PueContext = createContext<PueContextValue>({});

export interface PueProviderProps {
  /** Options merged under every usePue() call in the subtree. */
  defaults?: EmitterOptions;
  /** Context shared by every emitter in the subtree. Never closed by the adapter. */
  audioContext?: AudioContext;
  children?: React.ReactNode;
}

export function PueProvider({ defaults, audioContext, children }: PueProviderProps): React.JSX.Element {
  const value = useMemo(() => ({ defaults, audioContext }), [defaults, audioContext]);
  return <PueContext.Provider value={value}>{children}</PueContext.Provider>;
}

export const usePueContext = (): PueContextValue => useContext(PueContext);
