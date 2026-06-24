import { ArrowLeft, Check, Edit, Play } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../api/client";
import { getNote, type Note } from "../api/notes";
import { Editor } from "../components/editor/Editor";
import { DIFF, SUBJECTS, TAG_PALETTE } from "../components/PageProperties";

const RECALL_SEED = [
  "Công thức ∫u dv = uv − ∫v du",
  "Quy tắc ILATE khi chọn u",
  "Luôn cộng hằng số + C vào kết quả",
] as const;

function blocksToPlainText(blocks: unknown[]): string {
  const parts: string[] = [];
  const walk = (items: unknown[]) => {
    for (const block of items) {
      if (!block || typeof block !== "object") continue;
      const b = block as {
        type?: string;
        content?: unknown[];
        children?: unknown[];
      };
      if (b.type === "code") {
        if (b.children?.length) walk(b.children);
        continue;
      }
      if (Array.isArray(b.content)) {
        for (const inline of b.content) {
          if (inline && typeof inline === "object" && "text" in inline) {
            const t = (inline as { text?: string }).text;
            if (t) parts.push(t);
          }
        }
      }
      if (b.children?.length) walk(b.children);
    }
  };
  walk(blocks);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function countWords(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

function readMinutes(blocks: unknown[]): number {
  const words = countWords(blocksToPlainText(blocks));
  return Math.max(1, Math.ceil(words / 200));
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

function difficultyLabel(difficulty: string | null | undefined): string | null {
  if (!difficulty || !(difficulty in DIFF)) return null;
  return DIFF[difficulty as keyof typeof DIFF].label;
}

export default function Study() {
  const params = useParams();
  const navigate = useNavigate();
  const titleParam = params.title ?? "";

  const [loadState, setLoadState] = useState<
    "loading" | "ready" | "notfound" | "error"
  >("loading");
  const [note, setNote] = useState<Note | null>(null);
  const [loadError, setLoadError] = useState("");
  const [checkedRecall, setCheckedRecall] = useState<Record<number, boolean>>(
    {},
  );

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!titleParam) {
        setLoadState("notfound");
        return;
      }
      setLoadState("loading");
      try {
        const n = await getNote(titleParam);
        if (cancelled) return;
        setNote(n);
        setLoadState("ready");
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 404) {
          setLoadState("notfound");
          return;
        }
        setLoadError(e instanceof Error ? e.message : "Không tải được bài học");
        setLoadState("error");
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [titleParam]);

  const subject = useMemo(
    () => subjectMeta(note?.subject),
    [note?.subject],
  );
  const diffLabel = useMemo(
    () => difficultyLabel(note?.difficulty),
    [note?.difficulty],
  );
  const minutes = useMemo(
    () => (note ? readMinutes(note.content) : 1),
    [note],
  );

  const editPath = `/app/notes/${encodeURIComponent(note?.title ?? titleParam)}/edit`;

  if (loadState === "loading") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--canvas)",
          color: "var(--muted)",
        }}
      >
        Đang tải…
      </div>
    );
  }

  if (loadState === "notfound") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          background: "var(--canvas)",
          padding: 24,
        }}
      >
        <p style={{ fontFamily: "var(--display)", fontSize: "1.25rem" }}>
          Không tìm thấy bài học
        </p>
        <Link
          to="/app"
          style={{ color: "var(--accent)", fontWeight: 600 }}
        >
          Về trang chủ
        </Link>
      </div>
    );
  }

  if (loadState === "error" || !note) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          background: "var(--canvas)",
          padding: 24,
        }}
      >
        <p style={{ color: "var(--rose)" }}>{loadError}</p>
        <Link to="/app" style={{ color: "var(--accent)", fontWeight: 600 }}>
          Về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--canvas)",
        padding: "18px 20px 48px",
      }}
    >
      <header
        style={{
          maxWidth: 720,
          margin: "0 auto 20px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <button
          type="button"
          aria-label="Quay lại"
          onClick={() => navigate("/app")}
          style={{
            width: 40,
            height: 40,
            border: "none",
            background: "var(--paper)",
            borderRadius: 12,
            cursor: "pointer",
            color: "var(--ink)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "var(--border)",
          }}
        >
          <ArrowLeft size={22} />
        </button>
        <span
          style={{
            fontFamily: "var(--display)",
            fontWeight: 600,
            fontSize: "1.1rem",
            color: "var(--ink)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {note.title}
        </span>
      </header>

      <section className="sm-fade" style={{ maxWidth: 720, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            fontSize: ".85rem",
            color: "var(--muted)",
            fontWeight: 500,
            marginBottom: 26,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: subject.color,
              flexShrink: 0,
            }}
          />
          <span>{subject.label}</span>
          {diffLabel ? (
            <>
              <span style={{ opacity: 0.5 }}>·</span>
              <span>#{diffLabel}</span>
            </>
          ) : null}
          <span style={{ opacity: 0.5 }}>·</span>
          <span>
            {minutes} phút đọc
          </span>
          <button
            type="button"
            onClick={() => navigate(editPath)}
            style={{
              marginLeft: "auto",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 34,
              padding: "0 13px",
              border: "1px solid var(--border)",
              background: "var(--paper)",
              borderRadius: 99,
              cursor: "pointer",
              color: "var(--ink)",
              fontFamily: "var(--body)",
              fontSize: ".82rem",
              fontWeight: 500,
            }}
          >
            <Edit size={16} />
            Chỉnh sửa
          </button>
        </div>

        <h1
          style={{
            fontFamily: "var(--display)",
            fontWeight: 600,
            fontSize: "2.2rem",
            letterSpacing: "-.02em",
            lineHeight: 1.1,
            margin: "0 0 24px",
          }}
        >
          {note.title}
        </h1>

        <div style={{ marginBottom: 8 }}>
          <Editor initialContent={note.content} readOnly />
        </div>

        <section
          style={{
            marginTop: 18,
            paddingTop: 28,
            borderTop: "1px solid var(--border)",
          }}
        >
          <h3
            style={{
              fontSize: ".78rem",
              fontWeight: 700,
              letterSpacing: ".06em",
              textTransform: "uppercase",
              color: "var(--muted)",
              marginBottom: 10,
            }}
          >
            Cần nhớ
          </h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {RECALL_SEED.map((text, i) => {
              const done = checkedRecall[i];
              return (
                <li key={text}>
                  <button
                    type="button"
                    onClick={() =>
                      setCheckedRecall((prev) => ({
                        ...prev,
                        [i]: !prev[i],
                      }))
                    }
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      padding: "12px 0",
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "var(--body)",
                      fontSize: "1rem",
                      lineHeight: 1.5,
                      color: done ? "var(--muted)" : "var(--ink)",
                    }}
                  >
                    <span
                      style={{
                        flexShrink: 0,
                        width: 22,
                        height: 22,
                        borderRadius: 8,
                        border: `1.5px solid ${done ? "var(--accent)" : "var(--border)"}`,
                        background: done ? "var(--accent-tint)" : "var(--paper)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--accent)",
                      }}
                    >
                      {done ? <Check size={15} /> : null}
                    </span>
                    <span
                      style={{
                        textDecoration: done ? "line-through" : "none",
                      }}
                    >
                      {text}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <div style={{ marginTop: 34 }}>
          <button
            type="button"
            aria-disabled
            title="Sắp có"
            style={{
              height: 54,
              padding: "0 30px",
              border: "none",
              cursor: "default",
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
              opacity: 0.92,
            }}
          >
            <Play size={18} fill="currentColor" />
            Bắt đầu Quiz
          </button>
        </div>
      </section>
    </div>
  );
}
