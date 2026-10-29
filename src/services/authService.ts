/** Sign-in API calls. Components depend on this module, not on raw fetch. */
import { request } from "@/lib/api/httpClient";
import { parseCaptcha, parseLogin } from "@/lib/api/contracts";
import type { Captcha, LoginRequest, LoginResponse } from "@/types";

export const authService = {
  getCaptcha(signal?: AbortSignal): Promise<Captcha> {
    return request("/api/auth/login", { signal, decode: parseCaptcha });
  },

  login(body: LoginRequest, signal?: AbortSignal): Promise<LoginResponse> {
    return request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
      signal,
      decode: parseLogin,
    });
  },
};
