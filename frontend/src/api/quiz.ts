import { ApiError, apiRequest } from "./client";

export type QuizQuestion = {
  id: string;
  position: number;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string | null;
};

export type Quiz = {
  id: string;
  questions: QuizQuestion[];
};

export type AttemptAnswerIn = {
  questionId: string;
  choice: number;
};

export type AttemptAnswerOut = {
  questionId: string;
  choice: number;
  correct: boolean;
};

export type AttemptOut = {
  id: string;
  score: number;
  total: number;
  answers: AttemptAnswerOut[];
};

export function getQuiz(noteTitle: string): Promise<Quiz> {
  return apiRequest<Quiz>(`/api/notes/${encodeURIComponent(noteTitle)}/quiz`);
}

export function generateQuiz(noteTitle: string): Promise<Quiz> {
  return apiRequest<Quiz>(`/api/notes/${encodeURIComponent(noteTitle)}/quiz`, {
    method: "POST",
  });
}

export async function loadOrGenerateQuiz(noteTitle: string): Promise<Quiz> {
  try {
    return await getQuiz(noteTitle);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      return generateQuiz(noteTitle);
    }
    throw e;
  }
}

export function submitQuizAttempt(
  quizId: string,
  answers: AttemptAnswerIn[],
): Promise<AttemptOut> {
  return apiRequest<AttemptOut>(`/api/quizzes/${quizId}/attempts`, {
    method: "POST",
    body: { answers },
  });
}