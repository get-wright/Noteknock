import type { BlockNoteEditor } from "@blocknote/core";
import { Sigma } from "lucide-react";
import { createElement } from "react";

import type { schema } from "./schema";

type Editor = BlockNoteEditor<
  (typeof schema)["blockSchema"],
  (typeof schema)["inlineContentSchema"],
  (typeof schema)["styleSchema"]
>;

export function insertFormulaItem(editor: Editor) {
  return {
    title: "Công thức",
    subtext: "Chèn khối công thức",
    onItemClick: () => {
      const pos = editor.getTextCursorPosition();
      editor.insertBlocks(
        [{ type: "formula", props: { formula: "" } }],
        pos.block,
        "after",
      );
    },
    aliases: ["formula", "công thức", "cong thuc"],
    icon: createElement(Sigma, { size: 18 }),
  };
}