import { ArrowDown, ArrowLeft, ArrowUp, Save, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../api/client";
import { getNote, type Note } from "../api/notes";
import {
  createRecallItem,
  deleteRecallItem,
  generateRecall,
  getRecall,
  updateRecallItem,
  type RecallItem,
} from "../api/recall";
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

const NEW_NOTE_DRAFT_SESSION_KEY = "noteknock_new_note_draft_session";

function getOrCreateNewNoteDraftKey(): string {
  try {
    const existing = sessionStorage.getItem(NEW_NOTE_DRAFT_SESSION_KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const key = `__new__:${id}`;
    sessionStorage.setItem(NEW_NOTE_DRAFT_SESSION_KEY, key);
    return key;
  } catch {
    return `__new__:${Date.now()}`;
  }
}

export function clearNewNoteDraftSession(): void {
  try {
    sessionStorage.removeItem(NEW_NOTE_DRAFT_SESSION_KEY);
  } catch {
    /* ignore */
  }
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

function sortRecallItems(items: RecallItem[]): RecallItem[] {
  return [...items].sort((a, b) => {
    if (a.position !== b.position) return a.position - b.position;
    return a.createdAt - b.createdAt;
  });
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
  const [recallError, setRecallError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [recallItems, setRecallItems] = useState<RecallItem[]>([]);
  const [newRecallContent, setNewRecallContent] = useState("");
  const [isCreatingRecall, setIsCreatingRecall] = useState(false);
  const [isGeneratingRecall, setIsGeneratingRecall] = useState(false);
  const [isReorderingRecall, setIsReorderingRecall] = useState(false);
  const [editorEpoch, setEditorEpoch] = useState(0);
  const [editorDocument, setEditorDocument] = useState<unknown[]>(() =>
    emptyBlocks(),
  );

  const [newNoteDraftKey] = useState(() =>
    mode === "new" ? getOrCreateNewNoteDraftKey() : "",
  );
  const draftKey = mode === "new" ? newNoteDraftKey : routeTitle;
  const titleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recallEditOriginalsRef = useRef<Record<string, string>>({});
  const isCreatingRecallRef = useRef(false);
  const isGeneratingRecallRef = useRef(false);
  const isReorderingRecallRef = useRef(false);

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
        setEditorDocument(note.content?.length ? note.content : emptyBlocks());
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

  const savedTitle = !isNew && originalTitle.trim() ? originalTitle : null;

  useEffect(() => {
    if (!savedTitle) {
      setRecallItems([]);
      setRecallError(null);
      return;
    }
    let ignore = false;
    (async () => {
      try {
        const items = await getRecall(savedTitle);
        if (!ignore) {
          setRecallItems(sortRecallItems(items));
          setRecallError(null);
        }
      } catch (e) {
        if (!ignore) {
          setRecallError(
            e instanceof Error ? e.message : "Không tải được điểm cần nhớ",
          );
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, [savedTitle]);

  const initialContent = useMemo(
    () => (loadedNote?.content?.length ? loadedNote.content : emptyBlocks()),
    [loadedNote],
  );

  const autosave = useAutosave({
    draftKey,
    title,
    originalTitle,
    isNew,
    initialContent,
    initialSubject: loadedNote?.subject ?? null,
    initialDifficulty: loadedNote?.difficulty ?? null,
    loadedAt,
    hydrateKey: editorEpoch,
    onError: (message) => {
      setTitleError(message);
    },
    onPromotedFromNew: (note) => {
      clearNewNoteDraftSession();
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
      void forceSave().catch(() => {});
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
        void forceSave().catch(() => {});
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

  const handleCreateRecall = async () => {
    const content = newRecallContent.trim();
    if (!savedTitle || !content || isCreatingRecallRef.current) return;
    isCreatingRecallRef.current = true;
    setIsCreatingRecall(true);
    try {
      const item = await createRecallItem(savedTitle, { content });
      setRecallItems((prev) => sortRecallItems(prev.concat(item)));
      setNewRecallContent("");
      setRecallError(null);
    } catch (e) {
      setRecallError(
        e instanceof Error ? e.message : "Không thêm được điểm cần nhớ",
      );
    } finally {
      isCreatingRecallRef.current = false;
      setIsCreatingRecall(false);
    }
  };

  const handleGenerateRecall = async () => {
    if (!savedTitle || isGeneratingRecallRef.current) return;
    isGeneratingRecallRef.current = true;
    setIsGeneratingRecall(true);
    try {
      const savedNote = await forceSave();
      if (!savedNote) {
        throw new Error("Không lưu được bài học");
      }
      const items = await generateRecall(savedNote.title);
      setRecallItems(sortRecallItems(items));
      setRecallError(null);
    } catch (e) {
      setRecallError(
        e instanceof Error ? e.message : "Không tạo được điểm cần nhớ",
      );
    } finally {
      isGeneratingRecallRef.current = false;
      setIsGeneratingRecall(false);
    }
  };

  const handleUpdateRecallContent = async (
    item: RecallItem,
    serverContent: string,
  ) => {
    const content = item.content.trim();
    if (!savedTitle) return;
    if (!content) {
      setRecallItems((prev) =>
        prev.map((x) =>
          x.id === item.id ? { ...x, content: serverContent } : x,
        ),
      );
      setRecallError("Điểm cần nhớ không được để trống.");
      delete recallEditOriginalsRef.current[item.id];
      return;
    }
    try {
      const updated = await updateRecallItem(savedTitle, item.id, { content });
      setRecallItems((prev) =>
        sortRecallItems(
          prev.map((x) =>
            x.id === updated.id && x.content.trim() === content ? updated : x,
          ),
        ),
      );
      setRecallError(null);
      recallEditOriginalsRef.current[item.id] = updated.content;
    } catch (e) {
      setRecallItems((prev) =>
        prev.map((x) =>
          x.id === item.id && x.content.trim() === content
            ? { ...x, content: serverContent }
            : x,
        ),
      );
      setRecallError(
        e instanceof Error ? e.message : "Không lưu được điểm cần nhớ",
      );
    } finally {
      if (recallEditOriginalsRef.current[item.id] === serverContent) {
        delete recallEditOriginalsRef.current[item.id];
      }
    }
  };

  const handleDeleteRecall = async (id: string) => {
    if (!savedTitle) return;
    try {
      await deleteRecallItem(savedTitle, id);
      setRecallItems((prev) => prev.filter((item) => item.id !== id));
      setRecallError(null);
    } catch (e) {
      setRecallError(
        e instanceof Error ? e.message : "Không xóa được điểm cần nhớ",
      );
    }
  };

  const handleMoveRecall = async (index: number, direction: -1 | 1) => {
    if (!savedTitle || isReorderingRecallRef.current) return;
    const ordered = sortRecallItems(recallItems);
    const nextIndex = index + direction;
    const item = ordered[index];
    const other = ordered[nextIndex];
    if (!item || !other) return;
    isReorderingRecallRef.current = true;
    setIsReorderingRecall(true);
    try {
      const updatedItem = await updateRecallItem(savedTitle, item.id, {
        position: other.position,
      });
      const updatedOther = await updateRecallItem(savedTitle, other.id, {
        position: item.position,
      });
      setRecallItems((prev) =>
        sortRecallItems(
          prev.map((x) => {
            if (x.id === updatedItem.id) return updatedItem;
            if (x.id === updatedOther.id) return updatedOther;
            return x;
          }),
        ),
      );
      setRecallError(null);
    } catch (e) {
      try {
        const items = await getRecall(savedTitle);
        setRecallItems(sortRecallItems(items));
      } catch {
        /* ignore */
      }
      setRecallError(
        e instanceof Error ? e.message : "Không sắp xếp được điểm cần nhớ",
      );
    } finally {
      isReorderingRecallRef.current = false;
      setIsReorderingRecall(false);
    }
  };

  const plainText = useMemo(
    () => blocksToPlainText(autosave.content),
    [autosave.content],
  );
  const words = countWords(plainText);

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

      <section className="sm-fade" style={{ maxWidth: 760, margin: "0 auto" }}>
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

        {uploadError ? (
          <div className="editor-upload-error" role="alert">
            <p className="editor-upload-error__text">{uploadError}</p>
            <button
              type="button"
              className="editor-upload-error__dismiss"
              aria-label="Đóng"
              onClick={() => setUploadError(null)}
            >
              <X size={16} />
            </button>
          </div>
        ) : null}

        <Editor
          initialContent={editorDocument}
          onChange={autosave.onEditorChange}
          onUploadError={(file, error) => {
            setUploadError(`${file.name}: ${error.message}`);
          }}
          onUploadSuccess={() => {
            setUploadError(null);
          }}
        />

        <section
          style={{
            marginTop: 20,
            paddingTop: 22,
            borderTop: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 12,
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
              Cần nhớ
            </h3>
            {savedTitle ? (
              <button
                type="button"
                onClick={() => void handleGenerateRecall()}
                disabled={isGeneratingRecall}
                style={{
                  height: 32,
                  padding: "0 14px",
                  borderRadius: 99,
                  border: "1px solid var(--accent)",
                  background: "transparent",
                  color: "var(--accent)",
                  fontFamily: "var(--body)",
                  fontSize: ".82rem",
                  fontWeight: 700,
                  cursor: isGeneratingRecall ? "default" : "pointer",
                  opacity: isGeneratingRecall ? 0.62 : 1,
                  whiteSpace: "nowrap",
                }}
              >
                {isGeneratingRecall ? "Đang tạo…" : "Tạo bằng AI"}
              </button>
            ) : null}
          </div>
          {savedTitle ? (
            <>
              {recallItems.length ? (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {sortRecallItems(recallItems).map((item, index) => (
                    <li
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 0",
                      }}
                    >
                      <input
                        className="sm-in"
                        type="text"
                        value={item.content}
                        onFocus={() => {
                          recallEditOriginalsRef.current[item.id] =
                            item.content;
                        }}
                        onChange={(e) => {
                          const content = e.target.value;
                          setRecallError(null);
                          setRecallItems((prev) =>
                            prev.map((x) =>
                              x.id === item.id ? { ...x, content } : x,
                            ),
                          );
                        }}
                        onBlur={() =>
                          void handleUpdateRecallContent(
                            item,
                            recallEditOriginalsRef.current[item.id] ??
                              item.content,
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.currentTarget.blur();
                        }}
                        style={{
                          flex: "1 1 auto",
                          minWidth: 0,
                          height: 40,
                          border: "1px solid var(--border)",
                          borderRadius: 12,
                          background: "var(--paper)",
                          color: "var(--ink)",
                          padding: "0 12px",
                          fontFamily: "var(--body)",
                          fontSize: ".95rem",
                        }}
                      />
                      <button
                        type="button"
                        aria-label="Đưa lên"
                        disabled={index === 0 || isReorderingRecall}
                        onClick={() => void handleMoveRecall(index, -1)}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          border: "1px solid var(--border)",
                          background: "var(--paper)",
                          color: "var(--muted)",
                          cursor:
                            index === 0 || isReorderingRecall
                              ? "default"
                              : "pointer",
                          opacity: index === 0 || isReorderingRecall ? 0.45 : 1,
                        }}
                      >
                        <ArrowUp size={15} />
                      </button>
                      <button
                        type="button"
                        aria-label="Đưa xuống"
                        disabled={
                          index === recallItems.length - 1 || isReorderingRecall
                        }
                        onClick={() => void handleMoveRecall(index, 1)}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          border: "1px solid var(--border)",
                          background: "var(--paper)",
                          color: "var(--muted)",
                          cursor:
                            index === recallItems.length - 1 ||
                            isReorderingRecall
                              ? "default"
                              : "pointer",
                          opacity:
                            index === recallItems.length - 1 ||
                            isReorderingRecall
                              ? 0.45
                              : 1,
                        }}
                      >
                        <ArrowDown size={15} />
                      </button>
                      <button
                        type="button"
                        aria-label="Xóa"
                        onClick={() => void handleDeleteRecall(item.id)}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          border: "1px solid var(--border)",
                          background: "var(--paper)",
                          color: "var(--rose)",
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              <input
                className="sm-in"
                type="text"
                placeholder="+ Thêm điểm cần nhớ"
                value={newRecallContent}
                onChange={(e) => setNewRecallContent(e.target.value)}
                disabled={isCreatingRecall}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleCreateRecall();
                  }
                }}
                style={{
                  width: "100%",
                  height: 42,
                  marginTop: recallItems.length ? 8 : 0,
                  border: "1px dashed var(--border)",
                  borderRadius: 14,
                  background: "var(--paper)",
                  color: "var(--ink)",
                  padding: "0 13px",
                  fontFamily: "var(--body)",
                  fontSize: ".95rem",
                }}
              />
            </>
          ) : (
            <p style={{ margin: 0, color: "var(--muted)", fontSize: ".92rem" }}>
              Lưu bài học để thêm điểm cần nhớ.
            </p>
          )}
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
            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
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
