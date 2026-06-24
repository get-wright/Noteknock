import { API_BASE, ApiError, apiUrl, authHeaders } from "./client";

export type Attachment = {
  id: string;
  url: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
};

export type AttachmentUrl = {
  url: string;
};

const ATTACHMENT_PATH = /^\/api\/attachments\/([^/]+)$/;

async function throwApiError(res: Response): Promise<never> {
  let message = res.statusText;
  try {
    const data = (await res.json()) as { detail?: string; message?: string };
    message = data.detail ?? data.message ?? message;
  } catch {
  }
  throw new ApiError(res.status, message);
}

export function parseAttachmentId(url: string): string | null {
  try {
    const apiBase = new URL(API_BASE);
    const parsedUrl = new URL(url, apiBase);
    if (parsedUrl.origin !== apiBase.origin) {
      return null;
    }

    const match = parsedUrl.pathname.match(ATTACHMENT_PATH);
    if (!match || parsedUrl.search || parsedUrl.hash) {
      return null;
    }

    return match[1];
  } catch {
    return null;
  }
}

export function isAttachmentAppUrl(url: string): boolean {
  return parseAttachmentId(url) !== null;
}

async function resolveAttachmentUrl(
  url: string,
  endpoint: "preview-url" | "download-url",
): Promise<string> {
  const attachmentId = parseAttachmentId(url);
  if (!attachmentId) {
    return url;
  }

  const res = await fetch(apiUrl(`/api/attachments/${attachmentId}/${endpoint}`), {
    headers: authHeaders(),
  });
  if (!res.ok) {
    await throwApiError(res);
  }

  const data = (await res.json()) as AttachmentUrl;
  return data.url;
}

export async function uploadAttachment(
  file: File,
  noteId?: string,
): Promise<Attachment> {
  const formData = new FormData();
  formData.append("file", file);
  if (noteId !== undefined) {
    formData.append("noteId", noteId);
  }

  const res = await fetch(apiUrl("/api/attachments"), {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  if (!res.ok) {
    await throwApiError(res);
  }

  const attachment = (await res.json()) as Attachment;
  return {
    ...attachment,
    url: apiUrl(attachment.url),
  };
}

export function resolveAttachmentPreviewUrl(url: string): Promise<string> {
  return resolveAttachmentUrl(url, "preview-url");
}

export function resolveAttachmentDownloadUrl(url: string): Promise<string> {
  return resolveAttachmentUrl(url, "download-url");
}
