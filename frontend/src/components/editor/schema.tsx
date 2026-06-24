import {
  BlockNoteSchema,
  defaultBlockSpecs,
} from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";
import { Download, ExternalLink, FileText } from "lucide-react";
import { useEffect, useState } from "react";

import {
  resolveAttachmentDownloadUrl,
  resolveAttachmentPreviewUrl,
} from "../../api/attachments";

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

function useResolvedAttachmentUrls(url: string) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setPreviewUrl(null);
      setDownloadUrl(null);
      return;
    }

    let cancelled = false;

    void resolveAttachmentPreviewUrl(url)
      .then((resolved) => {
        if (!cancelled) setPreviewUrl(resolved);
      })
      .catch(() => {
        if (!cancelled) setPreviewUrl(url);
      });

    void resolveAttachmentDownloadUrl(url)
      .then((resolved) => {
        if (!cancelled) setDownloadUrl(resolved);
      })
      .catch(() => {
        if (!cancelled) setDownloadUrl(url);
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return { previewUrl, downloadUrl };
}

type PdfBlockProps = {
  url: string;
  name: string;
  caption: string;
  showPreview: boolean;
  previewWidth: number | undefined;
};

function PdfBlockView({ props }: { props: PdfBlockProps }) {
  const { url, name, caption, showPreview, previewWidth } = props;
  const { previewUrl, downloadUrl } = useResolvedAttachmentUrls(url);
  const displayName = name || "PDF";

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
          ) : null}
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
          ) : null}
        </div>
      </div>
      {showPreview && previewUrl ? (
        <iframe
          className="bn-pdf-frame"
          src={previewUrl}
          title={displayName}
          style={previewWidth ? { width: previewWidth } : undefined}
        />
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
  const { previewUrl, downloadUrl } = useResolvedAttachmentUrls(url);
  const displayName = name || "Tài liệu";
  const metaParts = [contentType, formatBytes(sizeBytes)].filter(Boolean);

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
        ) : null}
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
        ) : null}
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
