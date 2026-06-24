import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  consumeGoogleOAuthReturnTo,
  consumeGoogleOAuthState,
} from "../auth/googleOAuth";
import { ApiError } from "../api/client";

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completeOAuth, token } = useAuth();
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (token) {
      navigate("/app", { replace: true });
      return;
    }
    if (started.current) return;
    started.current = true;

    const oauthError = searchParams.get("error");
    if (oauthError) {
      setError("Đăng nhập Google đã bị hủy hoặc thất bại.");
      return;
    }

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    if (!code || !consumeGoogleOAuthState(state)) {
      setError("Phiên đăng nhập Google không hợp lệ. Vui lòng thử lại.");
      return;
    }

    (async () => {
      try {
        await completeOAuth(code);
        navigate(consumeGoogleOAuthReturnTo(), { replace: true });
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : "Không thể hoàn tất đăng nhập Google.",
        );
      }
    })();
  }, [completeOAuth, navigate, searchParams, token]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 420, textAlign: "center" }}>
        {error ? (
          <>
            <p style={{ color: "var(--rose)", marginBottom: 18 }}>{error}</p>
            <Link to="/login" style={{ color: "var(--accent)", fontWeight: 600 }}>
              Quay lại đăng nhập
            </Link>
          </>
        ) : (
          <p style={{ color: "var(--muted)" }}>Đang hoàn tất đăng nhập Google…</p>
        )}
      </div>
    </div>
  );
}