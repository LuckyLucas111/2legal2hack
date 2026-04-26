import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RoleProvider, useRole } from "@/context/RoleContext";
import { Toaster } from "sonner";
import AppShell from "@/components/layout/AppShell";
import RoleSelectPage from "@/pages/RoleSelectPage";
import DashboardPage from "@/pages/DashboardPage";
import IncidentCreatePage from "@/pages/IncidentCreatePage";
import IncidentDetailPage from "@/pages/IncidentDetailPage";

function RequireRole({ children }: { children: React.ReactNode }) {
  const { role } = useRole();
  if (!role) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <RoleProvider>
        <Routes>
          <Route path="/" element={<RoleSelectPage />} />
          <Route
            element={
              <RequireRole>
                <AppShell />
              </RequireRole>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/incidents/new" element={<IncidentCreatePage />} />
            <Route path="/incidents/:id" element={<IncidentDetailPage />} />
          </Route>
        </Routes>
        <Toaster position="top-right" />
      </RoleProvider>
    </BrowserRouter>
  );
}
