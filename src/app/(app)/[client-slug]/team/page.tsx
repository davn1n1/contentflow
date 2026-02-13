"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccountStore } from "@/lib/stores/account-store";
import { Users, Plus, Shield, Edit3, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const roleConfig = {
  admin: { label: "Admin", icon: Shield, color: "text-primary bg-primary/10 border-primary/20" },
  editor: { label: "Editor", icon: Edit3, color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  viewer: { label: "Viewer", icon: Eye, color: "text-muted-foreground bg-muted border-border" },
};

interface TeamMember {
  id: string;
  name: string | null;
  email: string | null;
  rol: string[];
}

export default function TeamPage() {
  const { currentAccount } = useAccountStore();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["team", currentAccount?.airtable_id],
    queryFn: async (): Promise<TeamMember[]> => {
      if (!currentAccount?.airtable_id) return [];
      const res = await fetch(`/api/data/users?accountId=${encodeURIComponent(currentAccount.airtable_id)}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!currentAccount?.airtable_id,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage access for {currentAccount?.name}
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          Invite
        </button>
      </div>

      {/* Team list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card rounded-xl h-20 animate-pulse" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No team members yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => {
            const role = user.rol?.[0]?.toLowerCase() || "viewer";
            const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.viewer;
            const RoleIcon = config.icon;

            return (
              <div key={user.id} className="glass-card rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                  {user.name?.charAt(0) || user.email?.charAt(0) || "?"}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {user.name || "Unnamed"}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                    config.color
                  )}
                >
                  <RoleIcon className="w-3 h-3" />
                  {config.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
