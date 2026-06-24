import { apiRequest } from "./client";

export type RecallItem = {
  id: string;
  content: string;
  position: number;
  checked: boolean;
  source: string;
  createdAt: number;
};

export type RecallItemCreateInput = {
  content: string;
};

export type RecallItemUpdateInput = {
  content?: string;
  checked?: boolean;
  position?: number;
};

function recallPath(title: string): string {
  return `/api/notes/${encodeURIComponent(title)}/recall`;
}

export function getRecall(title: string): Promise<RecallItem[]> {
  return apiRequest<RecallItem[]>(recallPath(title));
}

export function generateRecall(title: string): Promise<RecallItem[]> {
  return apiRequest<RecallItem[]>(`${recallPath(title)}/generate`, {
    method: "POST",
  });
}

export function createRecallItem(
  title: string,
  data: RecallItemCreateInput,
): Promise<RecallItem> {
  return apiRequest<RecallItem>(recallPath(title), {
    method: "POST",
    body: data,
  });
}

export function updateRecallItem(
  title: string,
  id: string,
  data: RecallItemUpdateInput,
): Promise<RecallItem> {
  return apiRequest<RecallItem>(
    `${recallPath(title)}/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: data,
    },
  );
}

export function deleteRecallItem(title: string, id: string): Promise<null> {
  return apiRequest<null>(`${recallPath(title)}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
