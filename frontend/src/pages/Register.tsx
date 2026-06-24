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
import { validateRegisterForm } from "./authValidation";

export default function Register() {
  const { register, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = useMediaQuery("(min-width: 961px)");
  const reduced = useReducedMotion() ?? false;
  const { item: formItem } = authFormMotion(reduced);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [nameErr, setNameErr] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [confirmErr, setConfirmErr] = useState("");
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
    const errors = validateRegisterForm({
      name,
      email,
      password: pw,
      confirm,
    });
    setNameErr(errors.name ?? "");
    setEmailErr(errors.email ?? "");
    setPwErr(errors.password ?? "");
    setConfirmErr(errors.confirm ?? "");
    return Object.keys(errors).length === 0;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormErr("");
    if (!validate()) return;
    setSubmitting(true);
    try {
      await register({ name, email, password: pw });
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
        headline="Bắt đầu sổ tay của bạn."
        subcopy="Tạo tài khoản để bắt đầu ghi chép, ôn tập và theo dõi tiến bộ mỗi ngày."
        isDesktop={isDesktop}
        reduced={reduced}
      />

      <AuthFormShell
        mode="register"
        subtitle="Tạo tài khoản để tiếp tục."
        googleReturnTo={returnTo}
        footerLink={
          <>
            Đã có tài khoản?{" "}
            <Link
              to="/login"
              style={{ color: "var(--accent)", fontWeight: 600 }}
            >
              Đăng nhập
            </Link>
          </>
        }
      >
        <motion.form variants={formItem} onSubmit={submit}>
          <AuthInput
            id="register-name"
            label="Tên"
            type="text"
            name="name"
            placeholder="Họ và tên"
            autoComplete="name"
            value={name}
            onChange={setName}
            error={nameErr}
            first
          />

          <AuthInput
            id="register-email"
            label="Email"
            type="email"
            inputMode="email"
            name="email"
            placeholder="ban@email.com"
            autoComplete="email"
            value={email}
            onChange={setEmail}
            error={emailErr}
          />

          <AuthInput
            id="register-password"
            label="Mật khẩu"
            type="password"
            name="password"
            placeholder="••••••••"
            autoComplete="new-password"
            value={pw}
            onChange={setPw}
            error={pwErr}
            passwordToggle={{
              show: showPw,
              onToggle: () => setShowPw((v) => !v),
            }}
          />

          <AuthInput
            id="register-confirm"
            label="Xác nhận mật khẩu"
            type="password"
            name="confirm"
            placeholder="••••••••"
            autoComplete="new-password"
            value={confirm}
            onChange={setConfirm}
            error={confirmErr}
            passwordToggle={{
              show: showConfirm,
              onToggle: () => setShowConfirm((v) => !v),
              showLabel: "Hiện mật khẩu xác nhận",
              hideLabel: "Ẩn mật khẩu xác nhận",
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
            {submitting ? "Đang đăng ký…" : "Đăng ký"}
          </motion.button>
        </motion.form>
      </AuthFormShell>
    </div>
  );
}