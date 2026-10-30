"use client";
/**
 * The workspace starts on the task list (the login guard handles sign-in).
 * Done on the client so it also works in the static export, which has no
 * server to answer a redirect.
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  useEffect(() => router.replace("/tasks"), [router]);
  return null;
}
