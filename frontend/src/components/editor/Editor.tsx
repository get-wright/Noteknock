import type { PartialBlock } from "@blocknote/core";
import { filterSuggestionItems } from "@blocknote/core";
import {
  BlockNoteViewRaw,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote,
  useEditorChange,
} from "@blocknote/react";
import { useCallback } from "react";

import { useTheme } from "../../hooks/useTheme";
import { schema } from "./schema";
import { insertFormulaItem } from "./slashMenu";
import "./theme.css";

export type EditorProps = {
  initialContent?: unknown[];
  onChange?: (blocks: unknown[]) => void;
};

export function Editor({ initialContent, onChange }: EditorProps) {
  const { theme } = useTheme();

  const editor = useCreateBlockNote({
    schema,
    initialContent: (initialContent ?? []) as PartialBlock<
      typeof schema.blockSchema,
      typeof schema.inlineContentSchema,
      typeof schema.styleSchema
    >[],
  });

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