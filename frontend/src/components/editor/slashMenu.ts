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
export type ReportUploadError = (file: File, error: Error) => void;

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

function toError(error: unknown, fallbackMessage: string): Error {
  return error instanceof Error ? error : new Error(fallbackMessage);
}

export function pickFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.style.display = "none";

    let settled = false;
    let pickerOpenedAt = 0;
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
      const elapsed = Date.now() - pickerOpenedAt;
      const settleDelay = elapsed < 600 ? 800 : 350;
      window.setTimeout(() => {
        if (input.files?.length) {
          finish(input.files[0]);
          return;
        }
        finish(null);
      }, settleDelay);
    };

    document.body.appendChild(input);
    window.addEventListener("focus", onWindowFocus);
    pickerOpenedAt = Date.now();
    input.click();
  });
}

type InsertionAnchor = ReturnType<Editor["getTextCursorPosition"]>["block"];

export function insertAfterAnchor(
  editor: Editor,
  anchor: InsertionAnchor,
  blocks: PartialBlock<
    (typeof schema)["blockSchema"],
    (typeof schema)["inlineContentSchema"],
    (typeof schema)["styleSchema"]
  >[],
) {
  editor.insertBlocks(blocks, anchor, "after");
}

function tryInsertAfterAnchor(
  editor: Editor,
  anchor: InsertionAnchor,
  blocks: PartialBlock<
    (typeof schema)["blockSchema"],
    (typeof schema)["inlineContentSchema"],
    (typeof schema)["styleSchema"]
  >[],
  file?: File,
  reportUploadError?: ReportUploadError,
) {
  try {
    insertAfterAnchor(editor, anchor, blocks);
  } catch (error) {
    if (file && reportUploadError) {
      reportUploadError(
        file,
        toError(error, "Could not insert uploaded attachment"),
      );
    }
  }
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
      const anchor = editor.getTextCursorPosition().block;
      insertAfterAnchor(editor, anchor, [
        { type: "formula", props: { formula: "" } },
      ]);
    },
    aliases: ["formula", "công thức", "cong thuc"],
    icon: createElement(Sigma, { size: 18 }),
  };
}

export function insertPdfItem(
  editor: Editor,
  uploadAttachmentForBlock?: UploadAttachmentForBlock,
  reportUploadError?: ReportUploadError,
) {
  return {
    title: "PDF",
    subtext: "Chèn khối xem trước PDF",
    onItemClick: () => {
      const anchor = editor.getTextCursorPosition().block;
      void (async () => {
        if (!uploadAttachmentForBlock) {
          tryInsertAfterAnchor(editor, anchor, [emptyPdfBlock()]);
          return;
        }

        const file = await pickFile(".pdf,application/pdf");
        if (!file) {
          tryInsertAfterAnchor(editor, anchor, [emptyPdfBlock()]);
          return;
        }

        let attachment: Attachment;
        try {
          attachment = await uploadAttachmentForBlock(file);
        } catch {
          // Error reported via onUploadError callback.
          return;
        }

        tryInsertAfterAnchor(
          editor,
          anchor,
          [populatedPdfBlock(attachment)],
          file,
          reportUploadError,
        );
      })();
    },
    aliases: ["pdf", "xem trước pdf", "xem truoc pdf", "preview pdf"],
    icon: createElement(FileText, { size: 18 }),
  };
}

export function insertMaterialItem(
  editor: Editor,
  uploadAttachmentForBlock?: UploadAttachmentForBlock,
  reportUploadError?: ReportUploadError,
) {
  return {
    title: "Tệp tài liệu",
    subtext: "Chèn thẻ tệp DOCX và tài liệu học",
    onItemClick: () => {
      const anchor = editor.getTextCursorPosition().block;
      void (async () => {
        if (!uploadAttachmentForBlock) {
          tryInsertAfterAnchor(editor, anchor, [emptyMaterialBlock()]);
          return;
        }

        const file = await pickFile(MATERIAL_ACCEPT);
        if (!file) {
          tryInsertAfterAnchor(editor, anchor, [emptyMaterialBlock()]);
          return;
        }

        let attachment: Attachment;
        try {
          attachment = await uploadAttachmentForBlock(file);
        } catch {
          // Error reported via onUploadError callback.
          return;
        }

        const block = isPdfFile(file)
          ? populatedPdfBlock(attachment)
          : populatedMaterialBlock(attachment, file);
        tryInsertAfterAnchor(editor, anchor, [block], file, reportUploadError);
      })();
    },
    aliases: ["file", "docx", "material", "tài liệu", "tai lieu"],
    icon: createElement(File, { size: 18 }),
  };
}
