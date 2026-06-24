import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Flame,
  HelpCircle,
  NotebookPen,
  Play,
  Plus,
  Search,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useMediaQuery } from "../hooks/useMediaQuery";
import {
  getNote,
  getTags,
  search,
  type Note,
  type SearchResult,
} from "../api/notes";
import { DIFF, SUBJECTS, TAG_PALETTE } from "../components/PageProperties";

const DUE_COUNT = 0;
const CONTINUE_PROGRESS = 4 / 7;

const LEADER = [
  { rank: 1, av: "MP", name: "Nguyễn Minh Phương", pts: "1.240", top: true, me: false },
  { rank: 2, av: "TB", name: "Trần Thái Bảo", pts: "1.080", top: true, me: false },
  { rank: 3, av: "Hà", name: "Nguyễn Thu Hà", pts: "960", top: true, me: true },
  { rank: 4, av: "GH", name: "Lê Gia Hân", pts: "820", top: false, me: false },
] as const;

const STAT_TILES = [
  {
    icon: Flame,
    num: "12",
    unit: "ngày",
    label: "Chuỗi học",
    path: "/app/streak" as const,
  },
  { icon: NotebookPen, num: "24", unit: "bài", label: "Tổng số bài" },
  { icon: HelpCircle, num: "24", unit: "quiz", label: "Đã làm quiz" },
] as const;

function greetingPart(): string {
  const h = new Date().getHours();
  if (h < 12) return "sáng";
  if (h < 18) return "chiều";
  return "tối";
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2);
  return parts[0][0] + parts[parts.length - 1][0];
}

function formatRelativeTime(epoch: number): string {
  const diff = Math.max(0, Date.now() / 1000 - epoch);
  if (diff < 60) return "Vừa xong";
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return `${m} phút trước`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return `${h} giờ trước`;
  }
  if (diff < 172800) return "Hôm qua";
  const d = new Date(epoch * 1000);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function subjectMeta(subjectId: string | null | undefined): {
  color: string;
  label: string;
} {
  if (!subjectId) return { color: "var(--muted)", label: "Chưa phân loại" };
  const built = SUBJECTS[subjectId as keyof typeof SUBJECTS];
  if (built) return { color: built.color, label: built.label };
  const idx = parseInt(subjectId.replace(/^c/, ""), 10);
  const color = TAG_PALETTE[Number.isNaN(idx) ? 0 : idx % TAG_PALETTE.length];
  return { color, label: subjectId };
}

function diffMeta(difficulty: string | null | undefined): {
  label: string;
  style: CSSProperties;
} {
  if (!difficulty || !(difficulty in DIFF)) {
    return {
      label: "—",
      style: {
        fontSize: ".78rem",
        fontWeight: 600,
        padding: "4px 10px",
        borderRadius: 99,
        background: "var(--surface)",
        color: "var(--muted)",
      },
    };
  }
  const d = DIFF[difficulty as keyof typeof DIFF];
  return {
    label: d.label,
    style: {
      fontSize: ".78rem",
      fontWeight: 600,
      padding: "4px 10px",
      borderRadius: 99,
      background: d.bg,
      color: d.color,
    },
  };
}

function GoalRing({ pct, size = 92 }: { pct: number; size?: number }) {
  const sw = 9;
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--track)"
        strokeWidth={sw}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        style={{
          fontFamily: "var(--mono)",
          fontSize: "1.15rem",
          fontWeight: 600,
          fill: "var(--ink)",
        }}
      >
        5/7
      </text>
    </svg>
  );
}

type EnrichedNote = SearchResult & {
  subject: string | null;
  difficulty: string | null;
  excerpt: string | null;
};

type SearchBoxProps = {
  inputRef: RefObject<HTMLInputElement>;
  onSearch: (term: string) => void;
  activeTerm: string;
};

function SearchBox({ inputRef, onSearch, activeTerm }: SearchBoxProps) {
  const [term, setTerm] = useState(activeTerm);
  const [tags, setTags] = useState<string[]>([]);
  const [tagOpen, setTagOpen] = useState(false);

  useEffect(() => {
    setTerm(activeTerm);
  }, [activeTerm]);

  useEffect(() => {
    getTags()
      .then(setTags)
      .catch(() => setTags([]));
  }, []);

  const hashQuery =
    term.includes("#") && term.indexOf("#") === term.lastIndexOf("#")
      ? term.slice(term.indexOf("#") + 1).toLowerCase()
      : null;

  const filteredTags =
    hashQuery !== null
      ? tags.filter((t) => t.toLowerCase().startsWith(hashQuery))
      : [];

  const submit = (value: string) => {
    const v = value.trim();
    onSearch(v);
    setTagOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit(term);
    }
    if (e.key === "Escape") setTagOpen(false);
  };

  return (
    <div style={{ position: "relative", marginBottom: 26 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          height: 52,
          padding: "0 16px",
          background: "var(--paper)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          boxShadow: "var(--shadow)",
        }}
      >
        <Search size={20} color="var(--muted)" style={{ flexShrink: 0 }} />
        <input
          ref={inputRef}
          type="search"
          value={term}
          placeholder="Tìm bài học, #thẻ hoặc tags:tên"
          onChange={(e) => {
            setTerm(e.target.value);
            setTagOpen(e.target.value.includes("#"));
          }}
          onKeyDown={onKeyDown}
          onFocus={() => {
            if (term.includes("#")) setTagOpen(true);
          }}
          style={{
            flex: 1,
            minWidth: 0,
            border: "none",
            background: "none",
            fontFamily: "var(--body)",
            fontSize: "1rem",
            color: "var(--ink)",
            outline: "none",
          }}
        />
      </div>
      {tagOpen && filteredTags.length > 0 && (
        <div
          className="sm-fade"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "calc(100% + 8px)",
            zIndex: 20,
            background: "var(--paper)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            boxShadow: "var(--shadow-lift)",
            padding: 6,
            maxHeight: 220,
            overflow: "auto",
          }}
        >
          {filteredTags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                const next = `#${t}`;
                setTerm(next);
                submit(next);
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "10px 12px",
                border: "none",
                borderRadius: 11,
                background: "transparent",
                cursor: "pointer",
                fontFamily: "var(--body)",
                fontSize: ".9rem",
                color: "var(--ink)",
              }}
            >
              #{t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NoteRow({
  item,
  onClick,
}: {
  item: EnrichedNote;
  onClick: () => void;
}) {
  const sub = subjectMeta(item.subject);
  const diff = diffMeta(item.difficulty);
  const titleStyle: CSSProperties = {
    fontFamily: "var(--display)",
    fontSize: "1.08rem",
    fontWeight: 600,
    letterSpacing: "-.01em",
    marginTop: 10,
    lineHeight: 1.3,
    color: "var(--ink)",
  };
  const excerptStyle: CSSProperties = {
    color: "var(--muted)",
    fontSize: ".92rem",
    lineHeight: 1.5,
    marginTop: 6,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        position: "relative",
        background: "var(--paper)",
        border: "1px solid var(--border)",
        borderRadius: 20,
        padding: "16px 18px 16px 20px",
        boxShadow: "var(--shadow)",
        cursor: "pointer",
        transition: "transform .25s cubic-bezier(.22,.61,.36,1), box-shadow .25s ease",
      }}
    >
      <span
        style={{
          position: "absolute",
          left: 0,
          top: 16,
          bottom: 16,
          width: 3,
          borderRadius: 99,
          background: sub.color,
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: ".78rem",
            fontWeight: 600,
            color: sub.color,
          }}
        >
          <i
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: sub.color,
            }}
          />
          {sub.label}
        </span>
      </div>
      {item.titleHighlights ? (
        <h4
          style={titleStyle}
          dangerouslySetInnerHTML={{ __html: item.titleHighlights }}
        />
      ) : (
        <h4 style={titleStyle}>{item.title}</h4>
      )}
      {item.contentHighlights ? (
        <p
          style={excerptStyle}
          dangerouslySetInnerHTML={{ __html: item.contentHighlights }}
        />
      ) : item.excerpt ? (
        <p style={excerptStyle}>{item.excerpt}</p>
      ) : null}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 14,
        }}
      >
        <span style={diff.style}>#{diff.label}</span>
        <span style={{ fontSize: ".8rem", color: "var(--muted)" }}>
          {formatRelativeTime(item.lastModified)}
        </span>
      </div>
    </article>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery("(min-width: 961px)");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [recent, setRecent] = useState<EnrichedNote[]>([]);
  const [results, setResults] = useState<EnrichedNote[] | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [tagChips, setTagChips] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [continueNote, setContinueNote] = useState<Note | null>(null);

  const enrich = useCallback(async (rows: SearchResult[]): Promise<EnrichedNote[]> => {
    const notes = await Promise.all(
      rows.map(async (r) => {
        try {
          const n = await getNote(r.title);
          const text = blocksToPlain(n.content);
          const excerpt =
            text.length > 120 ? `${text.slice(0, 120).trim()}…` : text || null;
          return {
            ...r,
            subject: n.subject,
            difficulty: n.difficulty,
            excerpt,
          };
        } catch {
          return { ...r, subject: null, difficulty: null, excerpt: null };
        }
      }),
    );
    return notes;
  }, []);

  const loadRecent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await search({ term: "*", sort: "lastModified", order: "desc" });
      const enriched = await enrich(rows);
      setRecent(enriched);
      if (enriched.length > 0) {
        try {
          const full = await getNote(enriched[0].title);
          setContinueNote(full);
        } catch {
          setContinueNote(null);
        }
      } else {
        setContinueNote(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được bài học");
      setRecent([]);
      setContinueNote(null);
    } finally {
      setLoading(false);
    }
  }, [enrich]);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      ) {
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const runSearch = async (term: string) => {
    setSearchTerm(term);
    if (!term) {
      setResults(null);
      setTagChips([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await search({ term, sort: "score", order: "desc" });
      const enriched = await enrich(rows);
      setResults(enriched);
      const chips = new Set<string>();
      for (const r of rows) {
        if (r.tagMatches) r.tagMatches.forEach((t) => chips.add(t));
      }
      setTagChips([...chips]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tìm kiếm thất bại");
      setResults([]);
      setTagChips([]);
    } finally {
      setLoading(false);
    }
  };

  const displayList = results !== null ? results : recent;
  const searchActive = results !== null;
  const showFullEmpty =
    !loading && !error && recent.length === 0 && !searchActive;
  const showNoMatch =
    !loading && searchActive && displayList.length === 0;

  const name = user?.name ?? "bạn";
  const dashGridStyle: CSSProperties = isDesktop
    ? {
        display: "grid",
        gridTemplateColumns: "1fr 320px",
        gap: 24,
        alignItems: "start",
      }
    : { display: "flex", flexDirection: "column", gap: 24 };

  const dashAsideStyle: CSSProperties = isDesktop
    ? { display: "flex", flexDirection: "column", gap: 14 }
    : {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 14,
        order: -1,
      };

  const continueSub = continueNote
    ? subjectMeta(continueNote.subject)
    : { color: "var(--accent)", label: "" };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--canvas)",
        padding: isDesktop ? "34px 40px 60px" : "18px 18px 28px",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto", width: "100%" }}>
        {showFullEmpty ? (
          <section className="sm-fade" style={{ display: "flex", flexDirection: "column", minHeight: "60vh" }}>
            <header
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 18,
                marginBottom: 14,
              }}
            >
              <div>
                <h2
                  style={{
                    fontFamily: "var(--display)",
                    fontWeight: 600,
                    fontSize: "2rem",
                    letterSpacing: "-.02em",
                    margin: 0,
                  }}
                >
                  Xin chào, {name}
                </h2>
                <p style={{ color: "var(--muted)", fontSize: "1rem", marginTop: 6 }}>
                  Sổ tay học tập của bạn
                </p>
              </div>
              <span
                style={{
                  flex: "0 0 auto",
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  background: "var(--accent-soft)",
                  color: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                  border: "1px solid var(--border)",
                }}
              >
                {initials(name)}
              </span>
            </header>
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: "40px 24px",
              }}
            >
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 28,
                  background: "var(--accent-tint)",
                  border: "1px dashed var(--accent)",
                  marginBottom: 8,
                }}
              />
              <h2
                style={{
                  fontFamily: "var(--display)",
                  fontWeight: 600,
                  fontSize: "1.85rem",
                  letterSpacing: "-.02em",
                  lineHeight: 1.2,
                  marginTop: 30,
                  maxWidth: "18ch",
                  textWrap: "balance",
                }}
              >
                Bắt đầu bài học đầu tiên của bạn
              </h2>
              <p
                style={{
                  fontSize: "1rem",
                  lineHeight: 1.6,
                  color: "var(--muted)",
                  maxWidth: "34ch",
                  marginTop: 14,
                }}
              >
                Ghi lại kiến thức ngay khi học, để mùa thi không còn vội vã.
              </p>
              <button
                type="button"
                onClick={() => navigate("/app/new")}
                style={{
                  marginTop: 30,
                  height: 52,
                  padding: "0 28px",
                  border: "none",
                  cursor: "pointer",
                  background: "var(--accent)",
                  color: "#fff",
                  borderRadius: 16,
                  boxShadow: "var(--coral-glow)",
                  fontFamily: "var(--body)",
                  fontWeight: 600,
                  fontSize: "1rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 9,
                }}
              >
                <Plus size={19} /> Thêm bài học
              </button>
            </div>
          </section>
        ) : (
          <section className="sm-fade">
            <header
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 18,
                marginBottom: 30,
              }}
            >
              <div>
                <h2
                  style={{
                    fontFamily: "var(--display)",
                    fontWeight: 600,
                    fontSize: "2.3rem",
                    letterSpacing: "-.02em",
                    lineHeight: 1.05,
                    margin: 0,
                  }}
                >
                  Chào buổi {greetingPart()}, {name}
                </h2>
                <p style={{ color: "var(--muted)", fontSize: "1.05rem", marginTop: 10 }}>
                  Bạn còn{" "}
                  <b style={{ color: "var(--accent)", fontWeight: 600 }}>
                    {DUE_COUNT} bài
                  </b>{" "}
                  cần ôn hôm nay
                </p>
              </div>
              <span
                style={{
                  flex: "0 0 auto",
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "var(--accent-soft)",
                  color: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                  fontSize: "1.05rem",
                  border: "1px solid var(--border)",
                }}
              >
                {initials(name)}
              </span>
            </header>

            <SearchBox
              inputRef={searchInputRef}
              onSearch={runSearch}
              activeTerm={searchTerm}
            />

            {error ? (
              <p style={{ color: "var(--rose)", marginBottom: 16, fontSize: ".92rem" }}>
                {error}
              </p>
            ) : null}

            {tagChips.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 18,
                }}
              >
                {tagChips.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => runSearch(`tags:${t}`)}
                    style={{
                      height: 32,
                      padding: "0 12px",
                      borderRadius: 99,
                      border: "1px solid var(--border)",
                      background: "var(--paper)",
                      cursor: "pointer",
                      fontFamily: "var(--body)",
                      fontSize: ".82rem",
                      fontWeight: 500,
                      color: "var(--accent)",
                    }}
                  >
                    #{t}
                  </button>
                ))}
              </div>
            ) : null}

            <div style={dashGridStyle}>
              <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                {continueNote && !searchActive ? (
                  <section
                    style={{
                      background: "var(--paper)",
                      border: "1px solid var(--border)",
                      borderRadius: 24,
                      padding: "24px 24px 22px",
                      boxShadow: "var(--shadow)",
                      marginBottom: 24,
                      position: "relative",
                      overflow: "hidden",
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
                    <span
                      style={{
                        position: "relative",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 7,
                        fontSize: ".72rem",
                        fontWeight: 700,
                        letterSpacing: ".08em",
                        textTransform: "uppercase",
                        color: "var(--accent)",
                        marginBottom: 14,
                      }}
                    >
                      <Play size={15} /> Tiếp tục học
                    </span>
                    <h3
                      style={{
                        position: "relative",
                        fontFamily: "var(--display)",
                        fontWeight: 600,
                        fontSize: "1.7rem",
                        letterSpacing: "-.02em",
                        lineHeight: 1.15,
                        margin: 0,
                      }}
                    >
                      {continueNote.title}
                    </h3>
                    <p
                      style={{
                        position: "relative",
                        color: "var(--muted)",
                        fontSize: "1rem",
                        marginTop: 8,
                        lineHeight: 1.55,
                        maxWidth: "62ch",
                      }}
                    >
                      {continueSub.label
                        ? `Môn ${continueSub.label} · tiếp tục chỉnh sửa bài học gần nhất.`
                        : "Tiếp tục chỉnh sửa bài học gần nhất."}
                    </p>
                    <div
                      style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        gap: 18,
                        marginTop: 22,
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ flex: "1 1 240px", minWidth: 200 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontSize: ".8rem",
                            color: "var(--muted)",
                            marginBottom: 8,
                          }}
                        >
                          <span>Tiến độ</span>
                          <span
                            style={{
                              fontFamily: "var(--mono)",
                              color: "var(--accent)",
                              fontWeight: 600,
                            }}
                          >
                            4/7 mục
                          </span>
                        </div>
                        <div
                          style={{
                            height: 7,
                            borderRadius: 99,
                            background: "var(--track)",
                            overflow: "hidden",
                          }}
                        >
                          <i
                            style={{
                              display: "block",
                              height: "100%",
                              width: `${Math.round(CONTINUE_PROGRESS * 100)}%`,
                              borderRadius: 99,
                              background: "var(--accent)",
                            }}
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/app/notes/${encodeURIComponent(continueNote.title)}`,
                          )
                        }
                        style={{
                          flex: "0 0 auto",
                          height: 48,
                          padding: "0 22px",
                          border: "none",
                          cursor: "pointer",
                          background: "var(--accent)",
                          color: "#fff",
                          borderRadius: 14,
                          boxShadow: "var(--coral-glow)",
                          fontFamily: "var(--body)",
                          fontWeight: 600,
                          fontSize: ".95rem",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        Tiếp tục <ArrowRight size={18} />
                      </button>
                    </div>
                  </section>
                ) : null}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    margin: "0 2px 16px",
                    flexWrap: "wrap",
                  }}
                >
                  <h3
                    style={{
                      fontFamily: "var(--display)",
                      fontWeight: 600,
                      fontSize: "1.25rem",
                      letterSpacing: "-.01em",
                      margin: 0,
                    }}
                  >
                    {searchActive ? "Kết quả tìm kiếm" : "Bài học gần đây"}
                  </h3>
                  {searchActive ? (
                    <button
                      type="button"
                      onClick={() => runSearch("")}
                      style={{
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        fontSize: ".85rem",
                        color: "var(--accent)",
                        fontFamily: "var(--body)",
                        fontWeight: 500,
                      }}
                    >
                      Xóa tìm kiếm
                    </button>
                  ) : null}
                </div>

                {loading ? (
                  <p style={{ color: "var(--muted)", fontSize: ".92rem" }}>
                    Đang tải…
                  </p>
                ) : (
                  <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {displayList.map((n) => (
                      <NoteRow
                        key={n.title}
                        item={n}
                        onClick={() =>
                          navigate(`/app/notes/${encodeURIComponent(n.title)}`)
                        }
                      />
                    ))}
                  </section>
                )}

                {showNoMatch ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "38px 16px",
                      color: "var(--muted)",
                      fontSize: ".92rem",
                    }}
                  >
                    Không có bài học nào phù hợp.
                  </div>
                ) : null}
              </div>

              <aside style={dashAsideStyle}>
                {STAT_TILES.map((t) => {
                  const Icon = t.icon;
                  const tileStyle: CSSProperties = {
                    background: "var(--paper)",
                    border: "1px solid var(--border)",
                    borderRadius: 20,
                    padding: "16px 16px",
                    boxShadow: "var(--shadow)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 9,
                    textAlign: "left",
                    fontFamily: "var(--body)",
                  };
                  const body = (
                    <>
                      <Icon size={20} color="var(--accent)" />
                      <span
                        style={{
                          fontFamily: "var(--mono)",
                          fontWeight: 600,
                          color: "var(--ink)",
                          lineHeight: 1,
                          marginTop: 4,
                        }}
                      >
                        <span style={{ fontSize: "1.7rem", letterSpacing: "-.01em" }}>
                          {t.num}
                        </span>
                        <span
                          style={{
                            fontSize: ".8rem",
                            color: "var(--muted)",
                            marginLeft: 4,
                          }}
                        >
                          {t.unit}
                        </span>
                      </span>
                      <span
                        style={{
                          fontSize: ".78rem",
                          color: "var(--muted)",
                          fontWeight: 500,
                        }}
                      >
                        {t.label}
                      </span>
                    </>
                  );
                  if ("path" in t && t.path) {
                    return (
                      <button
                        key={t.label}
                        type="button"
                        onClick={() => navigate(t.path)}
                        style={{
                          ...tileStyle,
                          cursor: "pointer",
                          border: "1px solid var(--border)",
                          width: "100%",
                        }}
                      >
                        {body}
                      </button>
                    );
                  }
                  return (
                    <div key={t.label} style={tileStyle}>
                      {body}
                    </div>
                  );
                })}
                <div
                  style={{
                    background: "var(--paper)",
                    border: "1px solid var(--border)",
                    borderRadius: 20,
                    padding: "20px 18px",
                    boxShadow: "var(--shadow)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12,
                    gridColumn: isDesktop ? undefined : "1 / -1",
                  }}
                >
                  <span
                    style={{
                      fontSize: ".72rem",
                      fontWeight: 700,
                      letterSpacing: ".08em",
                      textTransform: "uppercase",
                      color: "var(--muted)",
                      alignSelf: "flex-start",
                    }}
                  >
                    Mục tiêu tuần
                  </span>
                  <GoalRing pct={5 / 7} />
                  <span style={{ fontSize: ".82rem", color: "var(--muted)" }}>
                    5 / 7 bài đã ôn
                  </span>
                </div>
                <section
                  style={{
                    gridColumn: "1 / -1",
                    background: "var(--paper)",
                    border: "1px solid var(--border)",
                    borderRadius: 20,
                    boxShadow: "var(--shadow)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      padding: "15px 16px 9px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: ".72rem",
                        fontWeight: 700,
                        letterSpacing: ".08em",
                        textTransform: "uppercase",
                        color: "var(--muted)",
                      }}
                    >
                      Bảng xếp hạng
                    </span>
                    <button
                      type="button"
                      style={{
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        fontSize: ".8rem",
                        fontWeight: 500,
                        color: "var(--accent)",
                        fontFamily: "var(--body)",
                      }}
                    >
                      Xem tất cả
                    </button>
                  </div>
                  {LEADER.map((l) => (
                    <div
                      key={l.rank}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        minHeight: 52,
                        padding: "10px 16px",
                        background: l.me ? "var(--accent-tint)" : "transparent",
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
                          fontWeight: l.me ? 600 : 500,
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
                          color: l.me ? "var(--accent)" : "var(--ink)",
                        }}
                      >
                        {l.pts}
                      </span>
                    </div>
                  ))}
                </section>
              </aside>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function blocksToPlain(content: unknown[]): string {
  const parts: string[] = [];
  const walk = (blocks: unknown[]) => {
    for (const block of blocks) {
      if (!block || typeof block !== "object") continue;
      const b = block as { type?: string; content?: unknown[]; children?: unknown[] };
      if (b.type === "code") continue;
      if (Array.isArray(b.content)) {
        for (const inline of b.content) {
          if (inline && typeof inline === "object" && "text" in inline) {
            const t = (inline as { text?: string }).text;
            if (typeof t === "string") parts.push(t);
          }
        }
      }
      if (Array.isArray(b.children)) walk(b.children);
    }
  };
  walk(content);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}