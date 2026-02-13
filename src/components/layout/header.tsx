"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAccountStore } from "@/lib/stores/account-store";
import { ClientSelector } from "./client-selector";
import { LogOut, Bell, Search } from "lucide-react";

export function Header() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const supabase = createClient();
  const { currentAccount, airtableUser } = useAccountStore();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    useAccountStore.getState().reset();
    queryClient.clear(); // Clear all cached queries (auth-user, videos, etc.)
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <ClientSelector />
        {currentAccount && (
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-success" />
            <span>{currentAccount.name}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <Search className="w-5 h-5" />
        </button>

        {/* Notifications */}
        <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
        </button>

        {/* User info */}
        {airtableUser && (
          <div className="hidden lg:flex items-center gap-2 px-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {airtableUser.name?.charAt(0) || airtableUser.email?.charAt(0) || "?"}
            </div>
            <span className="text-sm text-foreground">
              {airtableUser.name || airtableUser.email}
            </span>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Sign out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
