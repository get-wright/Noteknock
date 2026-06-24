import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useTheme } from "./hooks/useTheme";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import Login from "./pages/Login";
import OAuthCallback from "./pages/OAuthCallback";
import Register from "./pages/Register";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import EditorPage from "./pages/EditorPage";
import Study from "./pages/Study";
import QuizPage from "./pages/Quiz";
import QuizResultPage from "./pages/QuizResult";
import ReviewPage from "./pages/Review";
import StreakPage from "./pages/Streak";
import ProfilePage from "./pages/Profile";

export default function App() {
  useTheme();
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/google/callback" element={<OAuthCallback />} />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/new"
            element={
              <ProtectedRoute>
                <EditorPage mode="new" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/notes/:title/edit"
            element={
              <ProtectedRoute>
                <EditorPage mode="edit" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/notes/:title/quiz/result"
            element={
              <ProtectedRoute>
                <QuizResultPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/notes/:title/quiz"
            element={
              <ProtectedRoute>
                <QuizPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/notes/:title"
            element={
              <ProtectedRoute>
                <Study />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/review"
            element={
              <ProtectedRoute>
                <ReviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/streak"
            element={
              <ProtectedRoute>
                <StreakPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}