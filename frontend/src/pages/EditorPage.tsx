import { ArrowLeft, Image as ImageIcon, RotateCcw, Save } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../api/client";
import { getNote, type Note } from "../api/notes";
import { Editor } from "../components/editor/Editor";
import {
  PageProperties,
  SUBJECTS,
  TAG_PALETTE,
  type CustomTag,
} from "../components/PageProperties";
import { useAutosave } from "../hooks/useAutosave";

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
  return parts.join(" ");
}

function countWords(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

function emptyBlocks(): unknown[] {
  return [{ type: "paragraph", content: [] }];
}

function subjectToCustomTags(subject: string | null): CustomTag[] {
  if (!subject || subject in SUBJECTS) return [];
  return [
    {
      id: subject,
      label: subject,
      color: TAG_PALETTE[0],
    },
  ];
}

type EditorPageProps = {
  mode: "new" | "edit";
};

export default function EditorPage({ mode }: EditorPageProps) {
  const params = useParams();
  const navigate = useNavigate();
  const routeTitle = mode === "edit" ? (params.title ?? "") : "";

  const [loadState, setLoadState] = useState<
    "loading" | "ready" | "notfound" | "error"
  >(mode === "new" ? "ready" : "loading");
  const [title, setTitle] = useState(mode === "new" ? "" : routeTitle);
  const [originalTitle, setOriginalTitle] = useState(
    mode === "new" ? "" : routeTitle,
  );
  const [isNew, setIsNew] = useState(mode === "new");
  const [loadedNote, setLoadedNote] = useState<Note | null>(null);
  const [loadedAt, setLoadedAt] = useState(0);
  const [customTags, setCustomTags] = useState<CustomTag[]>([]);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editorEpoch, setEditorEpoch] = useState(0);
  const [editorDocument, setEditorDocument] = useState<unknown[]>(() =>
    emptyBlocks(),
  );

  const draftKey = mode === "new" ? "__new__" : routeTitle;
  const titleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (mode !== "edit") return;
    if (!routeTitle) {
      setLoadState("notfound");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const note = await getNote(routeTitle);
        if (cancelled) return;
        setLoadedNote(note);
        setTitle(note.title);
        setOriginalTitle(note.title);
        setIsNew(false);
        setCustomTags(subjectToCustomTags(note.subject));
        setLoadedAt(note.lastModified * 1000);
        setEditorDocument(
          note.content?.length ? note.content : emptyBlocks(),
        );
        setLoadState("ready");
        setEditorEpoch((e) => e + 1);
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 404) {
          setLoadState("notfound");
        } else {
          setLoadError(
            e instanceof Error ? e.message : "Không tải được bài học",
          );
          setLoadState("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, routeTitle]);

  const initialContent = useMemo(
    () =>
      loadedNote?.content?.length
        ? loadedNote.content
        : emptyBlocks(),
    [loadedNote],
  );

  const autosave = useAutosave({
    draftKey,
    title,
    originalTitle,
    isNew,
    initialContent: mode === "new" ? emptyBlocks() : initialContent,
    initialSubject: loadedNote?.subject ?? null,
    initialDifficulty: loadedNote?.difficulty ?? null,
    loadedAt,
    hydrateKey: editorEpoch,
    onError: (message) => {
      setTitleError(message);
    },
    onPromotedFromNew: (note) => {
      setIsNew(false);
      setOriginalTitle(note.title);
      setTitle(note.title);
      navigate(`/app/notes/${encodeURIComponent(note.title)}`, {
        replace: true,
      });
    },
    onSaved: (note) => {
      setTitleError(null);
      if (note.title !== originalTitle) {
        setOriginalTitle(note.title);
        setTitle(note.title);
        navigate(`/app/notes/${encodeURIComponent(note.title)}/edit`, {
          replace: true,
        });
      }
    },
  });

  const { forceSave } = autosave;

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setTitleError(null);
    if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
    titleDebounceRef.current = setTimeout(() => {
      void forceSave();
    }, 900);
  };

  useEffect(
    () => () => {
      if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
    },
    [],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void forceSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [forceSave]);

  const handleAddTag = useCallback(
    (label: string) => {
      const id = `c${customTags.length}`;
      const color = TAG_PALETTE[customTags.length % TAG_PALETTE.length];
      setCustomTags((prev) => prev.concat([{ id, label, color }]));
      autosave.setSubject(id);
    },
    [autosave, customTags.length],
  );

  const plainText = useMemo(
    () => blocksToPlainText(autosave.content),
    [autosave.content],
  );
  const words = countWords(plainText);

  const toolbarBtnText = {
    fontWeight: 700,
    fontSize: "1.1rem",
    width: 44,
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    cursor: "pointer",
    color: "var(--ink)",
    background: "transparent",
    border: "none",
  } as const;

  const toolbarBtnIcon = {
    width: 44,
    height: 44,
    padding: 11,
    borderRadius: 12,
    cursor: "pointer",
    color: "var(--ink)",
    background: "transparent",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  } as const;

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

  if (loadState === "error") {
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
        padding: "18px 20px 40px",
      }}
    >
      <header
        style={{
          maxWidth: 760,
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
          }}
        >
          Soạn bài học
        </span>
      </header>

      <section
        className="sm-fade"
        style={{ maxWidth: 760, margin: "0 auto" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            marginBottom: titleError ? 6 : 18,
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              width: "100%",
            }}
          >
            <input
              className="sm-in"
              type="text"
              placeholder="Tiêu đề bài học"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              style={{
                flex: "1 1 auto",
                minWidth: 0,
                border: "none",
                background: "none",
                fontFamily: "var(--display)",
                fontWeight: 600,
                fontSize: "1.7rem",
                letterSpacing: "-.02em",
                color: "var(--ink)",
                padding: "4px 2px",
              }}
            />
            <span
              style={{
                flex: "0 0 auto",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: ".82rem",
                color: "var(--muted)",
                whiteSpace: "nowrap",
              }}
            >
              <Save size={14} color="var(--accent)" />
              {autosave.saveText}
            </span>
          </div>
          {titleError ? (
            <p
              style={{
                margin: 0,
                fontSize: ".88rem",
                color: "var(--rose)",
                paddingLeft: 2,
              }}
            >
              {titleError}
            </p>
          ) : null}
        </div>

        <PageProperties
          subject={autosave.subject}
          difficulty={autosave.difficulty}
          customTags={customTags}
          onSubjectChange={autosave.setSubject}
          onDifficultyChange={autosave.setDifficulty}
          onAddTag={handleAddTag}
        />

        <Editor
          initialContent={editorDocument}
          onChange={autosave.setContent}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginTop: 18,
            paddingTop: 14,
            borderTop: "1px solid var(--border)",
          }}
        >
          <button
            type="button"
            title="In đậm (Ctrl+B)"
            style={toolbarBtnText}
          >
            <b>B</b>
          </button>
          <button
            type="button"
            title="In nghiêng (Ctrl+I)"
            style={{ ...toolbarBtnText, fontStyle: "italic", fontWeight: 600 }}
          >
            <i>I</i>
          </button>
          <button type="button" title="Ảnh" style={toolbarBtnIcon}>
            <ImageIcon size={20} />
          </button>
          <button
            type="button"
            title="Xóa nội dung"
            style={toolbarBtnIcon}
            onClick={() => {
              const blank = emptyBlocks();
              setEditorDocument(blank);
              autosave.setContent(blank);
            }}
          >
            <RotateCcw size={20} />
          </button>
          <span
            style={{
              marginLeft: "auto",
              fontSize: ".82rem",
              color: "var(--muted)",
            }}
          >
            <b
              style={{
                fontFamily: "var(--mono)",
                fontWeight: 600,
                color: "var(--ink)",
              }}
            >
              {words}
            </b>{" "}
            từ
          </span>
        </div>
      </section>

      {autosave.pendingDraft ? (
        <div
          role="dialog"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(45,27,53,.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: "var(--paper)",
              borderRadius: 24,
              padding: "28px 24px",
              maxWidth: 400,
              width: "100%",
              boxShadow: "var(--shadow-lift)",
              border: "1px solid var(--border)",
            }}
          >
            <p
              style={{
                margin: "0 0 20px",
                fontFamily: "var(--display)",
                fontSize: "1.15rem",
                color: "var(--ink)",
              }}
            >
              Tiếp tục soạn thảo nháp?
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={autosave.discardDraft}
                style={{
                  height: 42,
                  padding: "0 18px",
                  borderRadius: 99,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--muted)",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "var(--body)",
                }}
              >
                Không
              </button>
              <button
                type="button"
                onClick={() => {
                  const draft = autosave.pendingDraft;
                  autosave.acceptDraft();
                  if (draft) setEditorDocument(draft.content);
                }}
                style={{
                  height: 42,
                  padding: "0 18px",
                  borderRadius: 99,
                  border: "none",
                  background: "var(--accent)",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "var(--body)",
                  boxShadow: "var(--coral-glow)",
                }}
              >
                Có
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}