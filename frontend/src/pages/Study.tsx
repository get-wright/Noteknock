import { ArrowLeft, Check, Edit, Play } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../api/client";
import { getNote, type Note } from "../api/notes";
import { getRecall, updateRecallItem, type RecallItem } from "../api/recall";
import { Editor } from "../components/editor/Editor";
import { DIFF, SUBJECTS, TAG_PALETTE } from "../components/PageProperties";

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

function sortRecallItems(items: RecallItem[]): RecallItem[] {
  return [...items].sort((a, b) => {
    if (a.position !== b.position) return a.position - b.position;
    return a.createdAt - b.createdAt;
  });
}

export default function Study() {
  const params = useParams();
  const navigate = useNavigate();
  const titleParam = params.title ?? "";

  const [loadState, setLoadState] = useState<
    "loading" | "ready" | "notfound" | "error"
  >("loading");
  const [note, setNote] = useState<Note | null>(null);
  const [recallItems, setRecallItems] = useState<RecallItem[]>([]);
  const [loadError, setLoadError] = useState("");
  const [recallError, setRecallError] = useState<string | null>(null);
  const [updatingRecallIds, setUpdatingRecallIds] = useState<Set<string>>(
    () => new Set(),
  );
  const updatingRecallIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!titleParam) {
        setLoadState("notfound");
        return;
      }
      setLoadState("loading");
      setRecallItems([]);
      setRecallError(null);
      updatingRecallIdsRef.current.clear();
      setUpdatingRecallIds(new Set());
      try {
        const n = await getNote(titleParam);
        if (cancelled) return;
        setNote(n);
        setLoadState("ready");
        try {
          const recall = await getRecall(titleParam);
          if (cancelled) return;
          setRecallItems(sortRecallItems(recall));
          setRecallError(null);
        } catch (e) {
          if (cancelled) return;
          setRecallItems([]);
          setRecallError(
            e instanceof Error ? e.message : "Không tải được cần nhớ",
          );
        }
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

  const subject = useMemo(() => subjectMeta(note?.subject), [note?.subject]);
  const diffLabel = useMemo(
    () => difficultyLabel(note?.difficulty),
    [note?.difficulty],
  );
  const minutes = useMemo(() => (note ? readMinutes(note.content) : 1), [note]);

  const editPath = `/app/notes/${encodeURIComponent(note?.title ?? titleParam)}/edit`;
  const quizPath = `/app/notes/${encodeURIComponent(note?.title ?? titleParam)}/quiz`;

  const toggleRecallChecked = async (item: RecallItem) => {
    if (updatingRecallIdsRef.current.has(item.id)) return;
    const checked = !item.checked;
    updatingRecallIdsRef.current.add(item.id);
    setUpdatingRecallIds((prev) => new Set(prev).add(item.id));
    setRecallItems((prev) =>
      prev.map((x) => (x.id === item.id ? { ...x, checked } : x)),
    );
    try {
      const updated = await updateRecallItem(
        note?.title ?? titleParam,
        item.id,
        {
          checked,
        },
      );
      setRecallItems((prev) =>
        sortRecallItems(prev.map((x) => (x.id === updated.id ? updated : x))),
      );
      setRecallError(null);
    } catch (e) {
      setRecallItems((prev) =>
        prev.map((x) =>
          x.id === item.id ? { ...x, checked: item.checked } : x,
        ),
      );
      setRecallError(
        e instanceof Error ? e.message : "Không cập nhật được cần nhớ",
      );
    } finally {
      updatingRecallIdsRef.current.delete(item.id);
      setUpdatingRecallIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  if (loadState === "loading") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--editor-canvas)",
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
          background: "var(--editor-canvas)",
          padding: 24,
        }}
      >
        <p style={{ fontFamily: "var(--display)", fontSize: "1.25rem" }}>
          Không tìm thấy bài học
        </p>
        <Link to="/app" style={{ color: "var(--accent)", fontWeight: 600 }}>
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
          background: "var(--editor-canvas)",
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
        background: "var(--editor-canvas)",
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
          <span>{minutes} phút đọc</span>
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

        {recallItems.length ? (
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
              {recallItems.map((item) => {
                const done = item.checked;
                const isUpdating = updatingRecallIds.has(item.id);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-pressed={done}
                      disabled={isUpdating}
                      onClick={() => void toggleRecallChecked(item)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                        padding: "12px 0",
                        border: "none",
                        background: "none",
                        cursor: isUpdating ? "default" : "pointer",
                        opacity: isUpdating ? 0.7 : 1,
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
                          background: done
                            ? "var(--accent-tint)"
                            : "var(--paper)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--accent)",
                        }}
                      >
                        {done ? <Check size={15} /> : null}
                      </span>
                      <span style={{ flex: "1 1 auto", minWidth: 0 }}>
                        <span
                          style={{
                            textDecoration: done ? "line-through" : "none",
                          }}
                        >
                          {item.content}
                        </span>
                        {item.source === "ai" ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              height: 18,
                              marginLeft: 8,
                              padding: "0 6px",
                              borderRadius: 99,
                              background: "var(--accent-tint)",
                              color: "var(--accent)",
                              fontFamily: "var(--mono)",
                              fontSize: ".68rem",
                              fontWeight: 700,
                              verticalAlign: "middle",
                            }}
                          >
                            AI
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {recallError ? (
              <p
                style={{
                  margin: "10px 0 0",
                  color: "var(--rose)",
                  fontSize: ".88rem",
                }}
              >
                {recallError}
              </p>
            ) : null}
          </section>
        ) : null}

        <div style={{ marginTop: 34 }}>
          <button
            type="button"
            onClick={() => navigate(quizPath)}
            style={{
              height: 54,
              padding: "0 30px",
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
            <Play size={18} fill="currentColor" />
            Bắt đầu Quiz
          </button>
        </div>
      </section>
    </div>
  );
}
