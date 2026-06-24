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
import AppShell from "./components/AppShell";

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
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="new" element={<EditorPage mode="new" />} />
            <Route path="notes/:title/edit" element={<EditorPage mode="edit" />} />
            <Route path="notes/:title/quiz/result" element={<QuizResultPage />} />
            <Route path="notes/:title/quiz" element={<QuizPage />} />
            <Route path="notes/:title" element={<Study />} />
            <Route path="review" element={<ReviewPage />} />
            <Route path="streak" element={<StreakPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
