import type { BlockNoteEditor, PartialBlock } from "@blocknote/core";
import { File, FileText, Sigma } from "lucide-react";
import { createElement } from "react";

import type { Attachment } from "../../api/attachments";
import type { schema } from "./schema";

type Editor = BlockNoteEditor<
  (typeof schema)["blockSchema"],
  (typeof schema)["inlineContentSchema"],
  (typeof schema)["styleSchema"]
>;

export type UploadAttachmentForBlock = (file: File) => Promise<Attachment>;

const MATERIAL_ACCEPT =
  ".doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.pdf";

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  txt: "text/plain",
  zip: "application/zip",
  pdf: "application/pdf",
};

export function isPdfFile(file: File): boolean {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}

export function formatContentType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ext ? (CONTENT_TYPE_BY_EXT[ext] ?? "") : "";
}

export function pickFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.style.display = "none";

    let settled = false;
    const finish = (file: File | null) => {
      if (settled) return;
      settled = true;
      input.remove();
      window.removeEventListener("focus", onWindowFocus);
      resolve(file);
    };

    input.addEventListener("change", () => {
      finish(input.files?.[0] ?? null);
    });

    const onWindowFocus = () => {
      window.setTimeout(() => finish(input.files?.[0] ?? null), 300);
    };

    document.body.appendChild(input);
    window.addEventListener("focus", onWindowFocus);
    input.click();
  });
}

export function insertAfterCursor(
  editor: Editor,
  blocks: PartialBlock<
    (typeof schema)["blockSchema"],
    (typeof schema)["inlineContentSchema"],
    (typeof schema)["styleSchema"]
  >[],
) {
  const pos = editor.getTextCursorPosition();
  editor.insertBlocks(blocks, pos.block, "after");
}

function emptyPdfBlock(): PartialBlock<
  (typeof schema)["blockSchema"],
  (typeof schema)["inlineContentSchema"],
  (typeof schema)["styleSchema"]
> {
  return {
    type: "pdf",
    props: {
      url: "",
      name: "",
      caption: "",
      showPreview: true,
    },
  };
}

function emptyMaterialBlock(): PartialBlock<
  (typeof schema)["blockSchema"],
  (typeof schema)["inlineContentSchema"],
  (typeof schema)["styleSchema"]
> {
  return {
    type: "material",
    props: {
      url: "",
      name: "",
      contentType: "",
      sizeBytes: 0,
    },
  };
}

function populatedPdfBlock(attachment: Attachment) {
  return {
    type: "pdf" as const,
    props: {
      url: attachment.url,
      name: attachment.filename,
      caption: "",
      showPreview: true,
    },
  };
}

function populatedMaterialBlock(attachment: Attachment, file: File) {
  return {
    type: "material" as const,
    props: {
      url: attachment.url,
      name: attachment.filename,
      contentType: attachment.contentType || formatContentType(file),
      sizeBytes: attachment.sizeBytes,
    },
  };
}

export function insertFormulaItem(editor: Editor) {
  return {
    title: "Công thức",
    subtext: "Chèn khối công thức",
    onItemClick: () => {
      insertAfterCursor(editor, [{ type: "formula", props: { formula: "" } }]);
    },
    aliases: ["formula", "công thức", "cong thuc"],
    icon: createElement(Sigma, { size: 18 }),
  };
}

export function insertPdfItem(
  editor: Editor,
  uploadAttachmentForBlock?: UploadAttachmentForBlock,
) {
  return {
    title: "PDF",
    subtext: "Chèn khối xem trước PDF",
    onItemClick: () => {
      void (async () => {
        if (!uploadAttachmentForBlock) {
          insertAfterCursor(editor, [emptyPdfBlock()]);
          return;
        }

        const file = await pickFile(".pdf,application/pdf");
        if (!file) {
          insertAfterCursor(editor, [emptyPdfBlock()]);
          return;
        }

        try {
          const attachment = await uploadAttachmentForBlock(file);
          insertAfterCursor(editor, [populatedPdfBlock(attachment)]);
        } catch {
          // Error reported via onUploadError callback.
        }
      })();
    },
    aliases: ["pdf", "xem trước pdf", "xem truoc pdf", "preview pdf"],
    icon: createElement(FileText, { size: 18 }),
  };
}

export function insertMaterialItem(
  editor: Editor,
  uploadAttachmentForBlock?: UploadAttachmentForBlock,
) {
  return {
    title: "Tệp tài liệu",
    subtext: "Chèn thẻ tệp DOCX và tài liệu học",
    onItemClick: () => {
      void (async () => {
        if (!uploadAttachmentForBlock) {
          insertAfterCursor(editor, [emptyMaterialBlock()]);
          return;
        }

        const file = await pickFile(MATERIAL_ACCEPT);
        if (!file) {
          insertAfterCursor(editor, [emptyMaterialBlock()]);
          return;
        }

        try {
          const attachment = await uploadAttachmentForBlock(file);
          if (isPdfFile(file)) {
            insertAfterCursor(editor, [populatedPdfBlock(attachment)]);
          } else {
            insertAfterCursor(editor, [
              populatedMaterialBlock(attachment, file),
            ]);
          }
        } catch {
          // Error reported via onUploadError callback.
        }
      })();
    },
    aliases: ["file", "docx", "material", "tài liệu", "tai lieu"],
    icon: createElement(File, { size: 18 }),
  };
}
