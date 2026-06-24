import { useEffect, useState, type CSSProperties } from "react";
import { motion } from "motion/react";
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
  reduced?: boolean;
};

export default function GoogleSignInButton({ returnTo, reduced }: Props) {
  const [clientId, setClientId] = useState<string | null>(null);
  const [redirectUri, setRedirectUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const config = await getAuthConfig();
        if (
          !cancelled &&
          config.googleClientId &&
          config.googleRedirectUri
        ) {
          setClientId(config.googleClientId);
          setRedirectUri(config.googleRedirectUri);
        }
      } catch {
        /* config optional */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !clientId || !redirectUri) {
    return null;
  }

  const motionAllowed = !reduced;

  return (
    <motion.button
      type="button"
      style={buttonStyle}
      onClick={() => startGoogleSignIn(clientId, redirectUri, returnTo)}
      whileHover={
        motionAllowed ? { y: -2, scale: 1.01 } : undefined
      }
      whileTap={motionAllowed ? { scale: 0.98 } : undefined}
      transition={
        motionAllowed
          ? { type: "spring", stiffness: 120, damping: 18 }
          : undefined
      }
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
    </motion.button>
  );
}