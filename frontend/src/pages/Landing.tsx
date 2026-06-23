import { type CSSProperties } from "react";
import { Link } from "react-router-dom";
import {
  Flame,
  ListChecks,
  Moon,
  NotebookPen,
  Sparkles,
  Sun,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { useMediaQuery } from "../hooks/useMediaQuery";

const features = [
  {
    icon: NotebookPen,
    title: "Ghi chú thông minh",
    desc: "Soạn bài học với trình soạn thảo kiểu block, gắn thẻ chủ đề và độ khó.",
  },
  {
    icon: ListChecks,
    title: "Ôn tập theo lịch",
    desc: "Làm quiz tự động từ bài ghi, ôn lại đúng lúc cần nhớ nhất.",
  },
  {
    icon: Flame,
    title: "Chuỗi học mỗi ngày",
    desc: "Theo dõi tiến độ, giữ chuỗi học và xem heatmap hoạt động của bạn.",
  },
] as const;

export default function Landing() {
  const { theme, toggle } = useTheme();
  const { token } = useAuth();
  const isDesktop = useMediaQuery("(min-width: 961px)");

  const gridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: isDesktop ? "repeat(3, 1fr)" : "1fr",
    gap: isDesktop ? 28 : 20,
    maxWidth: 1040,
    margin: "0 auto",
    width: "100%",
    padding: isDesktop ? "72px 32px 56px" : "48px 24px 40px",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)" }}>
      <section
        style={{
          position: "relative",
          background:
            "linear-gradient(160deg,var(--accent) 0%,var(--accent-press) 100%)",
          padding: isDesktop ? "88px 48px 96px" : "72px 24px 80px",
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
            border: "1px solid rgba(255,255,255,.35)",
            background: "rgba(255,255,255,.12)",
            borderRadius: 13,
            cursor: "pointer",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
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
          <h1
            style={{
              fontFamily: "var(--display)",
              fontWeight: 600,
              fontSize: isDesktop ? "3.2rem" : "2.35rem",
              lineHeight: 1.1,
              letterSpacing: "-.02em",
              color: "#fff",
              margin: 0,
            }}
          >
            Học chậm lại, nhớ lâu hơn.
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,.82)",
              fontSize: "1.1rem",
              lineHeight: 1.6,
              marginTop: 20,
              marginBottom: 36,
            }}
          >
            Ghi chú, ôn tập theo lịch ghi nhớ và theo dõi tiến bộ mỗi ngày —
            nhẹ nhàng trước mỗi kỳ thi.
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 14,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Link
              to="/register"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                height: 52,
                padding: "0 28px",
                borderRadius: 24,
                background: "var(--paper)",
                color: "var(--accent)",
                fontWeight: 600,
                fontSize: "1rem",
                textDecoration: "none",
                boxShadow: "var(--coral-glow)",
              }}
            >
              Bắt đầu ngay
            </Link>
            <Link
              to="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                height: 52,
                padding: "0 28px",
                borderRadius: 24,
                background: "transparent",
                color: "#fff",
                fontWeight: 600,
                fontSize: "1rem",
                textDecoration: "none",
                border: "1.5px solid rgba(255,255,255,.55)",
              }}
            >
              Đăng nhập
            </Link>
            {token ? (
              <Link
                to="/app"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 52,
                  padding: "0 22px",
                  borderRadius: 24,
                  color: "rgba(255,255,255,.9)",
                  fontWeight: 500,
                  fontSize: ".95rem",
                  textDecoration: "underline",
                  textUnderlineOffset: 4,
                }}
              >
                Vào ứng dụng
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section style={gridStyle}>
        {features.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            style={{
              background: "var(--paper)",
              border: "1px solid var(--border)",
              borderRadius: 24,
              padding: "28px 26px",
              boxShadow: "var(--shadow-lift)",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 99,
                background: "var(--accent-tint)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 18,
                color: "var(--accent)",
              }}
            >
              <Icon size={26} strokeWidth={2} />
            </div>
            <h3
              style={{
                fontFamily: "var(--display)",
                fontWeight: 600,
                fontSize: "1.25rem",
                letterSpacing: "-.02em",
                margin: "0 0 10px",
                color: "var(--ink)",
              }}
            >
              {title}
            </h3>
            <p
              style={{
                margin: 0,
                color: "var(--muted)",
                fontSize: ".98rem",
                lineHeight: 1.55,
              }}
            >
              {desc}
            </p>
          </div>
        ))}
      </section>

      <footer
        style={{
          textAlign: "center",
          padding: "32px 24px 40px",
          color: "var(--muted)",
          fontSize: ".86rem",
          borderTop: "1px solid var(--border)",
        }}
      >
        StudyMap · Sổ tay học tập cho kỳ thi · {new Date().getFullYear()}
      </footer>
    </div>
  );
}