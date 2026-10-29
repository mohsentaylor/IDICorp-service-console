"use client";
/**
 * Makes the server-provided public configuration (backend origin, socket
 * endpoints, release) available to client components. The root layout reads
 * it from the environment at request time, so no extra HTTP round trip is needed.
 */
import { createContext, useContext, type ReactNode } from "react";
import type { ClientConfig } from "@/types";

const ConfigContext = createContext<ClientConfig | null>(null);

export function ConfigProvider({ config, children }: { config: ClientConfig; children: ReactNode }) {
  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
}

export function useConfig(): ClientConfig {
  const config = useContext(ConfigContext);
  if (!config) throw new Error("useConfig must be used inside ConfigProvider");
  return config;
}
