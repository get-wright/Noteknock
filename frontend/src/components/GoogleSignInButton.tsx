import { useEffect, useState, type CSSProperties } from "react";
import { getAuthConfig } from "../api/auth";
import { startGoogleSignIn } from "../auth/googleOAuth";

const buttonStyle: CSSProperties = {
  width: "100%",
  height: 54,
  border: "1px solid var(--border)",
  background: "var(--paper)",
  color: "var(--ink)",
  borderRadius: 15,
  cursor: "pointer",
  fontFamily: "var(--body)",
  fontWeight: 600,
  fontSize: "1rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
};

type Props = {
  returnTo?: string;
};

export default function GoogleSignInButton({ returnTo }: Props) {
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const config = await getAuthConfig();
        if (!cancelled && config.googleClientId) {
          setClientId(config.googleClientId);
        }
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !clientId) {
    return null;
  }

  return (
    <button
      type="button"
      style={buttonStyle}
      onClick={() => startGoogleSignIn(clientId, returnTo)}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          border: "1.5px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: ".86rem",
          color: "var(--muted)",
        }}
      >
        G
      </span>
      Tiếp tục với Google
    </button>
  );
}