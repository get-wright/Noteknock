import {
  Calendar,
  Check,
  ChevronDown,
  Home,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import type { AttemptOut, Quiz } from "../api/quiz";

const SERIES = [44, 53, 49, 58, 64, 70];
const LETTERS = ["A", "B", "C", "D"] as const;

export type QuizResultState = {
  noteTitle: string;
  topicLabel: string;
  topicColor: string;
  quiz: Quiz;
  attempt: AttemptOut;
  choices: { questionId: string; choice: number }[];
};

function optionLabel(options: string[], index: number): string {
  if (index < 0 || index >= options.length) return "—";
  const letter = LETTERS[index] ?? "?";
  const text = options[index] ?? "";
  return `${letter}. ${text}`;
}

function GrowthChart({ pctToday }: { pctToday: number }) {
  const W = 560;
  const H = 200;
  const padX = 18;
  const top = 18;
  const bottom = 160;
  const n = SERIES.length;
  const xAt = (i: number) => padX + i * ((W - padX * 2) / (n - 1));
  const yAt = (v: number) => bottom - (v / 100) * (bottom - top);
  const pts = SERIES.map((v, i) => ({ x: xAt(i), y: yAt(v) }));
  const smooth = (p: { x: number; y: number }[]) => {
    let d = `M${p[0].x.toFixed(1)},${p[0].y.toFixed(1)}`;
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[i - 1] ?? p[i];
      const p1 = p[i];
      const p2 = p[i + 1];
      const p3 = p[i + 2] ?? p2;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
  };
  const line = smooth(pts);
  const area = `${line} L${pts[n - 1].x.toFixed(1)},${bottom} L${pts[0].x.toFixed(1)},${bottom} Z`;
  const last = pts[n - 1];
  const grid = [yAt(30), yAt(60), yAt(90)];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{
        width: "100%",
        height: "auto",
        display: "block",
        marginTop: 6,
        overflow: "visible",
      }}
      aria-hidden
    >
      <defs>
        <linearGradient id="smgrad-quiz" x1={0} y1={0} x2={0} y2={1}>
          <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.26} />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
        </linearGradient>
      </defs>
      {grid.map((y, i) => (
        <line
          key={i}
          x1={padX}
          y1={y}
          x2={W - padX}
          y2={y}
          stroke="var(--border)"
          strokeWidth={1}
        />
      ))}
      <path d={area} fill="url(#smgrad-quiz)" />
      <path
        d={line}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pts.slice(0, -1).map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={2.8}
          fill="var(--paper)"
          stroke="var(--accent)"
          strokeWidth={2}
        />
      ))}
      <circle
        className="sm-halo"
        cx={last.x}
        cy={last.y}
        r={6}
        fill="var(--accent)"
        style={{
          transformOrigin: `${last.x}px ${last.y}px`,
          animation: "sm-halo 2.6s ease-in-out infinite",
        }}
      />
      <circle
        cx={last.x}
        cy={last.y}
        r={4.6}
        fill="var(--accent)"
        stroke="var(--paper)"
        strokeWidth={2}
      />
      <title>{`Hôm nay · ${pctToday}%`}</title>
    </svg>
  );
}

function loadStoredResult(noteTitle: string): QuizResultState | null {
  try {
    const raw = sessionStorage.getItem(`quizResult:${noteTitle}`);
    if (!raw) return null;
    return JSON.parse(raw) as QuizResultState;
  } catch {
    return null;
  }
}

export default function QuizResultPage() {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const titleParam = params.title ?? "";

  const state = (location.state as QuizResultState | null) ?? loadStoredResult(titleParam);

  const [openMissed, setOpenMissed] = useState<number>(-1);

  const missed = useMemo(() => {
    if (!state) return [];
    const choiceByQ = new Map(
      state.choices.map((c) => [c.questionId, c.choice]),
    );
    const answerByQ = new Map(
      state.attempt.answers.map((a) => [a.questionId, a]),
    );
    return state.quiz.questions
      .filter((q) => {
        const a = answerByQ.get(q.id);
        if (!a) return true;
        return !a.correct;
      })
      .map((q) => {
        const a = answerByQ.get(q.id);
        const unanswered = a === undefined;
        const youIdx = choiceByQ.get(q.id) ?? a?.choice;
        return {
          prompt: q.prompt,
          unanswered,
          you: unanswered
            ? "Chưa trả lời"
            : optionLabel(q.options, youIdx ?? 0),
          ok: optionLabel(q.options, q.correctIndex),
          why:
            q.explanation?.trim() ||
            "Hãy xem lại nội dung bài học để củng cố phần này.",
        };
      });
  }, [state]);

  const studyPath = `/app/notes/${encodeURIComponent(titleParam)}`;
  const quizPath = `/app/notes/${encodeURIComponent(titleParam)}/quiz`;

  if (!state || !titleParam) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          background: "var(--editor-canvas)",
          padding: 24,
        }}
      >
        <p style={{ color: "var(--muted)", textAlign: "center" }}>
          Chưa có kết quả quiz. Hãy làm bài trước.
        </p>
        <Link to={quizPath} style={{ color: "var(--accent)", fontWeight: 600 }}>
          Bắt đầu Quiz
        </Link>
        <Link to="/app" style={{ color: "var(--muted)", fontSize: ".9rem" }}>
          Về Bài học
        </Link>
      </div>
    );
  }

  const { attempt } = state;
  const pctToday = attempt.total
    ? Math.round((attempt.score / attempt.total) * 100)
    : 0;
  const trend =
    pctToday >= 70 ? "+12%" : pctToday >= 50 ? "+6%" : "+2%";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--editor-canvas)",
        padding: "18px 20px 48px",
      }}
    >
      <section className="sm-fade" style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ textAlign: "center", padding: "14px 0 34px" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: ".92rem",
              fontWeight: 600,
              color: "var(--accent)",
              marginBottom: 18,
            }}
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: "var(--accent)",
              }}
            />
            Bạn đang tiến bộ
          </span>
          <div
            style={{
              fontFamily: "var(--mono)",
              fontWeight: 600,
              fontSize: "3.7rem",
              lineHeight: 1,
              letterSpacing: "-.02em",
              color: "var(--ink)",
            }}
          >
            {attempt.score}{" "}
            <span style={{ color: "var(--faint)", fontWeight: 400 }}>/</span>{" "}
            {attempt.total}
          </div>
          <div
            style={{
              fontSize: "1.05rem",
              color: "var(--muted)",
              fontWeight: 500,
              marginTop: 12,
            }}
          >
            câu đúng
          </div>
        </div>

        <div
          style={{
            background: "var(--paper)",
            border: "1px solid var(--border)",
            borderRadius: 20,
            boxShadow: "var(--shadow)",
            padding: "20px 20px 16px",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 6,
            }}
          >
            <h3
              style={{
                fontFamily: "var(--display)",
                fontWeight: 600,
                fontSize: "1.15rem",
                letterSpacing: "-.01em",
                lineHeight: 1.3,
                margin: 0,
              }}
            >
              Biểu đồ tăng trưởng kiến thức
            </h3>
            <span
              style={{
                flex: "0 0 auto",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: ".82rem",
                fontWeight: 600,
                color: "var(--accent)",
                background: "var(--accent-soft)",
                padding: "4px 10px",
                borderRadius: 9,
              }}
            >
              <TrendingUp size={13} />
              <span style={{ fontFamily: "var(--mono)", fontWeight: 600 }}>
                {trend}
              </span>
            </span>
          </div>
          <GrowthChart pctToday={pctToday} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              marginTop: 8,
              fontSize: ".74rem",
              color: "var(--muted)",
            }}
          >
            <span>6 buổi học gần đây</span>
            <span style={{ color: "var(--accent)", fontWeight: 600 }}>
              Hôm nay · {pctToday}%
            </span>
          </div>
        </div>

        {missed.length > 0 ? (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                margin: "2px 2px 14px",
              }}
            >
              <h3
                style={{
                  fontSize: ".78rem",
                  fontWeight: 700,
                  letterSpacing: ".06em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  margin: 0,
                }}
              >
                Câu cần xem lại
              </h3>
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: ".72rem",
                  fontWeight: 600,
                  color: "var(--rose)",
                  background: "var(--rose-soft)",
                  padding: "3px 9px",
                  borderRadius: 7,
                }}
              >
                {missed.length} câu
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                marginBottom: 26,
              }}
            >
              {missed.map((m, i) => {
                const open = openMissed === i;
                const panelId = `missed-panel-${i}`;
                const headerId = `missed-header-${i}`;
                return (
                  <div
                    key={i}
                    style={{
                      background: "var(--paper)",
                      border: "1px solid var(--border)",
                      borderRadius: 18,
                      boxShadow: "var(--shadow)",
                      overflow: "hidden",
                    }}
                  >
                    <button
                      type="button"
                      id={headerId}
                      aria-expanded={open}
                      aria-controls={panelId}
                      onClick={() => setOpenMissed(open ? -1 : i)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "15px 16px",
                        cursor: "pointer",
                        minHeight: 56,
                        border: "none",
                        background: "none",
                        fontFamily: "var(--body)",
                        textAlign: "left",
                      }}
                    >
                      <span
                        style={{
                          flex: "0 0 auto",
                          width: 9,
                          height: 9,
                          borderRadius: "50%",
                          background: "var(--rose)",
                        }}
                      />
                      <span
                        style={{
                          flex: "1 1 auto",
                          fontSize: ".97rem",
                          fontWeight: 500,
                          color: "var(--ink)",
                          lineHeight: 1.35,
                        }}
                      >
                        {m.prompt}
                      </span>
                      <span
                        style={{
                          flex: "0 0 auto",
                          color: "var(--muted)",
                          display: "flex",
                          transform: open ? "rotate(180deg)" : "none",
                          transition: "transform .3s ease",
                        }}
                      >
                        <ChevronDown size={20} />
                      </span>
                    </button>
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={headerId}
                      hidden={!open}
                      style={{
                        maxHeight: open ? 360 : 0,
                        opacity: open ? 1 : 0,
                        overflow: "hidden",
                        transition:
                          "max-height .5s cubic-bezier(.22,.85,.25,1),opacity .35s ease",
                      }}
                    >
                      <div
                        style={{
                          padding: "15px 16px 17px",
                          borderTop: "1px solid var(--border)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 9,
                            marginBottom: 16,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 11,
                            }}
                          >
                            <span
                              style={{
                                flex: "0 0 auto",
                                width: 84,
                                fontSize: ".78rem",
                                fontWeight: 500,
                                color: "var(--muted)",
                              }}
                            >
                              Bạn chọn
                            </span>
                            <span
                              style={{
                                fontFamily: m.unanswered ? "var(--body)" : "var(--mono)",
                                fontSize: ".9rem",
                                fontWeight: 500,
                                padding: "5px 11px",
                                borderRadius: 9,
                                color: m.unanswered ? "var(--muted)" : "var(--rose)",
                                background: m.unanswered
                                  ? "var(--track)"
                                  : "var(--rose-soft)",
                                textDecoration: m.unanswered
                                  ? "none"
                                  : "line-through",
                              }}
                            >
                              {m.you}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 11,
                            }}
                          >
                            <span
                              style={{
                                flex: "0 0 auto",
                                width: 84,
                                fontSize: ".78rem",
                                fontWeight: 500,
                                color: "var(--muted)",
                              }}
                            >
                              Đáp án đúng
                            </span>
                            <span
                              style={{
                                fontFamily: "var(--mono)",
                                fontSize: ".9rem",
                                fontWeight: 500,
                                padding: "5px 11px",
                                borderRadius: 9,
                                color: "var(--accent)",
                                background: "var(--accent-soft)",
                              }}
                            >
                              {m.ok}
                            </span>
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: ".72rem",
                            textTransform: "uppercase",
                            letterSpacing: ".05em",
                            fontWeight: 600,
                            color: "var(--accent)",
                            marginBottom: 6,
                          }}
                        >
                          Giải thích lỗi sai
                        </div>
                        <p
                          style={{
                            fontSize: ".92rem",
                            lineHeight: 1.6,
                            color: "var(--ink)",
                            margin: 0,
                          }}
                        >
                          {m.why}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p
            style={{
              textAlign: "center",
              color: "var(--muted)",
              marginBottom: 26,
              fontSize: ".95rem",
            }}
          >
            Tuyệt vời — không có câu nào cần xem lại.
          </p>
        )}

        <div
          style={{
            background: "var(--paper)",
            border: "1px solid var(--border)",
            borderRadius: 20,
            boxShadow: "var(--shadow)",
            padding: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 13,
              marginBottom: 18,
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 46,
                height: 46,
                flexShrink: 0,
                padding: 11,
                borderRadius: 14,
                background: "var(--accent-soft)",
                color: "var(--accent)",
              }}
            >
              <Calendar size={23} />
            </span>
            <div>
              <h4
                style={{
                  fontFamily: "var(--display)",
                  fontWeight: 600,
                  fontSize: "1.1rem",
                  letterSpacing: "-.01em",
                  margin: 0,
                }}
              >
                Ôn tập lại sau <span style={{ color: "var(--ink)" }}>3</span>{" "}
                ngày
              </h4>
              <p
                style={{
                  fontSize: ".85rem",
                  color: "var(--muted)",
                  marginTop: 3,
                  lineHeight: 1.45,
                  marginBottom: 0,
                }}
              >
                Khoảng nghỉ tối ưu giúp bạn ghi nhớ lâu hơn.
              </p>
            </div>
          </div>
          <button
            type="button"
            title="Sắp có trong màn Ôn tập"
            onClick={() => navigate("/app")}
            style={{
              width: "100%",
              height: 52,
              border: "none",
              cursor: "pointer",
              background: "var(--accent)",
              color: "#fff",
              borderRadius: 15,
              boxShadow: "var(--coral-glow)",
              fontFamily: "var(--body)",
              fontWeight: 600,
              fontSize: ".97rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginBottom: 10,
            }}
          >
            <Check size={17} />
            Lên lịch ôn tập
          </button>
          <button
            type="button"
            onClick={() => navigate(studyPath)}
            style={{
              width: "100%",
              height: 52,
              border: "1px solid var(--border)",
              cursor: "pointer",
              background: "transparent",
              color: "var(--ink)",
              borderRadius: 15,
              fontFamily: "var(--body)",
              fontWeight: 600,
              fontSize: ".97rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Home size={17} />
            Về Bài học
          </button>
        </div>
      </section>
    </div>
  );
}