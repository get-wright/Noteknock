import type { ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import GoogleSignInButton from "./GoogleSignInButton";
import { useTheme } from "../hooks/useTheme";
import { authFormMotion } from "../pages/authMotion";

type Props = {
  mode: "login" | "register";
  subtitle: string;
  footerLink: ReactNode;
  googleReturnTo?: string;
  children: ReactNode;
};

export default function AuthFormShell({
  mode: _mode,
  subtitle,
  footerLink,
  googleReturnTo,
  children,
}: Props) {
  const { theme, toggle } = useTheme();
  const reduced = useReducedMotion() ?? false;
  const { container: formContainer, item: formItem } = authFormMotion(reduced);

  return (
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

      <motion.div
        style={{ width: "100%", maxWidth: 380 }}
        variants={formContainer}
        initial="hidden"
        animate="show"
      >
        <motion.div
          variants={formItem}
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
            <em style={{ fontStyle: "normal", color: "var(--accent)" }}>Map</em>
          </span>
        </motion.div>
        <motion.p
          variants={formItem}
          style={{
            color: "var(--muted)",
            fontSize: "1rem",
            lineHeight: 1.5,
            marginBottom: 30,
            marginTop: 0,
          }}
        >
          {subtitle}
        </motion.p>

        {children}

        <motion.div
          variants={formItem}
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
        </motion.div>

        <motion.div variants={formItem}>
          <GoogleSignInButton returnTo={googleReturnTo} reduced={reduced} />
        </motion.div>

        <motion.p
          variants={formItem}
          style={{
            marginTop: 26,
            fontSize: ".94rem",
            color: "var(--muted)",
          }}
        >
          {footerLink}
        </motion.p>
      </motion.div>
    </div>
  );
}