"use client";

import { useAccountStore } from "@/lib/stores/account-store";
import { Mic, User, Image, Music, Shield } from "lucide-react";

export default function SettingsPage() {
  const { currentAccount } = useAccountStore();
  const settings = null; // TODO: fetch from Airtable when needed

  const settingSections = [
    {
      title: "Avatar Sets",
      description: "Configure avatar sets for YouTube and Reels production",
      icon: User,
      href: "#avatars",
    },
    {
      title: "Voices",
      description: "ElevenLabs voice profiles and VoiceDNA configuration",
      icon: Mic,
      href: "#voices",
    },
    {
      title: "Visual Identity",
      description: "Colors, fonts, and branding guidelines",
      icon: Image,
      href: "#brand",
    },
    {
      title: "Music Styles",
      description: "Background music and sound effect preferences",
      icon: Music,
      href: "#music",
    },
    {
      title: "GuardaRails",
      description: "AI guardrails and content generation rules",
      icon: Shield,
      href: "#guardrails",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Account configuration for {currentAccount?.name}
        </p>
      </div>

      {/* Account info */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xl font-bold text-primary">
            {currentAccount?.name?.charAt(0) || "?"}
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {currentAccount?.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              {currentAccount?.status || "Active"} &middot;{" "}
              {currentAccount?.industria?.join(", ") || "General"}
            </p>
          </div>
        </div>
      </div>

      {/* Settings sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingSections.map((section) => (
          <div
            key={section.title}
            className="glass-card rounded-xl p-5 hover:border-primary/20 transition-all cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <section.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">
                  {section.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {section.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Raw settings data */}
      {settings && (
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Current Settings
          </h3>
          <div className="space-y-2">
            {Object.entries(settings)
              .filter(([key]) => !["id", "account_id", "airtable_id", "created_at", "updated_at"].includes(key))
              .filter(([, value]) => value !== null)
              .map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-1 border-b border-border/50">
                  <span className="text-xs text-muted-foreground">{key}</span>
                  <span className="text-xs text-foreground font-mono truncate max-w-xs">
                    {String(value)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
