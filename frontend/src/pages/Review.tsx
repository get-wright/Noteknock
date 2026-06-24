import {
  ArrowLeft,
  ChevronRight,
  Play,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Ref,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  createReviewEvent,
  getDueReviews,
  type ReviewDue,
} from "../api/activity";
import { SUBJECTS, TAG_PALETTE } from "../components/PageProperties";

const REVIEW_INTERVAL_DAYS: Record<number, number> = {
  0: 0,
  1: 1,
  2: 3,
  3: 7,
};

type SoonItem = {
  key: string;
  title: string;
  subject: string | null;
  when: string;
};

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

function formatLastReviewed(epoch: number | null): string {
  if (epoch === null) return "Chưa ôn lần nào";
  const diff = Math.max(0, Date.now() / 1000 - epoch);
  if (diff < 3600) return "Ôn lần cuối vừa xong";
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return `Ôn lần cuối ${h} giờ trước`;
  }
  if (diff < 604800) {
    const d = Math.floor(diff / 86400);
    return `Ôn lần cuối ${d} ngày trước`;
  }
  const w = Math.floor(diff / 604800);
  return `Ôn lần cuối ${w} tuần trước`;
}

function defaultStrengthFor(item: ReviewDue): number {
  const s = item.strength;
  if (s < 0) return 1;
  if (s >= 3) return 3;
  return s + 1;
}

function strengthBars(strength: number): boolean[] {
  const filled = Math.min(3, Math.max(0, strength));
  return [0, 1, 2].map((i) => i < filled);
}

function soonLabel(strength: number): string {
  const days = REVIEW_INTERVAL_DAYS[strength] ?? 1;
  if (days <= 0) return "Sau hôm nay";
  if (days === 1) return "Sau 1 ngày";
  return `Sau ${days} ngày`;
}

function ReviewRing({
  done,
  total,
  size = 64,
}: {
  done: number;
  total: number;
  size?: number;
}) {
  const sw = 6;
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? done / total : 0;
  const offset = c * (1 - pct);
  const label = total > 0 ? `${done}/${total}` : "0";

  return (
    <div
      className="sm-pulse"
      style={{ position: "relative", width: size, height: size, flexShrink: 0 }}
    >
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
      </svg>
      <span
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--mono)",
          fontSize: ".85rem",
          fontWeight: 600,
          color: "var(--accent)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function StrengthPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <span
      role="radiogroup"
      aria-label="Độ nhớ ghi nhận"
      style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
    >
      {[1, 2, 3].map((s) => {
        const on = value === s;
        return (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={on}
            aria-pressed={on}
            aria-label={`Độ nhớ ${s}`}
            onClick={(e) => {
              e.stopPropagation();
              onChange(s);
            }}
            style={{
              height: 28,
              padding: "0 10px",
              borderRadius: 99,
              border: `1px solid ${on ? "var(--accent)" : "var(--border)"}`,
              background: on ? "var(--accent-soft)" : "var(--paper)",
              color: on ? "var(--accent)" : "var(--muted)",
              fontFamily: "var(--mono)",
              fontSize: ".72rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {s}
          </button>
        );
      })}
    </span>
  );
}

function DueCard({
  item,
  strengthPick,
  onStrengthChange,
  onReview,
  onOpen,
  reviewing,
  cardRef,
}: {
  item: ReviewDue;
  strengthPick: number;
  onStrengthChange: (v: number) => void;
  onReview: () => void;
  onOpen: () => void;
  reviewing: boolean;
  cardRef?: Ref<HTMLElement>;
}) {
  const sub = subjectMeta(item.subject);
  const bars = strengthBars(item.strength);

  return (
    <article
      ref={cardRef}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "stretch",
        gap: 13,
        background: "var(--paper)",
        border: "1px solid var(--border)",
        borderRadius: 18,
        padding: "15px 16px 15px 20px",
        boxShadow: "var(--shadow)",
      }}
    >
      <span
        style={{
          position: "absolute",
          left: 0,
          top: 14,
          bottom: 14,
          width: 3,
          borderRadius: 99,
          background: sub.color,
        }}
      />
      <div style={{ flex: "1 1 auto", minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            marginBottom: 6,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: ".74rem",
              fontWeight: 600,
              color: sub.color,
            }}
          >
            <i
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: sub.color,
              }}
            />
            {sub.label}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: ".72rem", color: "var(--faint)" }}>
              Độ nhớ
            </span>
            <span style={{ display: "inline-flex", gap: 3 }}>
              {bars.map((on, i) => (
                <i
                  key={i}
                  style={{
                    width: 13,
                    height: 5,
                    borderRadius: 3,
                    background: on ? "var(--accent)" : "var(--track)",
                    display: "block",
                  }}
                />
              ))}
            </span>
          </span>
        </div>
        <h4
          style={{
            fontSize: "1.02rem",
            fontWeight: 600,
            letterSpacing: "-.01em",
            lineHeight: 1.3,
            margin: 0,
            color: "var(--ink)",
          }}
        >
          {item.title}
        </h4>
        <div style={{ fontSize: ".78rem", color: "var(--muted)", marginTop: 8 }}>
          {formatLastReviewed(item.lastReviewed)}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 12,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: ".72rem", color: "var(--faint)" }}>
            Ghi nhận
          </span>
          <StrengthPicker value={strengthPick} onChange={onStrengthChange} />
          <button
            type="button"
            disabled={reviewing}
            aria-label={`Đã ôn ${item.title}`}
            onClick={(e) => {
              e.stopPropagation();
              onReview();
            }}
            style={{
              marginLeft: "auto",
              height: 36,
              padding: "0 14px",
              border: "none",
              borderRadius: 12,
              cursor: reviewing ? "wait" : "pointer",
              background: "var(--accent)",
              color: "#fff",
              fontFamily: "var(--body)",
              fontWeight: 600,
              fontSize: ".82rem",
              boxShadow: reviewing ? "none" : "var(--coral-glow)",
              opacity: reviewing ? 0.7 : 1,
            }}
          >
            {reviewing ? "Đang lưu…" : "Đã ôn"}
          </button>
        </div>
      </div>
      <button
        type="button"
        aria-label="Mở bài học"
        onClick={onOpen}
        style={{
          flex: "0 0 auto",
          alignSelf: "center",
          border: "none",
          background: "none",
          cursor: "pointer",
          color: "var(--faint)",
          padding: 4,
        }}
      >
        <ChevronRight size={21} />
      </button>
    </article>
  );
}

export default function ReviewPage() {
  const navigate = useNavigate();
  const [due, setDue] = useState<ReviewDue[]>([]);
  const [soon, setSoon] = useState<SoonItem[]>([]);
  const [initialDueCount, setInitialDueCount] = useState(0);
  const [doneCount, setDoneCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [strengthByNote, setStrengthByNote] = useState<Record<string, number>>(
    {},
  );
  const [reviewingIds, setReviewingIds] = useState<Set<string>>(
    () => new Set(),
  );
  const reviewingIdsRef = useRef<Set<string>>(new Set());
  const firstCardRef = useRef<HTMLElement | null>(null);
  const mountedRef = useRef(true);

  const sessionStarted = useRef(false);

  const syncReviewingIds = useCallback(() => {
    setReviewingIds(new Set(reviewingIdsRef.current));
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!mountedRef.current) return;
      setLoading(true);
      setError(null);
      try {
        const rows = await getDueReviews();
        if (cancelled || !mountedRef.current) return;
        setDue(rows);
        if (!sessionStarted.current) {
          sessionStarted.current = true;
          setInitialDueCount(rows.length);
        }
        setStrengthByNote((prev) => {
          const next = { ...prev };
          for (const r of rows) {
            if (next[r.noteId] === undefined) {
              next[r.noteId] = defaultStrengthFor(r);
            }
          }
          return next;
        });
      } catch (e) {
        if (cancelled || !mountedRef.current) return;
        setError(
          e instanceof Error ? e.message : "Không tải được danh sách ôn tập",
        );
        setDue([]);
      } finally {
        if (!cancelled && mountedRef.current) {
          setLoading(false);
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const remaining = due.length;
  const heroTotal = useMemo(
    () => Math.max(initialDueCount, remaining + doneCount),
    [initialDueCount, remaining, doneCount],
  );

  const startReview = () => {
    if (due.length === 0) return;
    firstCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const openNote = (title: string) => {
    navigate(`/app/notes/${encodeURIComponent(title)}`);
  };

  const markReviewed = async (item: ReviewDue) => {
    if (reviewingIdsRef.current.has(item.noteId)) return;
    reviewingIdsRef.current.add(item.noteId);
    syncReviewingIds();

    const strength = strengthByNote[item.noteId] ?? defaultStrengthFor(item);
    if (mountedRef.current) setError(null);
    try {
      await createReviewEvent(item.title, strength);
      if (!mountedRef.current) return;
      setDue((list) => list.filter((d) => d.noteId !== item.noteId));
      setDoneCount((c) => c + 1);
      setSoon((list) => [
        {
          key: `${item.noteId}-${Date.now()}`,
          title: item.title,
          subject: item.subject,
          when: soonLabel(strength),
        },
        ...list,
      ]);
      setStrengthByNote((prev) => {
        const next = { ...prev };
        delete next[item.noteId];
        return next;
      });
    } catch (e) {
      if (!mountedRef.current) return;
      setError(e instanceof Error ? e.message : "Không lưu được lần ôn");
    } finally {
      reviewingIdsRef.current.delete(item.noteId);
      if (mountedRef.current) {
        syncReviewingIds();
      }
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--canvas)",
        padding: "28px 20px 48px",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto", width: "100%" }}>
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
          <ArrowLeft size={18} /> Bài học
        </button>

        <section className="sm-fade">
          <header style={{ marginBottom: 24 }}>
            <h2
              style={{
                fontFamily: "var(--display)",
                fontWeight: 600,
                fontSize: "2rem",
                letterSpacing: "-.02em",
                margin: 0,
              }}
            >
              Ôn tập
            </h2>
            <p style={{ color: "var(--muted)", fontSize: "1rem", marginTop: 6 }}>
              Ôn lại đúng lúc để ghi nhớ lâu hơn.
            </p>
          </header>

          {error ? (
            <p
              style={{
                color: "var(--rose)",
                fontSize: ".92rem",
                marginBottom: 16,
              }}
            >
              {error}
            </p>
          ) : null}

          <section
            style={{
              position: "relative",
              overflow: "hidden",
              background: "var(--paper)",
              border: "1px solid var(--border)",
              borderRadius: 22,
              boxShadow: "var(--shadow)",
              padding: 22,
              marginBottom: 28,
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
                gap: 16,
                marginBottom: 18,
              }}
            >
              <ReviewRing done={doneCount} total={heroTotal} />
              <div>
                <div
                  style={{
                    fontSize: ".74rem",
                    fontWeight: 700,
                    letterSpacing: ".06em",
                    textTransform: "uppercase",
                    color: "var(--accent)",
                    marginBottom: 5,
                  }}
                >
                  Hôm nay
                </div>
                <div
                  style={{
                    fontFamily: "var(--display)",
                    fontWeight: 600,
                    fontSize: "1.25rem",
                    letterSpacing: "-.01em",
                    lineHeight: 1.3,
                  }}
                >
                  {loading
                    ? "Đang tải…"
                    : remaining === 0
                      ? "Không còn bài đến hạn ôn tập"
                      : `Còn ${remaining} bài đến hạn ôn tập`}
                </div>
              </div>
            </div>
            <button
              type="button"
              disabled={loading || remaining === 0}
              onClick={startReview}
              style={{
                position: "relative",
                width: "100%",
                height: 50,
                border: "none",
                cursor: loading || remaining === 0 ? "not-allowed" : "pointer",
                background: "var(--accent)",
                color: "#fff",
                borderRadius: 14,
                boxShadow: remaining > 0 ? "var(--coral-glow)" : "none",
                fontFamily: "var(--body)",
                fontWeight: 600,
                fontSize: ".97rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: loading || remaining === 0 ? 0.55 : 1,
              }}
            >
              <Play size={17} fill="currentColor" />
              Bắt đầu ôn tập
            </button>
          </section>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              margin: "0 2px 14px",
            }}
          >
            <h3
              style={{
                fontSize: ".78rem",
                fontWeight: 700,
                letterSpacing: ".05em",
                textTransform: "uppercase",
                color: "var(--muted)",
                margin: 0,
              }}
            >
              Đến hạn hôm nay
            </h3>
            {!loading ? (
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: ".72rem",
                  fontWeight: 600,
                  color: "var(--accent)",
                  background: "var(--accent-soft)",
                  padding: "2px 8px",
                  borderRadius: 7,
                }}
              >
                {remaining} bài
              </span>
            ) : null}
          </div>

          {loading ? (
            <p style={{ color: "var(--muted)", fontSize: ".92rem" }}>
              Đang tải danh sách…
            </p>
          ) : due.length === 0 ? (
            <p
              style={{
                color: "var(--muted)",
                fontSize: ".92rem",
                marginBottom: 28,
                lineHeight: 1.5,
              }}
            >
              Bạn đã ôn hết các bài đến hạn hôm nay. Hãy quay lại sau hoặc tạo
              thêm bài học mới.
            </p>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                marginBottom: 28,
              }}
            >
              {due.map((d, i) => (
                <DueCard
                  key={d.noteId}
                  item={d}
                  cardRef={i === 0 ? firstCardRef : undefined}
                  strengthPick={
                    strengthByNote[d.noteId] ?? defaultStrengthFor(d)
                  }
                  onStrengthChange={(v) =>
                    setStrengthByNote((prev) => ({ ...prev, [d.noteId]: v }))
                  }
                  onReview={() => markReviewed(d)}
                  onOpen={() => openNote(d.title)}
                  reviewing={reviewingIds.has(d.noteId)}
                />
              ))}
            </div>
          )}

          <div style={{ margin: "0 2px 14px" }}>
            <h3
              style={{
                fontSize: ".78rem",
                fontWeight: 700,
                letterSpacing: ".05em",
                textTransform: "uppercase",
                color: "var(--muted)",
                margin: 0,
              }}
            >
              Sắp tới
            </h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {soon.length === 0 ? (
              <p
                style={{
                  color: "var(--muted)",
                  fontSize: ".88rem",
                  lineHeight: 1.5,
                  opacity: 0.85,
                }}
              >
                Các bài vừa ôn sẽ hiện ở đây với lịch lặp lại. Chưa có bài nào
                trong hàng đợi sắp tới từ máy chủ.
              </p>
            ) : (
              soon.map((d) => {
                const sub = subjectMeta(d.subject);
                return (
                  <article
                    key={d.key}
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      gap: 13,
                      background: "var(--paper)",
                      border: "1px solid var(--border)",
                      borderRadius: 18,
                      padding: "15px 16px 15px 20px",
                      opacity: 0.62,
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 14,
                        bottom: 14,
                        width: 3,
                        borderRadius: 99,
                        background: sub.color,
                      }}
                    />
                    <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                          marginBottom: 6,
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: ".74rem",
                            fontWeight: 600,
                            color: sub.color,
                          }}
                        >
                          <i
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              background: sub.color,
                            }}
                          />
                          {sub.label}
                        </span>
                        <span
                          style={{
                            fontSize: ".68rem",
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: 6,
                            color: "var(--muted)",
                            background: "var(--track)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {d.when}
                        </span>
                      </div>
                      <h4
                        style={{
                          fontSize: "1.02rem",
                          fontWeight: 600,
                          letterSpacing: "-.01em",
                          lineHeight: 1.3,
                          margin: 0,
                        }}
                      >
                        {d.title}
                      </h4>
                      <div
                        style={{
                          fontSize: ".78rem",
                          color: "var(--muted)",
                          marginTop: 8,
                        }}
                      >
                        Lặp lại theo lịch ôn tập
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}