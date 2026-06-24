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
  subject: string | null;
  setSubject: (s: string | null) => void;
  difficulty: string | null;
  setDifficulty: (d: string | null) => void;
  saveText: string;
  saving: boolean;
  forceSave: () => Promise<void>;
  pendingDraft: DraftPayload | null;
  acceptDraft: () => void;
  discardDraft: () => void;
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

  titleRef.current = title;
  originalTitleRef.current = originalTitle;
  isNewRef.current = isNew;
  contentRef.current = content;
  subjectRef.current = subject;
  difficultyRef.current = difficulty;

  useEffect(() => {
    setContentState(initialContent);
    contentRef.current = initialContent;
    setSubjectState(initialSubject);
    subjectRef.current = initialSubject;
    setDifficultyState(initialDifficulty);
    difficultyRef.current = initialDifficulty;
    setSaveText(isNew ? "Chưa lưu" : "Đã lưu");
    setDirty(false);
  }, [draftKey]);

  useEffect(() => {
    const draft = readDraft(draftKey);
    if (!draft) return;
    if (draft.ts > loadedAt) {
      setPendingDraft(draft);
    }
  }, [draftKey, loadedAt]);

  useEffect(() => {
    if (hydrateKey === 0) return;
    setContentState(initialContent);
    contentRef.current = initialContent;
    setSubjectState(initialSubject);
    subjectRef.current = initialSubject;
    setDifficultyState(initialDifficulty);
    difficultyRef.current = initialDifficulty;
    setSaveText(isNew ? "Chưa lưu" : "Đã lưu");
    setDirty(false);
  }, [hydrateKey, initialContent, initialSubject, initialDifficulty, isNew]);

  const persistDraft = useCallback(() => {
    writeDraft(
      draftKey,
      contentRef.current,
      subjectRef.current,
      difficultyRef.current,
    );
  }, [draftKey]);

  const runSave = useCallback(async () => {
    if (savingRef.current) {
      pendingSaveRef.current = true;
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setSaveText("Đang lưu…");
    try {
      do {
        pendingSaveRef.current = false;
        const trimmed = titleRef.current.trim();
        if (!trimmed) break;
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
          setDirty(false);
          setSaveText("Đã lưu");
          onSavedRef.current?.(note);
        }
      } while (pendingSaveRef.current);
    } catch (e) {
      pendingSaveRef.current = false;
      const message =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Lưu thất bại";
      setSaveText("Lỗi lưu");
      onErrorRef.current?.(message);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
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

  const setContent = useCallback(
    (blocks: unknown[]) => {
      setContentState(blocks);
      contentRef.current = blocks;
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

  const forceSave = useCallback(async () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    await runSave();
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