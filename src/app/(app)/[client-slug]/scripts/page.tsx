"use client";

import { useAccountStore } from "@/lib/stores/account-store";
import { FileText, Headphones } from "lucide-react";

export default function ScriptsPage() {
  const { currentAccount } = useAccountStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Script & Audio</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Script editing and audio generation for {currentAccount?.name}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-8 text-center">
          <FileText className="w-10 h-10 text-primary mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">Scripts</p>
          <p className="text-xs text-muted-foreground">
            Edit and manage video scripts and copy content.
          </p>
        </div>
        <div className="glass-card rounded-xl p-8 text-center">
          <Headphones className="w-10 h-10 text-primary mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">Audio</p>
          <p className="text-xs text-muted-foreground">
            ElevenLabs voice generation and audio management.
          </p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Select a video from the Videos page to edit its scripts and audio.
      </p>
    </div>
  );
}
