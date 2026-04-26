import { useNavigate } from "react-router-dom";
import { useRole } from "@/context/RoleContext";
import { ROLE_CONFIG, type Role } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import {
  Shield,
  ShieldCheck,
  Scale,
  Gavel,
  Bug,
  Server,
  Megaphone,
  ClipboardCheck,
} from "lucide-react";

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

const roles: Role[] = [
  "iso",
  "ciso",
  "dpo",
  "legal",
  "itsec",
  "sysadmin",
  "communications",
  "compliance",
];

export default function RoleSelectPage() {
  const { setRole } = useRole();
  const navigate = useNavigate();

  function handleSelect(role: Role) {
    setRole(role);
    navigate("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight">
          Incident Response Tool
        </h1>
        <p className="text-muted-foreground mt-2">
          GDPR & NIS2 Compliance Management — Select your role to continue
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl">
        {roles.map((role) => {
          const config = ROLE_CONFIG[role];
          const Icon = iconMap[config.icon] ?? Shield;

          return (
            <Card
              key={role}
              className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
              onClick={() => handleSelect(role)}
            >
              <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                <div className={`p-3 rounded-xl ${config.color} text-white`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">{config.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {config.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
