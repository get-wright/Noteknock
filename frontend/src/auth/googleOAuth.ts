const OAUTH_STATE_KEY = "noteknock_google_oauth_state";
const OAUTH_RETURN_KEY = "noteknock_google_oauth_return";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_SCOPE = "openid email profile";

function randomState(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function startGoogleSignIn(
  clientId: string,
  redirectUri: string,
  returnTo?: string,
): void {
  const state = randomState();
  sessionStorage.setItem(OAUTH_STATE_KEY, state);
  if (returnTo) {
    sessionStorage.setItem(OAUTH_RETURN_KEY, returnTo);
  } else {
    sessionStorage.removeItem(OAUTH_RETURN_KEY);
  }
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_SCOPE,
    state,
    prompt: "select_account",
  });
  window.location.assign(`${GOOGLE_AUTH_URL}?${params.toString()}`);
}

export function consumeGoogleOAuthState(received: string | null): boolean {
  const expected = sessionStorage.getItem(OAUTH_STATE_KEY);
  sessionStorage.removeItem(OAUTH_STATE_KEY);
  return Boolean(expected && received && expected === received);
}

export function consumeGoogleOAuthReturnTo(): string {
  const value = sessionStorage.getItem(OAUTH_RETURN_KEY) ?? "/app";
  sessionStorage.removeItem(OAUTH_RETURN_KEY);
  return value;
}