import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useTheme } from "./hooks/useTheme";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import Login from "./pages/Login";

export default function App() {
  useTheme();
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Placeholder label="Landing" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Placeholder label="Register" />} />
          <Route
            path="/app/*"
            element={
              <ProtectedRoute>
                <Placeholder label="App" />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function Placeholder({ label }: { label: string }) {
  return <div style={{ padding: 24 }}>{label} placeholder</div>;
}