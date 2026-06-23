import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Moon, Sparkles, Sun } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { ApiError } from "../api/client";
import { useTheme } from "../hooks/useTheme";
import { useMediaQuery } from "../hooks/useMediaQuery";

function inputStyle(err: boolean): CSSProperties {
  return {
    width: "100%",
    height: 52,
    border: `1px solid ${err ? "var(--rose)" : "var(--border)"}`,
    borderRadius: 14,
    background: "var(--surface)",
    padding: "0 15px",
    fontFamily: "var(--body)",
    fontSize: "1rem",
    color: "var(--ink)",
    boxShadow: err ? "0 0 0 3px var(--rose-soft)" : "none",
    transition: "border-color .16s ease, box-shadow .16s ease",
  };
}

const loginArtDesktop: CSSProperties = {
  flex: "0 0 44%",
  width: "44%",
  display: "flex",
  alignItems: "flex-end",
  padding: "48px",
  background: "linear-gradient(160deg,var(--accent) 0%,var(--accent-press) 100%)",
  position: "relative",
  overflow: "hidden",
};

const loginArtMobile: CSSProperties = {
  display: "none",
  width: 0,
  flex: "0 0 0",
};

export default function Register() {
  const { register, token } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = useMediaQuery("(min-width: 961px)");

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

  useEffect(() => {
    if (didInitialCheck.current) return;
    didInitialCheck.current = true;
    if (token) navigate("/app", { replace: true });
  }, [token, navigate]);

  const validate = () => {
    let ok = true;
    if (!name.trim()) {
      setNameErr("Vui lòng nhập tên.");
      ok = false;
    } else setNameErr("");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setEmailErr("Email không hợp lệ.");
      ok = false;
    } else setEmailErr("");
    if (pw.length < 8) {
      setPwErr("Mật khẩu phải có ít nhất 8 ký tự.");
      ok = false;
    } else setPwErr("");
    if (confirm !== pw) {
      setConfirmErr("Mật khẩu xác nhận không khớp.");
      ok = false;
    } else setConfirmErr("");
    return ok;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormErr("");
    if (!validate()) return;
    setSubmitting(true);
    try {
      await register({ name, email, password: pw });
      const dest =
        (location.state as { from?: { pathname?: string } } | null)?.from
          ?.pathname ?? "/app";
      navigate(dest, { replace: true });
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

  const loginArtStyle = isDesktop ? loginArtDesktop : loginArtMobile;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "stretch",
      }}
    >
      <div style={loginArtStyle}>
        <div style={{ position: "relative", zIndex: 1, maxWidth: 380 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: ".74rem",
              fontWeight: 700,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              color: "#fff",
              opacity: 0.85,
              marginBottom: 22,
            }}
          >
            <Sparkles size={15} color="#fff" /> Sổ tay học tập
          </span>
          <h2
            style={{
              fontFamily: "var(--display)",
              fontWeight: 600,
              fontSize: "2.7rem",
              lineHeight: 1.1,
              letterSpacing: "-.02em",
              color: "#fff",
              margin: 0,
            }}
          >
            Bắt đầu sổ tay của bạn.
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,.82)",
              fontSize: "1.05rem",
              lineHeight: 1.6,
              marginTop: 16,
              marginBottom: 0,
            }}
          >
            Tạo tài khoản để bắt đầu ghi chép, ôn tập và theo dõi tiến bộ mỗi
            ngày.
          </p>
        </div>
      </div>

      <div
        className="sm-scroll"
        style={{
          flex: "1 1 auto",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflowY: "auto",
          padding: "40px 28px",
          position: "relative",
        }}
      >
        <button
          type="button"
          aria-label="Đổi giao diện"
          onClick={toggle}
          style={{
            position: "absolute",
            top: 22,
            right: 22,
            width: 42,
            height: 42,
            border: "1px solid var(--border)",
            background: "var(--paper)",
            borderRadius: 13,
            cursor: "pointer",
            color: "var(--ink)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <div style={{ width: "100%", maxWidth: 380 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              marginBottom: 10,
            }}
          >
            <span
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "var(--accent)",
                boxShadow: "var(--coral-glow)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontFamily: "var(--display)",
                fontWeight: 600,
                fontSize: "1.35rem",
              }}
            >
              S
            </span>
            <span
              style={{
                fontFamily: "var(--display)",
                fontWeight: 600,
                fontSize: "2rem",
                letterSpacing: "-.025em",
              }}
            >
              Study
              <em style={{ fontStyle: "normal", color: "var(--accent)" }}>
                Map
              </em>
            </span>
          </div>
          <p
            style={{
              color: "var(--muted)",
              fontSize: "1rem",
              lineHeight: 1.5,
              marginBottom: 30,
              marginTop: 0,
            }}
          >
            Tạo tài khoản để tiếp tục.
          </p>

          <form onSubmit={submit}>
            <label
              style={{
                display: "block",
                fontSize: ".86rem",
                fontWeight: 500,
                marginBottom: 8,
              }}
            >
              Tên
            </label>
            <input
              className="sm-in"
              type="text"
              name="name"
              placeholder="Họ và tên"
              autoComplete="name"
              value={name}
              onChange={(ev) => setName(ev.target.value)}
              style={inputStyle(!!nameErr)}
            />
            <div
              style={{
                fontSize: ".82rem",
                color: "var(--rose)",
                marginTop: 8,
                display: nameErr ? "block" : "none",
              }}
            >
              {nameErr}
            </div>

            <label
              style={{
                display: "block",
                fontSize: ".86rem",
                fontWeight: 500,
                margin: "18px 0 8px",
              }}
            >
              Email
            </label>
            <input
              className="sm-in"
              type="email"
              inputMode="email"
              name="email"
              placeholder="ban@email.com"
              autoComplete="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              style={inputStyle(!!emailErr)}
            />
            <div
              style={{
                fontSize: ".82rem",
                color: "var(--rose)",
                marginTop: 8,
                display: emailErr ? "block" : "none",
              }}
            >
              {emailErr}
            </div>

            <label
              style={{
                display: "block",
                fontSize: ".86rem",
                fontWeight: 500,
                margin: "18px 0 8px",
              }}
            >
              Mật khẩu
            </label>
            <div style={{ position: "relative" }}>
              <input
                className="sm-in"
                type={showPw ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                autoComplete="new-password"
                value={pw}
                onChange={(ev) => setPw(ev.target.value)}
                style={{ ...inputStyle(!!pwErr), paddingRight: 52 }}
              />
              <button
                type="button"
                aria-label="Hiện mật khẩu"
                onClick={() => setShowPw((v) => !v)}
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 38,
                  height: 38,
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  color: "var(--muted)",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {showPw ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
            <div
              style={{
                fontSize: ".82rem",
                color: "var(--rose)",
                marginTop: 8,
                display: pwErr ? "block" : "none",
              }}
            >
              {pwErr}
            </div>

            <label
              style={{
                display: "block",
                fontSize: ".86rem",
                fontWeight: 500,
                margin: "18px 0 8px",
              }}
            >
              Xác nhận mật khẩu
            </label>
            <div style={{ position: "relative" }}>
              <input
                className="sm-in"
                type={showConfirm ? "text" : "password"}
                name="confirm"
                placeholder="••••••••"
                autoComplete="new-password"
                value={confirm}
                onChange={(ev) => setConfirm(ev.target.value)}
                style={{ ...inputStyle(!!confirmErr), paddingRight: 52 }}
              />
              <button
                type="button"
                aria-label="Hiện mật khẩu xác nhận"
                onClick={() => setShowConfirm((v) => !v)}
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 38,
                  height: 38,
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  color: "var(--muted)",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {showConfirm ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
            <div
              style={{
                fontSize: ".82rem",
                color: "var(--rose)",
                marginTop: 8,
                display: confirmErr ? "block" : "none",
              }}
            >
              {confirmErr}
            </div>

            {formErr ? (
              <div
                style={{
                  fontSize: ".82rem",
                  color: "var(--rose)",
                  marginTop: 16,
                }}
              >
                {formErr}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
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
            </button>
          </form>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              margin: "22px 0",
              color: "var(--faint)",
              fontSize: ".82rem",
            }}
          >
            <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
            hoặc
            <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          <button
            type="button"
            style={{
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
            }}
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

          <p
            style={{
              marginTop: 26,
              fontSize: ".94rem",
              color: "var(--muted)",
            }}
          >
            Đã có tài khoản?{" "}
            <Link
              to="/login"
              style={{ color: "var(--accent)", fontWeight: 600 }}
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}