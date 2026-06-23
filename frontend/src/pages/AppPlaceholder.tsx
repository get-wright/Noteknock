import { Moon, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../hooks/useTheme";

export default function AppPlaceholder() {
  const { user, loading, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        position: "relative",
        background: "var(--canvas)",
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

      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "var(--paper)",
          border: "1px solid var(--border)",
          borderRadius: 24,
          padding: "40px 32px",
          boxShadow: "var(--shadow-lift)",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--display)",
            fontWeight: 600,
            fontSize: "1.75rem",
            letterSpacing: "-.02em",
            margin: "0 0 16px",
            color: "var(--ink)",
          }}
        >
          Đã đăng nhập
        </h1>
        {loading ? (
          <p style={{ color: "var(--muted)", margin: "0 0 8px" }}>Đang tải…</p>
        ) : (
          <p
            style={{
              fontSize: "1.1rem",
              margin: "0 0 8px",
              color: "var(--ink)",
            }}
          >
            Chào {user?.name ?? ""}!
          </p>
        )}
        {user?.email ? (
          <p style={{ color: "var(--muted)", fontSize: ".95rem", margin: "0 0 28px" }}>
            {user.email}
          </p>
        ) : (
          <div style={{ marginBottom: 28 }} />
        )}
        <button
          type="button"
          onClick={handleLogout}
          style={{
            height: 48,
            padding: "0 28px",
            borderRadius: 24,
            border: "1.5px solid var(--accent)",
            background: "transparent",
            color: "var(--accent)",
            fontWeight: 600,
            fontSize: "1rem",
            cursor: "pointer",
            fontFamily: "var(--body)",
          }}
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
}