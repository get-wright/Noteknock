import {
  ArrowLeft,
  ArrowRight,
  Check,
  Info,
  RefreshCcw,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../api/client";
import { getNote } from "../api/notes";
import {
  generateQuiz,
  loadOrGenerateQuiz,
  submitQuizAttempt,
  type Quiz,
  type QuizQuestion,
} from "../api/quiz";
import { SUBJECTS, TAG_PALETTE } from "../components/PageProperties";
import type { QuizResultState } from "./QuizResult";

const LETTERS = ["A", "B", "C", "D"] as const;

function subjectColor(subjectId: string | null | undefined): string {
  if (!subjectId) return "#E2725B";
  const built = SUBJECTS[subjectId as keyof typeof SUBJECTS];
  if (built) return built.color;
  const idx = parseInt(subjectId.replace(/^c/, ""), 10);
  return TAG_PALETTE[Number.isNaN(idx) ? 0 : idx % TAG_PALETTE.length];
}

function subjectLabel(subjectId: string | null | undefined): string {
  if (!subjectId) return "Bài học";
  const built = SUBJECTS[subjectId as keyof typeof SUBJECTS];
  if (built) return built.label;
  return subjectId;
}

type AnswerRecord = { questionId: string; choice: number };

export default function QuizPage() {
  const params = useParams();
  const navigate = useNavigate();
  const titleParam = params.title ?? "";

  const [loadState, setLoadState] = useState<
    "loading" | "ready" | "error" | "submitting" | "regenerating"
  >("loading");
  const [loadMessage, setLoadMessage] = useState("Đang tải quiz…");
  const [loadError, setLoadError] = useState("");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [topicLabel, setTopicLabel] = useState("Bài học");
  const [topicColor, setTopicColor] = useState("#E2725B");
  const [qIndex, setQIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [choice, setChoice] = useState<number | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!titleParam) {
        setLoadError("Thiếu tiêu đề bài học");
        setLoadState("error");
        return;
      }
      setLoadState("loading");
      setLoadMessage("Đang tải quiz…");
      try {
        try {
          const note = await getNote(titleParam);
          if (cancelled) return;
          setTopicLabel(subjectLabel(note.subject));
          setTopicColor(subjectColor(note.subject));
        } catch {
          if (!cancelled) setTopicLabel(titleParam);
        }
        setLoadMessage("Đang chuẩn bị câu hỏi…");
        const q = await loadOrGenerateQuiz(titleParam);
        if (cancelled) return;
        if (!q.questions.length) {
          setLoadError("Quiz không có câu hỏi.");
          setLoadState("error");
          return;
        }
        setQuiz(q);
        setLoadState("ready");
      } catch (e) {
        if (cancelled) return;
        const msg =
          e instanceof ApiError && e.status === 502
            ? "Không tạo được quiz. Thử lại sau."
            : e instanceof Error
              ? e.message
              : "Không tải được quiz";
        setLoadError(msg);
        setLoadState("error");
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [titleParam]);

  const questions = quiz?.questions ?? [];
  const total = questions.length;
  const current: QuizQuestion | undefined = questions[qIndex];
  const progressPct = total ? Math.min(((qIndex + 1) / total) * 100, 100) : 0;

  const studyPath = `/app/notes/${encodeURIComponent(titleParam)}`;
  const resultPath = `/app/notes/${encodeURIComponent(titleParam)}/quiz/result`;

  const recordCurrentAnswer = useCallback((): AnswerRecord[] => {
    if (!current || choice === null) return answers;
    const existing = answers.find((a) => a.questionId === current.id);
    if (existing) {
      return answers.map((a) =>
        a.questionId === current.id ? { ...a, choice } : a,
      );
    }
    return [...answers, { questionId: current.id, choice }];
  }, [answers, choice, current]);

  const finishQuiz = useCallback(
    async (finalAnswers: AnswerRecord[]) => {
      if (!quiz || loadState === "submitting") return;
      setLoadState("submitting");
      try {
        const attempt = await submitQuizAttempt(quiz.id, finalAnswers);
        if (!mountedRef.current) return;
        const state: QuizResultState = {
          noteTitle: titleParam,
          topicLabel,
          topicColor,
          quiz,
          attempt,
          choices: finalAnswers,
        };
        const key = `quizResult:${titleParam}`;
        try {
          sessionStorage.setItem(key, JSON.stringify(state));
        } catch {
          /* ignore */
        }
        navigate(resultPath, { state });
      } catch (e) {
        if (!mountedRef.current) return;
        setLoadState("ready");
        setLoadError(
          e instanceof Error ? e.message : "Không gửi được bài làm",
        );
      }
    },
    [quiz, loadState, titleParam, topicLabel, topicColor, navigate, resultPath],
  );

  const onSelect = (idx: number) => {
    if (answered || !current) return;
    setChoice(idx);
    setAnswered(true);
    setAnswers((prev) => {
      const rest = prev.filter((a) => a.questionId !== current.id);
      return [...rest, { questionId: current.id, choice: idx }];
    });
  };

  const onNext = () => {
    if (!answered || choice === null || !current) return;
    const merged = recordCurrentAnswer();
    if (qIndex >= total - 1) {
      void finishQuiz(merged);
      return;
    }
    setQIndex((i) => i + 1);
    setAnswered(false);
    setChoice(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onFinishEarly = () => {
    if (!answered || choice === null) return;
    void finishQuiz(recordCurrentAnswer());
  };

  const onRegenerate = async () => {
    if (!titleParam || loadState === "regenerating" || loadState === "submitting") {
      return;
    }
    setLoadState("regenerating");
    setLoadError("");
    try {
      const nextQuiz = await generateQuiz(titleParam);
      if (!mountedRef.current) return;
      if (!nextQuiz.questions.length) {
        setLoadError("Quiz không có câu hỏi.");
        setLoadState("error");
        return;
      }
      setQuiz(nextQuiz);
      setQIndex(0);
      setAnswered(false);
      setChoice(null);
      setAnswers([]);
      setLoadState("ready");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      if (!mountedRef.current) return;
      setLoadState("ready");
      setLoadError(
        e instanceof ApiError && e.status === 502
          ? "Không tạo lại được quiz. Thử lại sau."
          : e instanceof Error
            ? e.message
            : "Không tạo lại được quiz",
      );
    }
  };

  const correctIndex = current?.correctIndex ?? -1;

  const optionNodes = useMemo(() => {
    if (!current) return null;
    return current.options.map((text, idx) => {
      let bg = "var(--paper)";
      let bd = "var(--border)";
      let badgeBg = "transparent";
      let badgeBd = "var(--border)";
      let badgeColor = "var(--muted)";
      let dim = false;
      let showCheck = false;
      let showX = false;

      if (answered) {
        if (idx === correctIndex) {
          bg = "var(--accent-soft)";
          bd = "var(--accent)";
          badgeBg = "var(--accent)";
          badgeBd = "var(--accent)";
          badgeColor = "#fff";
          showCheck = true;
        } else if (idx === choice) {
          bg = "var(--rose-soft)";
          bd = "var(--rose)";
          badgeBg = "var(--rose)";
          badgeBd = "var(--rose)";
          badgeColor = "#fff";
          showX = true;
        } else {
          dim = true;
        }
      }

      return (
        <button
          key={idx}
          type="button"
          onClick={() => onSelect(idx)}
          disabled={answered}
          style={{
            width: "100%",
            minHeight: 58,
            display: "flex",
            alignItems: "center",
            gap: 13,
            padding: "10px 16px",
            border: `1px solid ${bd}`,
            borderRadius: 16,
            background: bg,
            cursor: answered ? "default" : "pointer",
            textAlign: "left",
            fontFamily: "var(--body)",
            color: "var(--ink)",
            opacity: dim ? 0.45 : 1,
            transition: "all .2s ease",
          }}
        >
          <span
            style={{
              flex: "0 0 auto",
              width: 30,
              height: 30,
              borderRadius: 9,
              border: `1px solid ${badgeBd}`,
              background: badgeBg,
              color: badgeColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: ".92rem",
              fontWeight: 600,
            }}
          >
            {LETTERS[idx]}
          </span>
          <span
            style={{
              flex: "1 1 auto",
              fontSize: "1.04rem",
              lineHeight: 1.35,
            }}
          >
            {text}
          </span>
          {showCheck ? (
            <Check size={22} style={{ flexShrink: 0, color: "var(--accent)" }} />
          ) : null}
          {showX ? (
            <X size={22} style={{ flexShrink: 0, color: "var(--rose)" }} />
          ) : null}
        </button>
      );
    });
  }, [answered, choice, correctIndex, current]);

  if (
    loadState === "loading" ||
    loadState === "submitting" ||
    loadState === "regenerating"
  ) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--editor-canvas)",
          color: "var(--muted)",
          padding: 24,
        }}
      >
        {loadState === "submitting"
          ? "Đang nộp bài…"
          : loadState === "regenerating"
            ? "Đang tạo lại quiz…"
            : loadMessage}
      </div>
    );
  }

  if (loadState === "error" || !quiz || !current) {
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
        <p style={{ color: "var(--rose)", textAlign: "center" }}>{loadError}</p>
        <Link to={studyPath} style={{ color: "var(--accent)", fontWeight: 600 }}>
          Quay lại bài học
        </Link>
      </div>
    );
  }

  const isLast = qIndex >= total - 1;
  const nextLabel = isLast ? "Xem kết quả" : "Câu tiếp theo";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--editor-canvas)",
        padding: "18px 20px 48px",
      }}
    >
      <section className="sm-fade" style={{ maxWidth: 640, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 13,
          }}
        >
          <button
            type="button"
            aria-label="Đóng"
            onClick={() => navigate(studyPath)}
            style={{
              width: 40,
              height: 40,
              marginLeft: -8,
              border: "none",
              background: "none",
              cursor: "pointer",
              borderRadius: 12,
              color: "var(--ink)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowLeft size={22} />
          </button>
          <span
            style={{
              marginLeft: "auto",
              fontSize: ".92rem",
              color: "var(--muted)",
              fontWeight: 500,
            }}
          >
            Câu {qIndex + 1} / {total}
          </span>
          <button
            type="button"
            onClick={() => void onRegenerate()}
            style={{
              minHeight: 38,
              border: "1px solid var(--border)",
              borderRadius: 999,
              background: "var(--paper)",
              color: "var(--muted)",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "0 12px",
              fontFamily: "var(--body)",
              fontSize: ".84rem",
              fontWeight: 650,
              boxShadow: "var(--shadow)",
            }}
          >
            <RefreshCcw size={15} />
            Tạo lại quiz
          </button>
        </div>

        <div
          style={{
            height: 6,
            borderRadius: 99,
            background: "var(--track)",
            overflow: "hidden",
            marginBottom: 24,
          }}
        >
          <i
            style={{
              display: "block",
              height: "100%",
              borderRadius: 99,
              background: "var(--accent)",
              width: `${progressPct}%`,
              transition: "width .5s cubic-bezier(.2,.9,.3,1.1)",
            }}
          />
        </div>

        {loadError ? (
          <p
            style={{
              color: "var(--rose)",
              fontSize: ".88rem",
              marginBottom: 12,
            }}
          >
            {loadError}
          </p>
        ) : null}

        <div
          style={{
            background: "var(--paper)",
            border: "1px solid var(--border)",
            borderRadius: 22,
            boxShadow: "var(--shadow)",
            padding: "24px 22px",
            marginBottom: 22,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: ".76rem",
              fontWeight: 600,
              letterSpacing: ".04em",
              color: "var(--muted)",
              marginBottom: 14,
              textTransform: "uppercase",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: topicColor,
              }}
            />
            {topicLabel}
          </div>
          <p
            style={{
              fontSize: "1.34rem",
              fontWeight: 600,
              letterSpacing: "-.02em",
              lineHeight: 1.32,
              color: "var(--ink)",
              margin: 0,
            }}
          >
            {current.prompt}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          {optionNodes}
        </div>

        <div
          style={{
            maxHeight: answered ? 320 : 0,
            opacity: answered ? 1 : 0,
            marginTop: answered ? 16 : 0,
            overflow: "hidden",
            borderRadius: 16,
            background: "var(--accent-tint)",
            border: `1px solid ${answered ? "var(--border)" : "transparent"}`,
            transition:
              "max-height .55s cubic-bezier(.2,.85,.25,1),opacity .45s ease,margin .45s ease,border-color .45s ease",
          }}
        >
          <div style={{ padding: "16px 18px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: ".84rem",
                fontWeight: 600,
                color: "var(--accent)",
                marginBottom: 8,
              }}
            >
              <Info size={17} />
              Giải thích
            </div>
            <p
              style={{
                fontSize: ".97rem",
                lineHeight: 1.6,
                color: "var(--ink)",
                margin: 0,
              }}
            >
              {current.explanation?.trim() ||
                "Không có giải thích cho câu này."}
            </p>
          </div>
        </div>

        <div
          style={{
            transform: answered ? "none" : "translateY(140%)",
            opacity: answered ? 1 : 0,
            transition:
              "transform .5s cubic-bezier(.2,.9,.3,1.25),opacity .35s ease",
            marginTop: 36,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            alignItems: "center",
            pointerEvents: answered ? "auto" : "none",
          }}
        >
          <button
            type="button"
            onClick={onNext}
            style={{
              width: "100%",
              height: 54,
              border: "none",
              cursor: "pointer",
              background: "var(--accent)",
              color: "#fff",
              borderRadius: 16,
              boxShadow: "var(--coral-glow)",
              fontFamily: "var(--body)",
              fontWeight: 600,
              fontSize: "1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 9,
            }}
          >
            {nextLabel}
            <ArrowRight size={18} />
          </button>
          {!isLast ? (
            <button
              type="button"
              onClick={onFinishEarly}
              style={{
                border: "none",
                background: "none",
                cursor: "pointer",
                color: "var(--muted)",
                fontFamily: "var(--body)",
                fontSize: ".9rem",
                fontWeight: 500,
              }}
            >
              Kết thúc &amp; xem kết quả
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
