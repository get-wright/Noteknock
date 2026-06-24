import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Home,
  Moon,
  Plus,
  RefreshCcw,
  Sun,
  User,
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "../hooks/useTheme";
import "./AppShell.css";

const navItems = [
  { to: "/app", label: "Tổng quan", icon: Home, end: true },
  { to: "/app/review", label: "Ôn tập", icon: RefreshCcw },
  { to: "/app/streak", label: "Streak", icon: Flame },
  { to: "/app/profile", label: "Hồ sơ", icon: User },
];

const SIDEBAR_STORAGE_KEY = "noteknock.sidebarCollapsed";

export default function AppShell() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
  });

  const toggleSidebar = () => {
    setSidebarCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  };

  return (
    <div
      className={`sm-shell${sidebarCollapsed ? " is-sidebar-collapsed" : ""}`}
    >
      <aside className="sm-sidebar" aria-label="Điều hướng StudyMap">
        <button
          className="sm-sidebar-collapse"
          type="button"
          aria-label={
            sidebarCollapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"
          }
          title={sidebarCollapsed ? "Mở rộng" : "Thu gọn"}
          onClick={toggleSidebar}
        >
          {sidebarCollapsed ? (
            <ChevronRight size={18} />
          ) : (
            <ChevronLeft size={18} />
          )}
        </button>

        <button className="sm-brand" type="button" onClick={() => navigate("/app")}>
          <span className="sm-brand-tile">S</span>
          <span className="sm-brand-copy">
            <span className="sm-brand-name">StudyMap</span>
            <span className="sm-brand-sub">Học chậm, nhớ lâu</span>
          </span>
        </button>

        <nav className="sm-side-nav">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `sm-side-link${isActive ? " is-active" : ""}`
              }
              title={label}
            >
              <Icon size={19} />
              <span className="sm-sidebar-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        <button
          className="sm-new-lesson"
          type="button"
          title="Bài học mới"
          onClick={() => navigate("/app/new")}
        >
          <Plus size={18} />
          <span className="sm-sidebar-label">Bài học mới</span>
        </button>

        <div className="sm-sidebar-spacer" />

        <div className="sm-streak-pill">
          <span className="sm-flame-dot"><Flame size={15} /></span>
          <span className="sm-sidebar-label">Giữ nhịp hôm nay</span>
        </div>

        <button className="sm-theme-toggle" type="button" onClick={toggle}>
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          <span className="sm-sidebar-label">
            {theme === "light" ? "Tối" : "Sáng"}
          </span>
        </button>
      </aside>

      <main className="sm-shell-main">
        <Outlet />
      </main>

      <nav className="sm-bottom-tabs" aria-label="Điều hướng StudyMap di động">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `sm-bottom-link${isActive ? " is-active" : ""}`
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <button
        className="sm-mobile-fab"
        type="button"
        onClick={() => navigate("/app/new")}
      >
        <Plus size={22} />
      </button>
    </div>
  );
}
