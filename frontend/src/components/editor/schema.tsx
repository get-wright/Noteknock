import {
  BlockNoteSchema,
  defaultBlockSpecs,
} from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";
import { renderAsync } from "docx-preview";
import { Download, ExternalLink, FileText } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  fetchAttachmentBlob,
  isAttachmentAppUrl,
  resolveAttachmentDownloadUrl,
  resolveAttachmentPreviewUrl,
  revokeResolvedAttachmentUrl,
} from "../../api/attachments";

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

function isDocxFile(contentType: string, filename: string): boolean {
  return (
    contentType
      .split(";", 1)[0]
      .trim()
      .toLowerCase() ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    filename.toLowerCase().endsWith(".docx")
  );
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
        if (cancelled) {
          revokeResolvedAttachmentUrl(url);
          return;
        }
        setState({
          sourceUrl: url,
          previewUrl,
          downloadUrl,
          isResolving: false,
          hasError: false,
        });
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
      revokeResolvedAttachmentUrl(url);
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
};

function PdfBlockView({ props }: { props: PdfBlockProps }) {
  const { url, name, caption, showPreview } = props;
  const {
    previewUrl,
    downloadUrl,
    isAttachmentUrl,
    isResolving,
    hasError,
  } = useResolvedAttachmentUrls(url);
  const displayName = name || "PDF";
  const embedUrl = previewUrl ? pdfViewerUrl(previewUrl) : null;

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
        <div className="bn-pdf-preview-shell bn-document-preview bn-document-preview--pdf">
          <iframe
            className="bn-pdf-frame"
            src={embedUrl}
            title={displayName}
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

function DocxPreview({ name, url }: { name: string; url: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    container.innerHTML = "";
    setStatus("loading");

    void fetchAttachmentBlob(url)
      .then(async (blob) => {
        if (cancelled) return;
        if (!blob) {
          setStatus("error");
          return;
        }
        container.innerHTML = "";
        await renderAsync(blob, container, undefined, {
          breakPages: true,
          className: "bn-docx-rendered",
          ignoreHeight: true,
          ignoreWidth: true,
          inWrapper: true,
        });
        if (!cancelled) {
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) {
          container.innerHTML = "";
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
      container.innerHTML = "";
    };
  }, [url]);

  return (
    <div
      className="bn-docx-preview bn-document-preview"
      aria-label={`Xem trước ${name}`}
    >
      {status === "loading" ? (
        <p className="bn-attachment-status">Đang mở bản xem trước Word…</p>
      ) : null}
      {status === "error" ? (
        <p className="bn-attachment-status bn-attachment-status--error">
          Không thể xem trước tệp Word này. Bạn vẫn có thể mở hoặc tải xuống.
        </p>
      ) : null}
      <div
        className="bn-docx-preview__content bn-document-preview__content"
        ref={containerRef}
        hidden={status === "error"}
      />
    </div>
  );
}

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
  const shouldPreviewDocx = isDocxFile(contentType, name);

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
    <div
      className={`bn-material-card${
        shouldPreviewDocx ? " bn-material-card--with-preview" : ""
      }`}
      contentEditable={false}
    >
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
      {shouldPreviewDocx && isAttachmentUrl ? (
        <DocxPreview name={displayName} url={url} />
      ) : null}
    </div>
  );
}

type FormulaBlockProps = {
  formula: string;
};

function FormulaBlockView({
  block,
  editor,
  props,
}: {
  block: { id: string };
  editor: {
    updateBlock: (
      block: { id: string },
      update: { props: Partial<FormulaBlockProps> },
    ) => void;
    _tiptapEditor?: { isEditable?: boolean };
  };
  props: FormulaBlockProps;
}) {
  const [draft, setDraft] = useState(props.formula);
  const editable = editor._tiptapEditor?.isEditable !== false;

  useEffect(() => {
    setDraft(props.formula);
  }, [props.formula]);

  const commit = useCallback(() => {
    if (draft !== props.formula) {
      editor.updateBlock(block, { props: { formula: draft } });
    }
  }, [block, draft, editor, props.formula]);

  if (!editable) {
    return (
      <div
        className={`bn-formula-block${
          props.formula ? "" : " bn-formula-block--empty"
        }`}
        contentEditable={false}
      >
        {props.formula || "∫ u dv = u·v − ∫ v du"}
      </div>
    );
  }

  return (
    <div className="bn-formula-block" contentEditable={false}>
      <input
        className="bn-formula-input"
        value={draft}
        placeholder="Nhập công thức, ví dụ: E = mc^2"
        aria-label="Công thức"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
            event.currentTarget.blur();
          }
          if (event.key === "Escape") {
            setDraft(props.formula);
            event.currentTarget.blur();
          }
        }}
      />
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
    render: ({ block, editor }) => (
      <FormulaBlockView block={block} editor={editor} props={block.props} />
    ),
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
    },
    content: "none",
  },
  {
    render: ({ block }) => <PdfBlockView props={block.props} />,
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
