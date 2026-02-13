"use client";

import type { Account } from "@/types/database";
import { cn } from "@/lib/utils";
import { Video, ArrowRight } from "lucide-react";
import Link from "next/link";

interface ClientSummaryCardProps {
  account: Account;
  videoCount: number;
  activeCount: number;
}

export function ClientSummaryCard({ account, videoCount, activeCount }: ClientSummaryCardProps) {
  const slug = account.nameapp || account.name?.toLowerCase().replace(/\s+/g, "-") || "";

  return (
    <Link
      href={`/${slug}/videos`}
      className="glass-card rounded-xl p-5 hover:border-primary/30 transition-all group"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-sm font-bold">
            {account.name?.charAt(0) || "?"}
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-sm">{account.name}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {account.status || "Active"}
            </p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>

      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-1.5">
          <Video className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{videoCount}</span>
          <span className="text-xs text-muted-foreground">videos</span>
        </div>
        {activeCount > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary pulse-glow" />
            <span className="text-xs text-primary font-medium">{activeCount} in progress</span>
          </div>
        )}
      </div>
    </Link>
  );
}
