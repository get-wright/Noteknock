import { API_BASE, ApiError, apiUrl, authHeaders } from "./client";

export type Attachment = {
  id: string;
  url: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
};

const ATTACHMENT_PATH = /^\/api\/attachments\/([^/]+)$/;
const attachmentBlobUrlCache = new Map<string, string>();

function expectedApiOrigin(): string | null {
  if (API_BASE && /^https?:\/\//i.test(API_BASE)) {
    try {
      return new URL(API_BASE).origin;
    } catch {
      return null;
    }
  }
  if (typeof globalThis !== "undefined" && "location" in globalThis) {
    return globalThis.location.origin;
  }
  return null;
}

async function throwApiError(res: Response): Promise<never> {
  let message = res.statusText;
  try {
    const data = (await res.json()) as { detail?: string; message?: string };
    message = data.detail ?? data.message ?? message;
  } catch {
    // Keep the HTTP status text when the response body is not JSON.
  }
  throw new ApiError(res.status, message);
}

function resolveUrlBase(): string {
  if (API_BASE && /^https?:\/\//i.test(API_BASE)) {
    return API_BASE.replace(/\/$/, "");
  }
  if (typeof globalThis !== "undefined" && "location" in globalThis) {
    return globalThis.location.origin;
  }
  return "http://localhost";
}

export function parseAttachmentId(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = trimmed.startsWith("/")
      ? new URL(trimmed, resolveUrlBase())
      : new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.search || parsed.hash) {
    return null;
  }

  if (!trimmed.startsWith("/")) {
    const apiOrigin = expectedApiOrigin();
    if (!apiOrigin || parsed.origin !== apiOrigin) {
      return null;
    }
  }

  const match = parsed.pathname.match(ATTACHMENT_PATH);
  return match?.[1] ?? null;
}

export function isAttachmentAppUrl(url: string): boolean {
  return parseAttachmentId(url) !== null;
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

async function resolveAttachmentBlobUrl(url: string): Promise<string> {
  const attachmentId = parseAttachmentId(url);
  if (!attachmentId) {
    return url;
  }
  const cached = attachmentBlobUrlCache.get(url);
  if (cached) {
    return cached;
  }

  const blob = await fetchAttachmentBlob(url);
  if (!blob) {
    return url;
  }

  const blobUrl = URL.createObjectURL(blob);
  attachmentBlobUrlCache.set(url, blobUrl);
  return blobUrl;
}

export function revokeResolvedAttachmentUrl(url: string): void {
  const blobUrl = attachmentBlobUrlCache.get(url);
  if (!blobUrl) return;
  URL.revokeObjectURL(blobUrl);
  attachmentBlobUrlCache.delete(url);
}

export function resolveAttachmentPreviewUrl(url: string): Promise<string> {
  return resolveAttachmentBlobUrl(url);
}

export function resolveAttachmentDownloadUrl(url: string): Promise<string> {
  return resolveAttachmentBlobUrl(url);
}

export async function fetchAttachmentBlob(url: string): Promise<Blob | null> {
  const attachmentId = parseAttachmentId(url);
  if (!attachmentId) {
    return null;
  }

  const res = await fetch(apiUrl(`/api/attachments/${attachmentId}/content`), {
    headers: authHeaders(),
  });
  if (!res.ok) {
    await throwApiError(res);
  }

  return res.blob();
}
