import type { PartialBlock } from "@blocknote/core";
import { filterSuggestionItems } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import {
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote,
  useEditorChange,
} from "@blocknote/react";
import { useCallback, useEffect, useRef } from "react";

import {
  resolveAttachmentPreviewUrl,
  uploadAttachment,
} from "../../api/attachments";
import { useTheme } from "../../hooks/useTheme";
import { schema } from "./schema";
import {
  insertFormulaItem,
  insertMaterialItem,
  insertPdfItem,
  type ReportUploadError,
  type UploadAttachmentForBlock,
} from "./slashMenu";
import "./theme.css";

export type EditorProps = {
  initialContent?: unknown[];
  onChange?: (blocks: unknown[]) => void;
  readOnly?: boolean;
  noteId?: string;
  onUploadError?: (file: File, error: Error) => void;
  onUploadSuccess?: (file: File) => void;
};

function toPartialBlocks(initialContent: unknown[] | undefined) {
  return (initialContent ?? []) as PartialBlock<
    typeof schema.blockSchema,
    typeof schema.inlineContentSchema,
    typeof schema.styleSchema
  >[];
}

function EditorEditable({
  initialContent,
  onChange,
  noteId,
  onUploadError,
  onUploadSuccess,
}: {
  initialContent?: unknown[];
  onChange?: (blocks: unknown[]) => void;
  noteId?: string;
  onUploadError?: (file: File, error: Error) => void;
  onUploadSuccess?: (file: File) => void;
}) {
  const { theme } = useTheme();

  const noteIdRef = useRef(noteId);
  const onUploadErrorRef = useRef(onUploadError);
  const onUploadSuccessRef = useRef(onUploadSuccess);

  useEffect(() => {
    noteIdRef.current = noteId;
  }, [noteId]);

  useEffect(() => {
    onUploadErrorRef.current = onUploadError;
  }, [onUploadError]);

  useEffect(() => {
    onUploadSuccessRef.current = onUploadSuccess;
  }, [onUploadSuccess]);

  const reportUploadError = useCallback<ReportUploadError>((file, error) => {
    onUploadErrorRef.current?.(file, error);
  }, []);

  const uploadAttachmentForBlock = useCallback<UploadAttachmentForBlock>(
    async (file) => {
      try {
        const attachment = await uploadAttachment(file, noteIdRef.current);
        onUploadSuccessRef.current?.(file);
        return attachment;
      } catch (error) {
        reportUploadError(
          file,
          error instanceof Error ? error : new Error("Upload failed"),
        );
        throw error;
      }
    },
    [reportUploadError],
  );

  const editor = useCreateBlockNote({
    schema,
    initialContent: toPartialBlocks(initialContent),
    uploadFile: async (file) => {
      const attachment = await uploadAttachmentForBlock(file);
      return attachment.url;
    },
    resolveFileUrl: resolveAttachmentPreviewUrl,
  });

  const appliedContentRef = useRef<unknown[] | undefined>(initialContent);

  useEffect(() => {
    if (initialContent === appliedContentRef.current) return;
    appliedContentRef.current = initialContent;
    editor.replaceBlocks(editor.document, toPartialBlocks(initialContent));
  }, [editor, initialContent]);

  const handleChange = useCallback(() => {
    onChange?.(editor.document as unknown[]);
  }, [editor, onChange]);

  useEditorChange(handleChange, editor);

  return (
    <BlockNoteView
      editor={editor}
      slashMenu={false}
      theme={theme}
      data-ph="Bắt đầu viết bài học của bạn…"
    >
      <SuggestionMenuController
        triggerCharacter="/"
        getItems={async (query) =>
          filterSuggestionItems(
            [
              insertFormulaItem(editor),
              insertPdfItem(editor, uploadAttachmentForBlock, reportUploadError),
              insertMaterialItem(
                editor,
                uploadAttachmentForBlock,
                reportUploadError,
              ),
              ...getDefaultReactSlashMenuItems(editor),
            ],
            query,
          )
        }
      />
    </BlockNoteView>
  );
}

function EditorReadOnly({ initialContent }: { initialContent?: unknown[] }) {
  const { theme } = useTheme();

  const editor = useCreateBlockNote({
    schema,
    initialContent: toPartialBlocks(initialContent),
    resolveFileUrl: resolveAttachmentPreviewUrl,
  });

  const appliedContentRef = useRef<unknown[] | undefined>(initialContent);

  useEffect(() => {
    if (initialContent === appliedContentRef.current) return;
    appliedContentRef.current = initialContent;
    editor.replaceBlocks(editor.document, toPartialBlocks(initialContent));
  }, [editor, initialContent]);

  return (
    <BlockNoteView
      editor={editor}
      slashMenu={false}
      editable={false}
      theme={theme}
      data-ph="Bắt đầu viết bài học của bạn…"
    />
  );
}

export function Editor({
  initialContent,
  onChange,
  readOnly,
  noteId,
  onUploadError,
  onUploadSuccess,
}: EditorProps) {
  if (readOnly) {
    return <EditorReadOnly initialContent={initialContent} />;
  }
  return (
    <EditorEditable
      initialContent={initialContent}
      onChange={onChange}
      noteId={noteId}
      onUploadError={onUploadError}
      onUploadSuccess={onUploadSuccess}
    />
  );
}