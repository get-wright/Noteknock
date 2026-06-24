import { apiRequest } from "./client";

export type ReviewDue = {
  noteId: string;
  title: string;
  subject: string | null;
  strength: number;
  lastReviewed: number | null;
};

export type ReviewEvent = {
  id: string;
  noteId: string;
  strength: number;
  reviewedAt: number;
};

export function getDueReviews(): Promise<ReviewDue[]> {
  return apiRequest<ReviewDue[]>("/api/review/due");
}

export function createReviewEvent(
  title: string,
  strength: number,
): Promise<ReviewEvent> {
  return apiRequest<ReviewEvent>(
    `/api/notes/${encodeURIComponent(title)}/review`,
    { method: "POST", body: { strength } },
  );
}