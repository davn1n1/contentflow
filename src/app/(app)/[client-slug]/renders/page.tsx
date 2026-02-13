"use client";

import { useAccountStore } from "@/lib/stores/account-store";
import { Film } from "lucide-react";

export default function RendersPage() {
  const { currentAccount } = useAccountStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Renders</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Video rendering and post-production for {currentAccount?.name}
        </p>
      </div>

      <div className="glass-card rounded-xl p-12 text-center">
        <Film className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-lg font-medium text-foreground mb-1">Render Manager</p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Select a video from the Videos page to view and manage its renders.
        </p>
      </div>
    </div>
  );
}
