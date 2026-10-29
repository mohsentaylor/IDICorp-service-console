"use client";
/** Sign-in screen. Redirects to the workspace once a session exists. */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FineText } from "@/components/ui/FineText";
import { ServiceBanner } from "@/components/layout/ServiceBanner";
import { useSession } from "@/providers/SessionProvider";
import { safeNextPath } from "@/lib/navigation/views";
import { LoginStory } from "./LoginStory";
import { useLogin } from "@/hooks/useLogin";

export function LoginView() {
  const router = useRouter();
  const { session, notice, signIn } = useSession();
  const login = useLogin(signIn);

  useEffect(() => {
    if (session) router.replace(safeNextPath(window.location.search));
  }, [session, router]);

  return (
    <main className="min-h-dvh md:grid md:grid-cols-2">
      <LoginStory />
      <section className="flex items-center justify-center bg-[#fbfcfa] px-6 py-[34px] md:p-[35px] xl:p-[50px]">
        <div className="w-full max-w-[420px] md:max-w-[380px]">
          <ServiceBanner />
          <Eyebrow>WELCOME BACK</Eyebrow>
          <h2 className="my-3 text-[25px] md:text-[28px]">Sign in to your workspace</h2>
          <p className="mb-7 text-muted">Use the credentials supplied for your environment.</p>
          <Alert text={login.error || notice} />
          <form onSubmit={login.submit}>
            <label>
              Username
              <input name="username" autoComplete="username" required maxLength={100} />
            </label>
            <label>
              Password
              <input name="password" type="password" autoComplete="current-password" required maxLength={200} />
            </label>
            <div className="mb-[18px] flex flex-wrap items-center gap-2.5">
              <div className="flex min-h-[54px] items-center rounded-[7px] bg-[#eef2eb] p-2 text-[11px]">
                {login.captcha ? (
                  // Data URL straight from the backend: next/image adds nothing here.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={login.captcha.captcha} alt="CAPTCHA verification code" className="max-h-[60px] max-w-40" />
                ) : (
                  <span>{login.loading ? "Loading CAPTCHA…" : "CAPTCHA unavailable"}</span>
                )}
              </div>
              <Button variant="quiet" disabled={login.loading || login.busy} onClick={() => void login.refreshCaptcha()}>
                ↻ Refresh CAPTCHA
              </Button>
            </div>
            <label>
              CAPTCHA answer
              <input
                value={login.answer}
                onChange={(e) => login.setAnswer(e.target.value)}
                autoComplete="off"
                required
                maxLength={100}
              />
            </label>
            <Button type="submit" variant="primary" className="mt-2 w-full" disabled={!login.captcha || login.busy}>
              {login.busy ? "Signing in…" : "Sign in →"}
            </Button>
          </form>
          <FineText>Tasks are specific to your sign-in session and expire one hour after their latest change.</FineText>
        </div>
      </section>
    </main>
  );
}
