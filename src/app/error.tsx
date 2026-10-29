"use client";
/** Next.js error boundary: replaces the hand-written ErrorBoundary component. */
import { Button } from "@/components/ui/Button";

export default function ErrorPage() {
  return (
    <main className="mx-auto my-[12vh] max-w-[700px] p-[30px]">
      <h1>We could not display this page.</h1>
      <p role="alert">Reload to recover. You will need to sign in again, which starts a new task session.</p>
      <Button variant="primary" onClick={() => window.location.reload()}>
        Reload application
      </Button>
    </main>
  );
}
