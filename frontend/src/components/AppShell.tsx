import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Flame,
  Home,
  Moon,
  Plus,
  RefreshCcw,
  Sun,
  User,
} from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import "./AppShell.css";

const navItems = [
  { to: "/app", label: "Tổng quan", icon: Home, end: true },
  { to: "/app/review", label: "Ôn tập", icon: RefreshCcw },
  { to: "/app/streak", label: "Streak", icon: Flame },
  { to: "/app/profile", label: "Hồ sơ", icon: User },
];

export default function AppShell() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  return (
    <div className="sm-shell">
      <aside className="sm-sidebar" aria-label="Điều hướng StudyMap">
        <button className="sm-brand" type="button" onClick={() => navigate("/app")}> 
          <span className="sm-brand-tile">S</span>
          <span>
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
              className={({ isActive }) => `sm-side-link${isActive ? " is-active" : ""}`}
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button className="sm-new-lesson" type="button" onClick={() => navigate("/app/new")}>
          <Plus size={18} />
          Bài học mới
        </button>

        <div className="sm-sidebar-spacer" />

        <div className="sm-streak-pill">
          <span className="sm-flame-dot"><Flame size={15} /></span>
          <span>Giữ nhịp hôm nay</span>
        </div>

        <button className="sm-theme-toggle" type="button" onClick={toggle}>
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          <span>{theme === "light" ? "Tối" : "Sáng"}</span>
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
            className={({ isActive }) => `sm-bottom-link${isActive ? " is-active" : ""}`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <button className="sm-mobile-fab" type="button" onClick={() => navigate("/app/new")}>
        <Plus size={22} />
      </button>
    </div>
  );
}
