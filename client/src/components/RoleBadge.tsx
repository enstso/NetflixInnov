import type { Role } from "../types/events";

interface RoleBadgeProps {
  role: Role;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <div className="role-badge">
      {role === "host" ? "Vous êtes l'hôte" : "Invité - contrôle désactivé"}
    </div>
  );
}
