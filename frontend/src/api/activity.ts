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

export type HeatmapDay = {
  date: string;
  count: number;
};

export type StreakStats = {
  current: number;
  longest: number;
  total: number;
  heatmap: HeatmapDay[];
};

export type ActivityDay = {
  date: string;
  notesCreated: number;
  quizzesTaken: number;
  reviewsDone: number;
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

export function getStreak(): Promise<StreakStats> {
  return apiRequest<StreakStats>("/api/streak");
}

export function getActivity(params?: {
  from?: string;
  to?: string;
}): Promise<ActivityDay[]> {
  const q = new URLSearchParams();
  if (params?.from) q.set("from", params.from);
  if (params?.to) q.set("to", params.to);
  const suffix = q.toString() ? `?${q.toString()}` : "";
  return apiRequest<ActivityDay[]>(`/api/activity${suffix}`);
}