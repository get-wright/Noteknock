import type { BlockNoteEditor } from "@blocknote/core";
import { File, FileText, Sigma } from "lucide-react";
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

export function insertPdfItem(editor: Editor) {
  return {
    title: "PDF",
    subtext: "Chèn khối xem trước PDF",
    onItemClick: () => {
      const pos = editor.getTextCursorPosition();
      editor.insertBlocks(
        [
          {
            type: "pdf",
            props: {
              url: "",
              name: "",
              caption: "",
              showPreview: true,
            },
          },
        ],
        pos.block,
        "after",
      );
    },
    aliases: ["pdf", "xem trước pdf", "xem truoc pdf", "preview pdf"],
    icon: createElement(FileText, { size: 18 }),
  };
}

export function insertMaterialItem(editor: Editor) {
  return {
    title: "Tệp tài liệu",
    subtext: "Chèn thẻ tệp DOCX và tài liệu học",
    onItemClick: () => {
      const pos = editor.getTextCursorPosition();
      editor.insertBlocks(
        [
          {
            type: "material",
            props: {
              url: "",
              name: "",
              contentType: "",
              sizeBytes: 0,
            },
          },
        ],
        pos.block,
        "after",
      );
    },
    aliases: ["file", "docx", "material", "tài liệu", "tai lieu"],
    icon: createElement(File, { size: 18 }),
  };
}
