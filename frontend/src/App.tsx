import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useTheme } from "./hooks/useTheme";

export default function App() {
  useTheme();
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Placeholder label="Landing" />} />
        <Route path="/login" element={<Placeholder label="Login" />} />
        <Route path="/register" element={<Placeholder label="Register" />} />
        <Route path="/app/*" element={<Placeholder label="App" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function Placeholder({ label }: { label: string }) {
  return <div style={{ padding: 24 }}>{label} placeholder</div>;
}