import { Link, Outlet, useLocation } from "react-router-dom";
import { useRole } from "@/context/RoleContext";
import { ROLE_CONFIG } from "@/types";
import {
  Shield,
  ShieldCheck,
  Scale,
  Gavel,
  Bug,
  Server,
  Megaphone,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const iconMap: Record<string, React.ElementType> = {
  Shield,
  ShieldCheck,
  Scale,
  Gavel,
  Bug,
  Server,
  Megaphone,
  ClipboardCheck,
};

export default function AppShell() {
  const { role, clearRole } = useRole();
  const location = useLocation();

  if (!role) return null;

  const config = ROLE_CONFIG[role];
  const Icon = iconMap[config.icon] ?? Shield;

  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r bg-sidebar flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${config.color} text-white`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">{config.label}</p>
              <p className="text-xs text-muted-foreground">Incident Response</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <Link
            to="/dashboard"
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
              location.pathname === "/dashboard"
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
        </nav>

        <div className="p-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={clearRole}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Switch Role
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
