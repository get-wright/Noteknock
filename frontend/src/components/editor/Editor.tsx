import type { PartialBlock } from "@blocknote/core";
import { filterSuggestionItems } from "@blocknote/core";
import {
  BlockNoteViewRaw,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote,
  useEditorChange,
} from "@blocknote/react";
import { useCallback, useEffect, useRef } from "react";

import { useTheme } from "../../hooks/useTheme";
import { schema } from "./schema";
import { insertFormulaItem } from "./slashMenu";
import "./theme.css";

export type EditorProps = {
  initialContent?: unknown[];
  onChange?: (blocks: unknown[]) => void;
  readOnly?: boolean;
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
}: {
  initialContent?: unknown[];
  onChange?: (blocks: unknown[]) => void;
}) {
  const { theme } = useTheme();

  const editor = useCreateBlockNote({
    schema,
    initialContent: toPartialBlocks(initialContent),
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
    <BlockNoteViewRaw
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
              ...getDefaultReactSlashMenuItems(editor),
            ],
            query,
          )
        }
      />
    </BlockNoteViewRaw>
  );
}

function EditorReadOnly({ initialContent }: { initialContent?: unknown[] }) {
  const { theme } = useTheme();

  const editor = useCreateBlockNote({
    schema,
    initialContent: toPartialBlocks(initialContent),
  });

  const appliedContentRef = useRef<unknown[] | undefined>(initialContent);

  useEffect(() => {
    if (initialContent === appliedContentRef.current) return;
    appliedContentRef.current = initialContent;
    editor.replaceBlocks(editor.document, toPartialBlocks(initialContent));
  }, [editor, initialContent]);

  return (
    <BlockNoteViewRaw
      editor={editor}
      slashMenu={false}
      editable={false}
      theme={theme}
    />
  );
}

export function Editor({ initialContent, onChange, readOnly }: EditorProps) {
  if (readOnly) {
    return <EditorReadOnly initialContent={initialContent} />;
  }
  return <EditorEditable initialContent={initialContent} onChange={onChange} />;
}