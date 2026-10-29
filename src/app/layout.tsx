/**
 * Root layout (server component).
 * Reads runtime configuration from the environment on every request and hands
 * the public part to client components through ConfigProvider.
 */
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { readSettings } from "@/lib/config/settings";
import { ConfigProvider } from "@/providers/ConfigProvider";
import { SessionProvider } from "@/providers/SessionProvider";
import "./globals.css";

// Environment variables must be read at request time, not baked in at build.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "IDICorp · Service console",
  description: "IDICorp internal service console for tasks and realtime tools",
};

export const viewport: Viewport = { themeColor: "#153c35" };

export default function RootLayout({ children }: { children: ReactNode }) {
  const { client } = readSettings();
  return (
    <html lang="en">
      <body>
        <ConfigProvider config={client}>
          <SessionProvider>{children}</SessionProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}
