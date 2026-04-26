import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { Role } from "@/types";
import { setRoleHeader } from "@/api/client";

interface RoleContextValue {
  role: Role | null;
  setRole: (role: Role) => void;
  clearRole: () => void;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role | null>(() => {
    const stored = localStorage.getItem("selectedRole");
    if (stored) {
      setRoleHeader(stored);
    }
    return stored ? (stored as Role) : null;
  });

  useEffect(() => {
    if (role) {
      localStorage.setItem("selectedRole", role);
      setRoleHeader(role);
    }
  }, [role]);

  const setRole = (r: Role) => setRoleState(r);
  const clearRole = () => {
    setRoleState(null);
    localStorage.removeItem("selectedRole");
  };

  return (
    <RoleContext.Provider value={{ role, setRole, clearRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
