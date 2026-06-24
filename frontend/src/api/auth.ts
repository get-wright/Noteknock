import { apiRequest } from "./client";

export type Token = { access_token: string; token_type: string };
export type Me = { id: string; name: string; email: string };
export type AuthConfig = {
  authType: string;
  googleClientId?: string | null;
  googleRedirectUri?: string | null;
};

export function register(data: {
  name: string;
  email: string;
  password: string;
}): Promise<Token> {
  return apiRequest<Token>("/api/register", {
    method: "POST",
    body: data,
    auth: false,
  });
}

export function login(email: string, password: string): Promise<Token> {
  const form = new URLSearchParams();
  form.set("username", email);
  form.set("password", password);
  return apiRequest<Token>("/api/token", { method: "POST", form, auth: false });
}

export function loginWithGoogleCode(code: string): Promise<Token> {
  return apiRequest<Token>("/api/oauth/google", {
    method: "POST",
    body: { code },
    auth: false,
  });
}

export function getAuthConfig(): Promise<AuthConfig> {
  return apiRequest<AuthConfig>("/api/config", { auth: false });
}

export function authCheck(): Promise<string> {
  return apiRequest<string>("/api/auth-check");
}

export function getMe(): Promise<Me> {
  return apiRequest<Me>("/api/me");
}