import {
  BlockNoteSchema,
  defaultBlockSpecs,
} from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";
import { Download, ExternalLink, FileText } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  isAttachmentAppUrl,
  resolveAttachmentDownloadUrl,
  resolveAttachmentPreviewUrl,
} from "../../api/attachments";

const PDF_MIN_WIDTH = 280;
const PDF_MAX_WIDTH = 960;
const PDF_MIN_HEIGHT = 320;
const PDF_MAX_HEIGHT = 960;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function pdfViewerUrl(url: string): string {
  const parsed = new URL(url);
  const hash = new URLSearchParams(parsed.hash.replace(/^#/, ""));
  hash.set("toolbar", "0");
  hash.set("navpanes", "0");
  hash.set("scrollbar", "0");
  hash.set("view", "FitH");
  parsed.hash = hash.toString();
  return parsed.toString();
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  const rounded =
    size < 10 && unitIndex > 0 ? size.toFixed(1) : String(Math.round(size));
  return `${rounded} ${units[unitIndex]}`;
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "text/plain": "TXT",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "DOCX",
  "application/vnd.ms-powerpoint": "PPT",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "PPTX",
  "application/vnd.ms-excel": "XLS",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "application/zip": "ZIP",
};

function formatContentTypeLabel(contentType: string, filename: string): string {
  const normalized = contentType.split(";", 1)[0].trim().toLowerCase();
  if (CONTENT_TYPE_LABELS[normalized]) {
    return CONTENT_TYPE_LABELS[normalized];
  }

  const extension = filename.split(".").pop()?.trim().toUpperCase();
  if (extension && extension !== filename.toUpperCase() && extension.length <= 5) {
    return extension;
  }

  return normalized ? "Tệp" : "";
}

type ResolvedAttachmentUrlState = {
  sourceUrl: string;
  previewUrl: string | null;
  downloadUrl: string | null;
  isResolving: boolean;
  hasError: boolean;
};

const emptyResolvedAttachmentUrlState: ResolvedAttachmentUrlState = {
  sourceUrl: "",
  previewUrl: null,
  downloadUrl: null,
  isResolving: false,
  hasError: false,
};

function useResolvedAttachmentUrls(url: string) {
  const [state, setState] = useState<ResolvedAttachmentUrlState>(
    emptyResolvedAttachmentUrlState,
  );

  useEffect(() => {
    if (!url) {
      setState(emptyResolvedAttachmentUrlState);
      return;
    }

    if (!isAttachmentAppUrl(url)) {
      setState({
        ...emptyResolvedAttachmentUrlState,
        sourceUrl: url,
      });
      return;
    }

    let cancelled = false;

    setState({
      sourceUrl: url,
      previewUrl: null,
      downloadUrl: null,
      isResolving: true,
      hasError: false,
    });

    void Promise.all([
      resolveAttachmentPreviewUrl(url),
      resolveAttachmentDownloadUrl(url),
    ])
      .then(([previewUrl, downloadUrl]) => {
        if (!cancelled) {
          setState({
            sourceUrl: url,
            previewUrl,
            downloadUrl,
            isResolving: false,
            hasError: false,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({
            sourceUrl: url,
            previewUrl: null,
            downloadUrl: null,
            isResolving: false,
            hasError: true,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!url) {
    return {
      previewUrl: null,
      downloadUrl: null,
      isAttachmentUrl: false,
      isResolving: false,
      hasError: false,
    };
  }

  if (!isAttachmentAppUrl(url)) {
    return {
      previewUrl: null,
      downloadUrl: null,
      isAttachmentUrl: false,
      isResolving: false,
      hasError: false,
    };
  }

  if (state.sourceUrl !== url) {
    return {
      previewUrl: null,
      downloadUrl: null,
      isAttachmentUrl: true,
      isResolving: true,
      hasError: false,
    };
  }

  return {
    previewUrl: state.previewUrl,
    downloadUrl: state.downloadUrl,
    isAttachmentUrl: true,
    isResolving: state.isResolving,
    hasError: state.hasError,
  };
}

type PdfBlockProps = {
  url: string;
  name: string;
  caption: string;
  showPreview: boolean;
  previewWidth: number | undefined;
  previewHeight: number | undefined;
};

function PdfBlockView({
  block,
  editor,
  props,
}: {
  block: { id: string };
  editor: {
    updateBlock: (block: { id: string }, update: { props: Partial<PdfBlockProps> }) => void;
  };
  props: PdfBlockProps;
}) {
  const { url, name, caption, showPreview, previewWidth, previewHeight } = props;
  const previewShellRef = useRef<HTMLDivElement | null>(null);
  const [draftSize, setDraftSize] = useState<{
    width: number | undefined;
    height: number | undefined;
  }>({ width: previewWidth, height: previewHeight });
  const {
    previewUrl,
    downloadUrl,
    isAttachmentUrl,
    isResolving,
    hasError,
  } = useResolvedAttachmentUrls(url);
  const displayName = name || "PDF";
  const embedUrl = previewUrl ? pdfViewerUrl(previewUrl) : null;

  useEffect(() => {
    setDraftSize({ width: previewWidth, height: previewHeight });
  }, [previewHeight, previewWidth]);

  const handleResizePointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      const rect = previewShellRef.current?.getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;
      const startWidth = rect?.width ?? previewWidth ?? PDF_MIN_WIDTH;
      const startHeight = rect?.height ?? previewHeight ?? 420;

      let nextWidth = startWidth;
      let nextHeight = startHeight;

      const handlePointerMove = (moveEvent: PointerEvent) => {
        nextWidth = clamp(
          startWidth + moveEvent.clientX - startX,
          PDF_MIN_WIDTH,
          PDF_MAX_WIDTH,
        );
        nextHeight = clamp(
          startHeight + moveEvent.clientY - startY,
          PDF_MIN_HEIGHT,
          PDF_MAX_HEIGHT,
        );
        setDraftSize({ width: nextWidth, height: nextHeight });
      };

      const finishResize = () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", finishResize);
        editor.updateBlock(block, {
          props: {
            previewWidth: Math.round(nextWidth),
            previewHeight: Math.round(nextHeight),
          },
        });
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", finishResize, { once: true });
    },
    [block, editor, previewHeight, previewWidth],
  );

  if (!url) {
    return (
      <div className="bn-pdf-block bn-pdf-block--empty" contentEditable={false}>
        <p className="bn-pdf-placeholder">
          Tải lên hoặc chọn PDF để xem trước tại đây.
        </p>
      </div>
    );
  }

  return (
    <div className="bn-pdf-block" contentEditable={false}>
      <div className="bn-pdf-header">
        <span className="bn-pdf-name">{displayName}</span>
        <div className="bn-pdf-actions">
          {previewUrl ? (
            <a
              className="bn-pdf-action"
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={16} />
              Mở
            </a>
          ) : (
            <span
              className="bn-pdf-action bn-attachment-action--disabled"
              aria-disabled="true"
            >
              <ExternalLink size={16} />
              Mở
            </span>
          )}
          {downloadUrl ? (
            <a
              className="bn-pdf-action"
              href={downloadUrl}
              download={name || undefined}
              target="_blank"
              rel="noreferrer"
            >
              <Download size={16} />
              Tải xuống
            </a>
          ) : (
            <span
              className="bn-pdf-action bn-attachment-action--disabled"
              aria-disabled="true"
            >
              <Download size={16} />
              Tải xuống
            </span>
          )}
        </div>
      </div>
      {!isAttachmentUrl ? (
        <p className="bn-attachment-status bn-attachment-status--error">
          URL này không phải tệp đính kèm đã tải lên.
        </p>
      ) : null}
      {isAttachmentUrl && isResolving ? (
        <p className="bn-attachment-status">Đang chuẩn bị xem trước…</p>
      ) : null}
      {isAttachmentUrl && hasError ? (
        <p className="bn-attachment-status bn-attachment-status--error">
          Không thể tạo liên kết xem trước hoặc tải xuống.
        </p>
      ) : null}
      {isAttachmentUrl && showPreview && embedUrl ? (
        <div
          className="bn-pdf-preview-shell"
          ref={previewShellRef}
          style={draftSize.width ? { width: draftSize.width } : undefined}
        >
          <iframe
            className="bn-pdf-frame"
            src={embedUrl}
            title={displayName}
            style={draftSize.height ? { height: draftSize.height } : undefined}
          />
          <button
            type="button"
            className="bn-pdf-resize-handle"
            aria-label="Đổi kích thước xem trước PDF"
            title="Kéo để đổi kích thước"
            onPointerDown={handleResizePointerDown}
          />
        </div>
      ) : null}
      {caption ? <p className="bn-pdf-caption">{caption}</p> : null}
    </div>
  );
}

type MaterialBlockProps = {
  url: string;
  name: string;
  contentType: string;
  sizeBytes: number;
};

function MaterialBlockView({ props }: { props: MaterialBlockProps }) {
  const { url, name, contentType, sizeBytes } = props;
  const {
    previewUrl,
    downloadUrl,
    isAttachmentUrl,
    isResolving,
    hasError,
  } = useResolvedAttachmentUrls(url);
  const displayName = name || "Tài liệu";
  const metaParts = [
    formatContentTypeLabel(contentType, name),
    formatBytes(sizeBytes),
  ].filter(Boolean);

  if (!url) {
    return (
      <div
        className="bn-material-card bn-material-card--empty"
        contentEditable={false}
      >
        <p className="bn-material-placeholder">
          Tải lên hoặc chọn tệp tài liệu để hiển thị tại đây.
        </p>
      </div>
    );
  }

  return (
    <div className="bn-material-card" contentEditable={false}>
      <div className="bn-material-icon" aria-hidden="true">
        <FileText size={22} />
      </div>
      <div className="bn-material-body">
        <span className="bn-material-name">{displayName}</span>
        {metaParts.length > 0 ? (
          <span className="bn-material-meta">{metaParts.join(" · ")}</span>
        ) : null}
        {!isAttachmentUrl ? (
          <span className="bn-attachment-status bn-attachment-status--error">
            URL này không phải tệp đính kèm đã tải lên.
          </span>
        ) : null}
        {isAttachmentUrl && isResolving ? (
          <span className="bn-attachment-status">Đang chuẩn bị liên kết…</span>
        ) : null}
        {isAttachmentUrl && hasError ? (
          <span className="bn-attachment-status bn-attachment-status--error">
            Không thể tạo liên kết xem trước hoặc tải xuống.
          </span>
        ) : null}
      </div>
      <div className="bn-material-actions">
        {previewUrl ? (
          <a
            className="bn-material-action"
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink size={16} />
            Mở
          </a>
        ) : (
          <span
            className="bn-material-action bn-attachment-action--disabled"
            aria-disabled="true"
          >
            <ExternalLink size={16} />
            Mở
          </span>
        )}
        {downloadUrl ? (
          <a
            className="bn-material-action"
            href={downloadUrl}
            download={name || undefined}
            target="_blank"
            rel="noreferrer"
          >
            <Download size={16} />
            Tải xuống
          </a>
        ) : (
          <span
            className="bn-material-action bn-attachment-action--disabled"
            aria-disabled="true"
          >
            <Download size={16} />
            Tải xuống
          </span>
        )}
      </div>
    </div>
  );
}

const formulaBlock = createReactBlockSpec(
  {
    type: "formula",
    propSchema: {
      formula: { default: "" },
    },
    content: "none",
  },
  {
    render: ({ block }) => {
      const text = block.props.formula;
      const empty = !text;
      return (
        <div
          className={`bn-formula-block${empty ? " bn-formula-block--empty" : ""}`}
          contentEditable={false}
        >
          {empty ? "∫ u dv = u·v − ∫ v du" : text}
        </div>
      );
    },
  },
);

const pdfBlock = createReactBlockSpec(
  {
    type: "pdf",
    propSchema: {
      url: { default: "" },
      name: { default: "" },
      caption: { default: "" },
      showPreview: { default: true },
      previewWidth: { default: undefined, type: "number" },
      previewHeight: { default: undefined, type: "number" },
    },
    content: "none",
  },
  {
    render: ({ block, editor }) => (
      <PdfBlockView block={block} editor={editor} props={block.props} />
    ),
  },
);

const materialBlock = createReactBlockSpec(
  {
    type: "material",
    propSchema: {
      url: { default: "" },
      name: { default: "" },
      contentType: { default: "" },
      sizeBytes: { default: 0, type: "number" },
    },
    content: "none",
  },
  {
    render: ({ block }) => <MaterialBlockView props={block.props} />,
  },
);

export const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    formula: formulaBlock,
    pdf: pdfBlock,
    material: materialBlock,
  },
});
