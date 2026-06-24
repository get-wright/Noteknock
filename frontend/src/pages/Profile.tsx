import {
  Bell,
  ChevronRight,
  Flame,
  Globe,
  HelpCircle,
  LogOut,
  Monitor,
  NotebookPen,
  Pencil,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../hooks/useTheme";

const LEADER = [
  { rank: 1, av: "MP", name: "Nguyễn Minh Phương", pts: "1.240", top: true, me: false },
  { rank: 2, av: "TB", name: "Trần Thái Bảo", pts: "1.080", top: true, me: false },
  { rank: 3, av: "Hà", name: "Nguyễn Thu Hà", pts: "960", top: true, me: true },
  { rank: 4, av: "GH", name: "Lê Gia Hân", pts: "820", top: false, me: false },
] as const;

const STAT_TILES = [
  { icon: Flame, num: "12", unit: "ngày", label: "Chuỗi học" },
  { icon: NotebookPen, num: "24", unit: "bài", label: "Tổng số bài" },
  { icon: HelpCircle, num: "24", unit: "quiz", label: "Đã làm quiz" },
] as const;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2);
  return parts[0][0] + parts[parts.length - 1][0];
}

function ToggleSwitch({
  on,
  onToggle,
  ariaLabel,
}: {
  on: boolean;
  onToggle: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      style={{
        flex: "0 0 auto",
        width: 46,
        height: 28,
        borderRadius: 99,
        border: "none",
        background: on ? "var(--accent)" : "var(--track)",
        cursor: "pointer",
        padding: 0,
        position: "relative",
        transition: "background .2s ease",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: 3,
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,.25)",
          transform: on ? "translateX(18px)" : "none",
          transition: "transform .22s cubic-bezier(.3,.9,.3,1.2)",
        }}
      />
    </button>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const [notify, setNotify] = useState(true);
  const [sync, setSync] = useState(true);

  const displayName = user?.name ?? "…";
  const displayEmail = user?.email ?? "";
  const avatarLabel = user ? initials(user.name) : "?";

  const leaderboard = useMemo(
    () =>
      LEADER.map((l) => ({
        ...l,
        highlight:
          l.me || (user?.name != null && user.name.trim() === l.name.trim()),
      })),
    [user?.name],
  );

  const themeLabel = theme === "light" ? "Sáng" : "Tối";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--canvas)",
        padding: "28px 20px 48px",
      }}
    >
      <div style={{ maxWidth: 680, margin: "0 auto", width: "100%" }}>
        <button
          type="button"
          onClick={() => navigate("/app")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            border: "none",
            background: "none",
            cursor: "pointer",
            color: "var(--muted)",
            fontFamily: "var(--body)",
            fontSize: ".9rem",
            marginBottom: 18,
            padding: 0,
          }}
        >
          Bài học
        </button>

        <section className="sm-fade">
          <section
            style={{
              display: "flex",
              alignItems: "center",
              gap: 15,
              background: "var(--paper)",
              border: "1px solid var(--border)",
              borderRadius: 20,
              padding: 17,
              boxShadow: "var(--shadow)",
              marginBottom: 16,
            }}
          >
            <span
              style={{
                flex: "0 0 auto",
                width: 62,
                height: 62,
                borderRadius: "50%",
                background: "var(--accent-soft)",
                color: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
                fontSize: "1.4rem",
                border: "1px solid var(--border)",
              }}
            >
              {avatarLabel}
            </span>
            <div style={{ flex: "1 1 auto", minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "var(--display)",
                  fontWeight: 600,
                  fontSize: "1.25rem",
                  letterSpacing: "-.01em",
                  lineHeight: 1.2,
                }}
              >
                {displayName}
              </div>
              {displayEmail ? (
                <div
                  style={{
                    fontSize: ".86rem",
                    color: "var(--muted)",
                    marginTop: 3,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {displayEmail}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              disabled
              aria-label="Chỉnh sửa hồ sơ — sắp có"
              title="Chỉnh sửa hồ sơ — sắp có"
              style={{
                flex: "0 0 auto",
                width: 40,
                height: 40,
                border: "1px solid var(--border)",
                background: "transparent",
                borderRadius: 12,
                cursor: "not-allowed",
                color: "var(--muted)",
                opacity: 0.55,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Pencil size={19} strokeWidth={1.8} />
            </button>
          </section>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 11,
              marginBottom: 16,
            }}
          >
            {STAT_TILES.map((t) => {
              const Icon = t.icon;
              return (
                <div
                  key={t.label}
                  style={{
                    background: "var(--paper)",
                    border: "1px solid var(--border)",
                    borderRadius: 18,
                    padding: "14px 13px",
                    boxShadow: "var(--shadow)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 9,
                  }}
                >
                  <span style={{ color: "var(--accent)" }}>
                    <Icon size={17} strokeWidth={1.8} />
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontWeight: 600,
                      color: "var(--ink)",
                      lineHeight: 1,
                    }}
                  >
                    <span style={{ fontSize: "1.4rem", letterSpacing: "-.01em" }}>
                      {t.num}
                    </span>
                    <span
                      style={{
                        fontSize: ".74rem",
                        color: "var(--muted)",
                        marginLeft: 2,
                      }}
                    >
                      {t.unit}
                    </span>
                  </span>
                  <span
                    style={{
                      fontSize: ".72rem",
                      color: "var(--muted)",
                      fontWeight: 500,
                    }}
                  >
                    {t.label}
                  </span>
                </div>
              );
            })}
          </div>

          <section
            style={{
              position: "relative",
              overflow: "hidden",
              background: "var(--paper)",
              border: "1px solid var(--border)",
              borderRadius: 20,
              boxShadow: "var(--shadow)",
              padding: 18,
              marginBottom: 24,
            }}
          >
            <span
              style={{
                position: "absolute",
                inset: 0,
                background: "var(--accent-tint)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 13,
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  width: 46,
                  height: 46,
                  flex: "0 0 auto",
                  padding: 11,
                  borderRadius: 13,
                  background: "var(--accent)",
                  color: "#fff",
                  boxShadow: "var(--coral-glow)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sparkles size={24} strokeWidth={1.8} />
              </span>
              <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "1.08rem",
                    fontWeight: 600,
                    letterSpacing: "-.01em",
                  }}
                >
                  StudyMap Pro
                </div>
                <div
                  style={{
                    fontSize: ".85rem",
                    color: "var(--muted)",
                    marginTop: 4,
                  }}
                >
                  Gia hạn vào{" "}
                  <span style={{ fontFamily: "var(--mono)" }}>12/07/2026</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              disabled
              title="Quản lý gói đăng ký — sắp có"
              aria-label="Quản lý gói đăng ký — sắp có"
              style={{
                position: "relative",
                width: "100%",
                height: 46,
                border: "1px solid var(--border)",
                background: "var(--paper)",
                color: "var(--ink)",
                borderRadius: 13,
                cursor: "not-allowed",
                opacity: 0.55,
                fontFamily: "var(--body)",
                fontWeight: 600,
                fontSize: ".92rem",
              }}
            >
              Quản lý gói đăng ký
            </button>
          </section>

          <div
            style={{
              fontSize: ".78rem",
              fontWeight: 700,
              letterSpacing: ".05em",
              textTransform: "uppercase",
              color: "var(--muted)",
              margin: "0 2px 11px",
            }}
          >
            Bảng xếp hạng
          </div>
          <section
            style={{
              background: "var(--paper)",
              border: "1px solid var(--border)",
              borderRadius: 18,
              boxShadow: "var(--shadow)",
              overflow: "hidden",
              marginBottom: 24,
            }}
          >
            {leaderboard.map((l) => (
              <div
                key={l.rank}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  minHeight: 52,
                  padding: "10px 16px",
                  background: l.highlight ? "var(--accent-tint)" : "transparent",
                }}
              >
                <span
                  style={{
                    flex: "0 0 auto",
                    width: 18,
                    textAlign: "center",
                    fontFamily: "var(--mono)",
                    fontSize: ".85rem",
                    fontWeight: 600,
                    color: l.top ? "var(--accent)" : "var(--faint)",
                  }}
                >
                  {l.rank}
                </span>
                <span
                  style={{
                    flex: "0 0 auto",
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: "var(--accent-soft)",
                    color: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: ".78rem",
                    fontWeight: 600,
                    border: "1px solid var(--border)",
                  }}
                >
                  {l.av}
                </span>
                <span
                  style={{
                    flex: "1 1 auto",
                    minWidth: 0,
                    fontSize: ".95rem",
                    fontWeight: l.highlight ? 600 : 500,
                    color: "var(--ink)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {l.name}
                </span>
                <span
                  style={{
                    flex: "0 0 auto",
                    fontFamily: "var(--mono)",
                    fontSize: ".9rem",
                    fontWeight: 600,
                    color: l.highlight ? "var(--accent)" : "var(--ink)",
                  }}
                >
                  {l.pts}
                </span>
              </div>
            ))}
          </section>

          <div
            style={{
              fontSize: ".78rem",
              fontWeight: 700,
              letterSpacing: ".05em",
              textTransform: "uppercase",
              color: "var(--muted)",
              margin: "0 2px 11px",
            }}
          >
            Cài đặt
          </div>
          <section
            style={{
              background: "var(--paper)",
              border: "1px solid var(--border)",
              borderRadius: 18,
              boxShadow: "var(--shadow)",
              overflow: "hidden",
              marginBottom: 24,
            }}
          >
            <button
              type="button"
              onClick={toggleTheme}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 13,
                minHeight: 58,
                padding: "12px 16px",
                width: "100%",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontFamily: "var(--body)",
                textAlign: "left",
              }}
            >
              <span
                style={{
                  width: 38,
                  height: 38,
                  flex: "0 0 auto",
                  padding: 9,
                  borderRadius: 11,
                  background: "var(--accent-soft)",
                  color: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Monitor size={20} strokeWidth={1.8} />
              </span>
              <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                <div
                  style={{
                    fontSize: ".98rem",
                    fontWeight: 500,
                    color: "var(--ink)",
                  }}
                >
                  Giao diện
                </div>
              </div>
              <span
                style={{
                  fontSize: ".9rem",
                  color: "var(--muted)",
                  whiteSpace: "nowrap",
                }}
              >
                {themeLabel}
              </span>
              <ChevronRight
                size={20}
                style={{ color: "var(--faint)", flexShrink: 0 }}
              />
            </button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 13,
                minHeight: 58,
                padding: "12px 16px",
              }}
            >
              <span
                style={{
                  width: 38,
                  height: 38,
                  flex: "0 0 auto",
                  padding: 9,
                  borderRadius: 11,
                  background: "var(--accent-soft)",
                  color: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Bell size={20} strokeWidth={1.8} />
              </span>
              <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                <div
                  style={{
                    fontSize: ".98rem",
                    fontWeight: 500,
                    color: "var(--ink)",
                  }}
                >
                  Nhắc ôn tập hằng ngày
                </div>
                <div
                  style={{
                    fontSize: ".8rem",
                    color: "var(--muted)",
                    marginTop: 2,
                  }}
                >
                  20:00 mỗi tối
                </div>
              </div>
              <ToggleSwitch
                on={notify}
                onToggle={() => setNotify((v) => !v)}
                ariaLabel="Bật nhắc ôn tập"
              />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 13,
                minHeight: 58,
                padding: "12px 16px",
              }}
            >
              <span
                style={{
                  width: 38,
                  height: 38,
                  flex: "0 0 auto",
                  padding: 9,
                  borderRadius: 11,
                  background: "var(--accent-soft)",
                  color: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <RefreshCw size={20} strokeWidth={1.8} />
              </span>
              <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                <div
                  style={{
                    fontSize: ".98rem",
                    fontWeight: 500,
                    color: "var(--ink)",
                  }}
                >
                  Đồng bộ thiết bị
                </div>
              </div>
              <ToggleSwitch
                on={sync}
                onToggle={() => setSync((v) => !v)}
                ariaLabel="Bật đồng bộ thiết bị"
              />
            </div>

            <div
              role="group"
              aria-label="Ngôn ngữ — Tiếng Việt (chưa đổi được)"
              title="Đổi ngôn ngữ — sắp có"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 13,
                minHeight: 58,
                padding: "12px 16px",
                opacity: 0.85,
              }}
            >
              <span
                style={{
                  width: 38,
                  height: 38,
                  flex: "0 0 auto",
                  padding: 9,
                  borderRadius: 11,
                  background: "var(--accent-soft)",
                  color: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Globe size={20} strokeWidth={1.8} />
              </span>
              <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                <div
                  style={{
                    fontSize: ".98rem",
                    fontWeight: 500,
                    color: "var(--ink)",
                  }}
                >
                  Ngôn ngữ
                </div>
              </div>
              <span
                style={{
                  fontSize: ".9rem",
                  color: "var(--muted)",
                  whiteSpace: "nowrap",
                }}
              >
                Tiếng Việt
              </span>
              <ChevronRight
                size={20}
                style={{ color: "var(--faint)", flexShrink: 0 }}
                aria-hidden
              />
            </div>
          </section>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              width: "100%",
              height: 52,
              border: "1px solid var(--border)",
              background: "transparent",
              borderRadius: 15,
              cursor: "pointer",
              color: "var(--rose)",
              fontFamily: "var(--body)",
              fontWeight: 600,
              fontSize: ".95rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 9,
            }}
          >
            <LogOut size={18} strokeWidth={1.8} />
            Đăng xuất
          </button>
        </section>
      </div>
    </div>
  );
}