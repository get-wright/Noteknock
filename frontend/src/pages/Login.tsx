import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthArtPanel from "../components/AuthArtPanel";
import AuthFormShell from "../components/AuthFormShell";
import AuthInput from "../components/AuthInput";
import { useAuth } from "../auth/AuthContext";
import { ApiError } from "../api/client";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { motion, useReducedMotion } from "motion/react";
import { authFormMotion } from "./authMotion";
import { validateLoginForm } from "./authValidation";

export default function Login() {
  const { login, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = useMediaQuery("(min-width: 961px)");
  const reduced = useReducedMotion() ?? false;
  const { item: formItem } = authFormMotion(reduced);

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [emailErr, setEmailErr] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [formErr, setFormErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const didInitialCheck = useRef(false);

  const returnTo =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ??
    "/app";

  useEffect(() => {
    if (didInitialCheck.current) return;
    didInitialCheck.current = true;
    if (token) navigate("/app", { replace: true });
  }, [token, navigate]);

  const validate = () => {
    const errors = validateLoginForm({ email, password: pw });
    setEmailErr(errors.email ?? "");
    setPwErr(errors.password ?? "");
    return Object.keys(errors).length === 0;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormErr("");
    if (!validate()) return;
    setSubmitting(true);
    try {
      await login(email, pw);
      navigate(returnTo, { replace: true });
    } catch (err) {
      setFormErr(
        err instanceof ApiError
          ? err.message
          : "Đã có lỗi xảy ra. Vui lòng thử lại.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "stretch",
      }}
    >
      <AuthArtPanel
        headline="Học chậm lại, nhớ lâu hơn."
        subcopy="Ghi chú, ôn tập theo lịch ghi nhớ và theo dõi tiến bộ mỗi ngày — nhẹ nhàng trước mỗi kỳ thi."
        isDesktop={isDesktop}
        reduced={reduced}
      />

      <AuthFormShell
        mode="login"
        subtitle="Đăng nhập để tiếp tục ôn tập."
        googleReturnTo={returnTo}
        footerLink={
          <>
            Chưa có tài khoản?{" "}
            <Link
              to="/register"
              style={{ color: "var(--accent)", fontWeight: 600 }}
            >
              Đăng ký
            </Link>
          </>
        }
      >
        <motion.form variants={formItem} onSubmit={submit}>
          <AuthInput
            id="login-email"
            label="Email"
            type="email"
            inputMode="email"
            placeholder="ban@email.com"
            autoComplete="email"
            value={email}
            onChange={setEmail}
            error={emailErr}
            first
          />

          <AuthInput
            id="login-password"
            label="Mật khẩu"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={pw}
            onChange={setPw}
            error={pwErr}
            passwordToggle={{
              show: showPw,
              onToggle: () => setShowPw((v) => !v),
            }}
          />

          {formErr ? (
            <div
              role="alert"
              style={{
                fontSize: ".82rem",
                color: "var(--rose)",
                marginTop: 16,
              }}
            >
              {formErr}
            </div>
          ) : null}

          <motion.button
            type="submit"
            disabled={submitting}
            whileHover={reduced || submitting ? undefined : { scale: 1.02 }}
            whileTap={reduced || submitting ? undefined : { scale: 0.98 }}
            style={{
              width: "100%",
              height: 54,
              marginTop: 22,
              border: "none",
              cursor: submitting ? "wait" : "pointer",
              background: "var(--accent)",
              color: "#fff",
              borderRadius: 15,
              boxShadow: "var(--coral-glow)",
              fontFamily: "var(--body)",
              fontWeight: 600,
              fontSize: "1rem",
              opacity: submitting ? 0.85 : 1,
            }}
          >
            {submitting ? "Đang đăng nhập…" : "Đăng nhập"}
          </motion.button>
        </motion.form>
      </AuthFormShell>
    </div>
  );
}