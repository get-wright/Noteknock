import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  CalendarCheck,
  ChevronDown,
  Flame,
  ListChecks,
  Moon,
  NotebookPen,
  Sparkles,
  Sun,
} from "lucide-react";
import { motion, useReducedMotion, useInView, animate } from "motion/react";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../hooks/useTheme";

const HEADLINE = "Học chậm lại, nhớ lâu hơn.";
const HEADLINE_WORDS = HEADLINE.split(" ");

const STATS = [
  { label: "Ghi chú đã tạo", value: 12500, suffix: "k", display: "12.5k" },
  { label: "Quiz đã làm", value: 48000, suffix: "k", display: "48k" },
  { label: "Ngày streak", value: 7, suffix: "", display: "7" },
] as const;

const BENTO_FEATURES = [
  {
    key: "notes",
    className: "sm-bento-feature coral",
    icon: NotebookPen,
    title: "Ghi chú thông minh",
    desc: "Soạn bài học với trình soạn thảo kiểu block, gắn thẻ chủ đề và độ khó.",
  },
  {
    key: "quiz",
    className: "sm-bento-feature amber",
    icon: ListChecks,
    title: "Quiz tự động",
    desc: "Sinh câu hỏi trắc nghiệm từ nội dung bài ghi — ôn nhanh, nhớ lâu.",
  },
  {
    key: "review",
    className: "sm-bento-feature green",
    icon: CalendarCheck,
    title: "Ôn tập đúng lịch",
    desc: "Lịch ôn theo spaced repetition, biết hôm nay cần xem lại bài nào.",
  },
  {
    key: "streak",
    className: "sm-bento-feature rose",
    icon: Flame,
    title: "Theo dõi streak",
    desc: "Heatmap hoạt động, chuỗi ngày học và tiến bộ theo thời gian.",
  },
] as const;

const STEPS = [
  {
    n: "01",
    title: "Viết bài học",
    desc: "Ghi chú có cấu trúc, thẻ môn và độ khó ngay trên trang.",
  },
  {
    n: "02",
    title: "Làm quiz",
    desc: "Tạo quiz từ bài ghi và lưu điểm để theo dõi tiến bộ.",
  },
  {
    n: "03",
    title: "Ôn đúng lịch",
    desc: "Đánh dấu đã ôn — StudyMap nhắc bạn quay lại đúng lúc.",
  },
] as const;

const springHover = { type: "spring" as const, stiffness: 120, damping: 18 };

function revealProps(reduced: boolean) {
  if (reduced) {
    return { initial: { opacity: 1, y: 0 }, whileInView: { opacity: 1, y: 0 } };
  }
  return {
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.3 },
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  };
}

function StatCounter({
  target,
  display,
  reduced,
}: {
  target: number;
  display: string;
  reduced: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => {
    if (!inView || !ref.current) return;
    if (reduced) {
      ref.current.textContent = display;
      return;
    }
    const controls = animate(0, target, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1] as const,
      onUpdate: (v) => {
        if (!ref.current) return;
        if (target >= 1000) {
          const k = v / 1000;
          ref.current.textContent =
            k >= 10 ? `${Math.round(k)}k` : `${(k).toFixed(1)}k`;
        } else {
          ref.current.textContent = String(Math.round(v));
        }
      },
    });
    return () => controls.stop();
  }, [inView, target, display, reduced]);

  return (
    <span ref={ref} className="sm-stat-value">
      {reduced ? display : "0"}
    </span>
  );
}

function ThemeToggleButton() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      aria-label="Đổi giao diện"
      onClick={toggle}
      className="sm-btn sm-btn-secondary"
      style={{
        position: "absolute",
        top: "1.25rem",
        right: "1.25rem",
        width: 44,
        height: 44,
        padding: 0,
        zIndex: 10,
      }}
    >
      {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );
}

export default function Landing() {
  const { token } = useAuth();
  const reduced = useReducedMotion() ?? false;

  const wordStagger = reduced
    ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 } }
    : {
        initial: { opacity: 0, y: 18 },
        animate: { opacity: 1, y: 0 },
      };

  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)" }}>
      <section className="sm-hero">
        <ThemeToggleButton />
        <div className="sm-hero-grid">
          <div className="sm-hero-copy">
            <motion.div
              className="sm-hero-eyebrow"
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <Sparkles size={14} aria-hidden />
              Sổ tay học tập
            </motion.div>

            <h1 className="sm-hero-headline">
              {HEADLINE_WORDS.map((word, i) => (
                <motion.span
                  key={`${word}-${i}`}
                  style={{ display: "inline-block", marginRight: "0.28em" }}
                  {...wordStagger}
                  transition={
                    reduced
                      ? undefined
                      : { delay: 0.08 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] }
                  }
                >
                  {word}
                </motion.span>
              ))}
            </h1>

            <motion.p
              className="sm-hero-sub"
              initial={reduced ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduced ? 0 : 0.45, duration: 0.5 }}
            >
              Ghi chú, quiz và ôn tập theo lịch ghi nhớ — nhẹ nhàng trước mỗi kỳ
              thi.
            </motion.p>

            <motion.div
              className="sm-hero-ctas"
              initial={reduced ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduced ? 0 : 0.55, duration: 0.5 }}
            >
              {token ? (
                <motion.div
                  whileHover={reduced ? undefined : { y: -6, scale: 1.02 }}
                  transition={springHover}
                >
                  <Link to="/app" className="sm-btn sm-btn-primary">
                    Vào ứng dụng
                  </Link>
                </motion.div>
              ) : (
                <>
                  <motion.div
                    whileHover={reduced ? undefined : { y: -6, scale: 1.02 }}
                    transition={springHover}
                  >
                    <Link to="/register" className="sm-btn sm-btn-primary">
                      Bắt đầu ngay
                    </Link>
                  </motion.div>
                  <motion.div
                    whileHover={reduced ? undefined : { y: -6, scale: 1.02 }}
                    transition={springHover}
                  >
                    <Link to="/login" className="sm-btn sm-btn-secondary">
                      Đăng nhập
                    </Link>
                  </motion.div>
                </>
              )}
            </motion.div>
          </div>

          <div className="sm-hero-visual">
            <div className="sm-hero-glow" aria-hidden />
            <motion.div
              className="sm-bento-cluster"
              initial={reduced ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: reduced ? 0 : 0.35, duration: 0.65 }}
            >
              <motion.div
                className="sm-bento-card"
                whileHover={reduced ? undefined : { y: -6, rotate: -1 }}
                transition={springHover}
              >
                <p className="sm-bento-card-title">Tích phân từng phần</p>
                <p className="sm-bento-card-meta">Toán · #ôn-thi</p>
              </motion.div>
              <motion.div
                className="sm-bento-card"
                whileHover={reduced ? undefined : { y: -8, x: 4 }}
                transition={springHover}
              >
                <p className="sm-bento-card-title">8/10</p>
                <p className="sm-bento-card-meta">Quiz · vừa xong</p>
              </motion.div>
              <motion.div
                className="sm-bento-card"
                whileHover={reduced ? undefined : { y: -6, x: -4 }}
                transition={springHover}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <Flame size={22} color="var(--accent)" aria-hidden />
                <div>
                  <p className="sm-bento-card-title" style={{ margin: 0 }}>
                    7 ngày
                  </p>
                  <p className="sm-bento-card-meta">Streak</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
        <ChevronDown className="sm-scroll-hint" size={28} aria-hidden />
      </section>

      <motion.section
        className="sm-stats"
        {...revealProps(reduced)}
      >
        <div className="sm-stats-grid">
          {STATS.map((stat) => (
            <motion.div
              key={stat.label}
              className="sm-stat"
              whileHover={reduced ? undefined : { y: -6, scale: 1.02 }}
              transition={springHover}
            >
              <StatCounter
                target={stat.value}
                display={stat.display}
                reduced={reduced}
              />
              <p className="sm-stat-label">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <section className="sm-features">
        <motion.div className="sm-section-head" {...revealProps(reduced)}>
          <h2>Mọi thứ trong một sổ tay</h2>
          <p>Ghi chú, quiz, ôn tập và streak — không cần nhảy qua nhiều app.</p>
        </motion.div>
        <div className="sm-bento-grid">
          {BENTO_FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <motion.article
                key={f.key}
                className={f.className}
                {...revealProps(reduced)}
                whileHover={reduced ? undefined : { y: -6, scale: 1.02 }}
                transition={springHover}
              >
                <div>
                  <div className="sm-bento-icon" aria-hidden>
                    <Icon size={24} strokeWidth={2} />
                  </div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>

      <motion.section className="sm-steps" {...revealProps(reduced)}>
        <div className="sm-section-head">
          <h2>Cách StudyMap hoạt động</h2>
          <p>Ba bước đơn giản từ bài ghi đến nhớ lâu.</p>
        </div>
        <div className="sm-steps-grid">
          {STEPS.map((step) => (
            <motion.div
              key={step.n}
              className="sm-step"
              {...revealProps(reduced)}
              whileHover={reduced ? undefined : { y: -6, scale: 1.02 }}
              transition={springHover}
            >
              <div className="sm-step-number">{step.n}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section
        className="sm-cta-final"
        {...revealProps(reduced)}
      >
        <h2>Sẵn sàng học chậm lại?</h2>
        <p>Tạo tài khoản miễn phí và bắt đầu sổ tay đầu tiên hôm nay.</p>
        <motion.div
          whileHover={reduced ? undefined : { y: -6, scale: 1.02 }}
          transition={springHover}
          style={{ display: "inline-block" }}
        >
          <Link
            to={token ? "/app" : "/register"}
            className="sm-btn sm-btn-primary"
          >
            {token ? "Vào ứng dụng" : "Bắt đầu ngay"}
          </Link>
        </motion.div>
      </motion.section>

      <motion.footer className="sm-footer" {...revealProps(reduced)}>
        <div className="sm-footer-inner">
          <div className="sm-footer-brand">
            <span>S</span>
            StudyMap
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <FooterThemeToggle />
            {token ? (
              <Link
                to="/app"
                style={{ color: "var(--accent)", fontWeight: 600 }}
              >
                Vào ứng dụng
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  style={{ color: "var(--muted)", fontWeight: 600 }}
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  style={{ color: "var(--accent)", fontWeight: 600 }}
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.footer>
    </div>
  );
}

function FooterThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      aria-label="Đổi giao diện"
      onClick={toggle}
      className="sm-btn sm-btn-secondary"
      style={{ width: 40, height: 40, padding: 0 }}
    >
      {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}