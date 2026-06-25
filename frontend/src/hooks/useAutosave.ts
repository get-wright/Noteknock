import { useCallback, useEffect, useRef, useState } from "react";
import { createNote, updateNote, type Note } from "../api/notes";
import { ApiError } from "../api/client";

const DEBOUNCE_MS = 900;
const DRAFT_PREFIX = "noteknock_draft_";

type DraftPayload = {
  content: unknown[];
  subject: string | null;
  difficulty: string | null;
  ts: number;
};

export type UseAutosaveOptions = {
  draftKey: string;
  title: string;
  originalTitle: string;
  isNew: boolean;
  initialContent: unknown[];
  initialSubject: string | null;
  initialDifficulty: string | null;
  loadedAt?: number;
  hydrateKey?: number;
  onSaved?: (note: Note) => void;
  onError?: (message: string) => void;
  onPromotedFromNew?: (note: Note) => void;
};

export type UseAutosaveReturn = {
  content: unknown[];
  setContent: (blocks: unknown[]) => void;
  onEditorChange: (blocks: unknown[]) => void;
  subject: string | null;
  setSubject: (s: string | null) => void;
  difficulty: string | null;
  setDifficulty: (d: string | null) => void;
  saveText: string;
  saving: boolean;
  forceSave: () => Promise<Note | null>;
  pendingDraft: DraftPayload | null;
  acceptDraft: () => void;
  discardDraft: () => void;
};

type SaveResult = {
  note: Note | null;
  error: Error | null;
};

function draftStorageKey(draftKey: string): string {
  return `${DRAFT_PREFIX}${draftKey}`;
}

function readDraft(draftKey: string): DraftPayload | null {
  try {
    const raw = localStorage.getItem(draftStorageKey(draftKey));
    if (!raw) return null;
    return JSON.parse(raw) as DraftPayload;
  } catch {
    return null;
  }
}

function writeDraft(
  draftKey: string,
  content: unknown[],
  subject: string | null,
  difficulty: string | null,
): void {
  const payload: DraftPayload = {
    content,
    subject,
    difficulty,
    ts: Date.now(),
  };
  localStorage.setItem(draftStorageKey(draftKey), JSON.stringify(payload));
}

function clearDraft(draftKey: string): void {
  localStorage.removeItem(draftStorageKey(draftKey));
}

const LEGACY_NEW_DRAFT_KEY = "__new__";

function blocksToPlainText(blocks: unknown[]): string {
  if (!Array.isArray(blocks)) return "";
  let out = "";
  const walk = (items: unknown[]) => {
    for (const block of items) {
      if (!block || typeof block !== "object") continue;
      const b = block as {
        type?: string;
        content?: unknown[];
        children?: unknown[];
      };
      if (b.type === "code") continue;
      if (Array.isArray(b.content)) {
        for (const inline of b.content) {
          if (inline && typeof inline === "object" && "text" in inline) {
            const t = (inline as { text?: string }).text;
            if (typeof t === "string") out += `${t} `;
          }
        }
      }
      if (Array.isArray(b.children)) walk(b.children);
    }
  };
  walk(blocks);
  return out.replace(/\s+/g, " ").trim();
}

function isMeaningfulDraft(
  content: unknown[],
  subject: string | null,
  difficulty: string | null,
): boolean {
  if (subject != null || difficulty != null) return true;
  return blocksToPlainText(content).length > 0;
}

function serializeBlocks(blocks: unknown[]): string {
  try {
    return JSON.stringify(blocks);
  } catch {
    return "";
  }
}

export function useAutosave(opts: UseAutosaveOptions): UseAutosaveReturn {
  const {
    draftKey,
    title,
    originalTitle,
    isNew,
    initialContent,
    initialSubject,
    initialDifficulty,
    loadedAt = 0,
    hydrateKey = 0,
  } = opts;

  const onSavedRef = useRef(opts.onSaved);
  const onErrorRef = useRef(opts.onError);
  const onPromotedFromNewRef = useRef(opts.onPromotedFromNew);

  useEffect(() => {
    onSavedRef.current = opts.onSaved;
    onErrorRef.current = opts.onError;
    onPromotedFromNewRef.current = opts.onPromotedFromNew;
  });

  const [content, setContentState] = useState<unknown[]>(initialContent);
  const [subject, setSubjectState] = useState<string | null>(initialSubject);
  const [difficulty, setDifficultyState] = useState<string | null>(
    initialDifficulty,
  );
  const [saveText, setSaveText] = useState(
    isNew ? "Chưa lưu" : "Đã lưu",
  );
  const [saving, setSaving] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<DraftPayload | null>(null);
  const [dirty, setDirty] = useState(false);

  const titleRef = useRef(title);
  const originalTitleRef = useRef(originalTitle);
  const isNewRef = useRef(isNew);
  const contentRef = useRef(content);
  const subjectRef = useRef(subject);
  const difficultyRef = useRef(difficulty);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);
  const pendingSaveRef = useRef(false);
  const savePromiseRef = useRef<Promise<SaveResult> | null>(null);
  const editorBaselineRef = useRef(serializeBlocks(initialContent));

  titleRef.current = title;
  originalTitleRef.current = originalTitle;
  isNewRef.current = isNew;
  contentRef.current = content;
  subjectRef.current = subject;
  difficultyRef.current = difficulty;

  useEffect(() => {
    setContentState(initialContent);
    contentRef.current = initialContent;
    editorBaselineRef.current = serializeBlocks(initialContent);
    setSubjectState(initialSubject);
    subjectRef.current = initialSubject;
    setDifficultyState(initialDifficulty);
    difficultyRef.current = initialDifficulty;
    setSaveText(isNew ? "Chưa lưu" : "Đã lưu");
    setDirty(false);
    setPendingDraft(null);
  }, [draftKey, initialContent, initialSubject, initialDifficulty, isNew]);

  const didDraftCheckRef = useRef<string | null>(null);

  useEffect(() => {
    if (didDraftCheckRef.current === draftKey) return;
    if (loadedAt === 0 && !isNew) return;
    didDraftCheckRef.current = draftKey;
    if (isNew) {
      clearDraft(LEGACY_NEW_DRAFT_KEY);
    }
    const draft = readDraft(draftKey);
    if (!draft) return;
    if (
      !isMeaningfulDraft(draft.content, draft.subject, draft.difficulty)
    ) {
      clearDraft(draftKey);
      return;
    }
    if (draft.ts > loadedAt) {
      setPendingDraft(draft);
    }
  }, [draftKey, loadedAt, isNew]);

  useEffect(() => {
    if (hydrateKey === 0) return;
    setContentState(initialContent);
    contentRef.current = initialContent;
    editorBaselineRef.current = serializeBlocks(initialContent);
    setSubjectState(initialSubject);
    subjectRef.current = initialSubject;
    setDifficultyState(initialDifficulty);
    difficultyRef.current = initialDifficulty;
    setSaveText(isNew ? "Chưa lưu" : "Đã lưu");
    setDirty(false);
  }, [hydrateKey, initialContent, initialSubject, initialDifficulty, isNew]);

  const persistDraft = useCallback(() => {
    const content = contentRef.current;
    const subject = subjectRef.current;
    const difficulty = difficultyRef.current;
    if (isMeaningfulDraft(content, subject, difficulty)) {
      writeDraft(draftKey, content, subject, difficulty);
    } else {
      clearDraft(draftKey);
    }
  }, [draftKey]);

  const runSave = useCallback(async (): Promise<SaveResult> => {
    if (savingRef.current) {
      pendingSaveRef.current = true;
      return savePromiseRef.current ?? { note: null, error: null };
    }
    savingRef.current = true;
    setSaving(true);
    setSaveText("Đang lưu…");
    const savePromise = (async (): Promise<SaveResult> => {
      let savedNote: Note | null = null;
      try {
        do {
          pendingSaveRef.current = false;
          const trimmed = titleRef.current.trim();
          if (!trimmed) return { note: null, error: null };
          let note: Note;
          if (isNewRef.current) {
            note = await createNote({
              title: trimmed,
              content: contentRef.current,
              subject: subjectRef.current,
              difficulty: difficultyRef.current,
            });
            isNewRef.current = false;
            originalTitleRef.current = note.title;
            onPromotedFromNewRef.current?.(note);
          } else {
            const patch: Parameters<typeof updateNote>[1] = {
              newContent: contentRef.current,
              subject: subjectRef.current,
              difficulty: difficultyRef.current,
            };
            if (trimmed !== originalTitleRef.current) {
              patch.newTitle = trimmed;
            }
            note = await updateNote(originalTitleRef.current, patch);
            if (patch.newTitle) {
              originalTitleRef.current = note.title;
            }
          }
          if (!pendingSaveRef.current) {
            clearDraft(draftKey);
            editorBaselineRef.current = serializeBlocks(contentRef.current);
            setDirty(false);
            setSaveText("Đã lưu");
            onSavedRef.current?.(note);
          }
          savedNote = note;
        } while (pendingSaveRef.current);
        return { note: savedNote, error: null };
      } catch (e) {
        pendingSaveRef.current = false;
        const message =
          e instanceof ApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Lưu thất bại";
        const error = e instanceof Error ? e : new Error(message);
        setSaveText("Lỗi lưu");
        onErrorRef.current?.(message);
        return { note: null, error };
      } finally {
        savingRef.current = false;
        savePromiseRef.current = null;
        setSaving(false);
      }
    })();
    savePromiseRef.current = savePromise;
    return savePromise;
  }, [draftKey]);

  const scheduleSave = useCallback(() => {
    setDirty(true);
    setSaveText("Đang lưu…");
    persistDraft();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runSave();
    }, DEBOUNCE_MS);
  }, [persistDraft, runSave]);

  const onEditorChange = useCallback(
    (blocks: unknown[]) => {
      setContentState(blocks);
      contentRef.current = blocks;
      if (serializeBlocks(blocks) === editorBaselineRef.current) return;
      scheduleSave();
    },
    [scheduleSave],
  );

  const setContent = useCallback(
    (blocks: unknown[]) => {
      setContentState(blocks);
      contentRef.current = blocks;
      editorBaselineRef.current = serializeBlocks(blocks);
      scheduleSave();
    },
    [scheduleSave],
  );

  const setSubject = useCallback(
    (s: string | null) => {
      setSubjectState(s);
      subjectRef.current = s;
      scheduleSave();
    },
    [scheduleSave],
  );

  const setDifficulty = useCallback(
    (d: string | null) => {
      setDifficultyState(d);
      difficultyRef.current = d;
      scheduleSave();
    },
    [scheduleSave],
  );

  const forceSave = useCallback(async (): Promise<Note | null> => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    const result = await runSave();
    if (result.error) throw result.error;
    return result.note;
  }, [runSave]);

  useEffect(() => {
    if (!dirty) return;
    persistDraft();
  }, [content, subject, difficulty, dirty, persistDraft]);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  const acceptDraft = useCallback(() => {
    if (!pendingDraft) return;
    setContentState(pendingDraft.content);
    setSubjectState(pendingDraft.subject);
    setDifficultyState(pendingDraft.difficulty);
    contentRef.current = pendingDraft.content;
    subjectRef.current = pendingDraft.subject;
    difficultyRef.current = pendingDraft.difficulty;
    editorBaselineRef.current = serializeBlocks(pendingDraft.content);
    setPendingDraft(null);
    setDirty(true);
    setSaveText("Chưa lưu");
    scheduleSave();
  }, [pendingDraft, scheduleSave]);

  const discardDraft = useCallback(() => {
    clearDraft(draftKey);
    setPendingDraft(null);
  }, [draftKey]);

  return {
    content,
    setContent,
    onEditorChange,
    subject,
    setSubject,
    difficulty,
    setDifficulty,
    saveText,
    saving,
    forceSave,
    pendingDraft,
    acceptDraft,
    discardDraft,
  };
}
