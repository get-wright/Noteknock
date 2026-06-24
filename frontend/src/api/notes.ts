import { apiRequest } from "./client";

export type Note = {
  title: string;
  content: unknown[];
  subject: string | null;
  difficulty: string | null;
  lastModified: number;
  tags: string[];
};

export type SearchResult = {
  title: string;
  lastModified: number;
  titleHighlights: string | null;
  contentHighlights: string | null;
  tagMatches: string[] | null;
};

export type NoteCreateInput = {
  title: string;
  content?: unknown[];
  subject?: string | null;
  difficulty?: string | null;
};

export type NoteUpdateInput = {
  newTitle?: string;
  newContent?: unknown[];
  subject?: string | null;
  difficulty?: string | null;
};

export type SearchInput = {
  term?: string;
  sort?: "score" | "title" | "lastModified";
  order?: "asc" | "desc";
  limit?: number;
};

export function getNote(title: string): Promise<Note> {
  return apiRequest<Note>(`/api/notes/${encodeURIComponent(title)}`);
}

export function createNote(data: NoteCreateInput): Promise<Note> {
  return apiRequest<Note>("/api/notes", { method: "POST", body: data });
}

export function updateNote(title: string, data: NoteUpdateInput): Promise<Note> {
  return apiRequest<Note>(`/api/notes/${encodeURIComponent(title)}`, {
    method: "PATCH",
    body: data,
  });
}

export function deleteNote(title: string): Promise<null> {
  return apiRequest<null>(`/api/notes/${encodeURIComponent(title)}`, {
    method: "DELETE",
  });
}

export function getTags(): Promise<string[]> {
  return apiRequest<string[]>("/api/tags");
}

export function search(params: SearchInput): Promise<SearchResult[]> {
  const query = new URLSearchParams();
  if (params.term !== undefined) query.set("term", params.term);
  if (params.sort !== undefined) query.set("sort", params.sort);
  if (params.order !== undefined) query.set("order", params.order);
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  const qs = query.toString();
  return apiRequest<SearchResult[]>(`/api/search${qs ? `?${qs}` : ""}`);
}