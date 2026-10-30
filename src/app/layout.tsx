/**
 * Root layout (server component).
 * Reads runtime configuration from the environment on every request and hands
 * the public part to client components through ConfigProvider.
 */
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { connection } from "next/server";
import { readSettings } from "@/lib/config/settings";
import { ConfigProvider } from "@/providers/ConfigProvider";
import { SessionProvider } from "@/providers/SessionProvider";
import "./globals.css";


export const metadata: Metadata = {
  title: "IDICorp · Service console",
  description: "IDICorp internal service console for tasks and realtime tools",
};

export const viewport: Viewport = { themeColor: "#153c35" };

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Server mode: read the environment on every request, not once at build.
  // Static export: there is no request, so settings are fixed at build time.
  if (process.env.STATIC_EXPORT !== "1") await connection();
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
