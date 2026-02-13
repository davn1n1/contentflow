"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useVideo } from "@/lib/hooks/use-videos";
import { useVideoRealtime } from "@/lib/hooks/use-pipeline";
import { PipelineButtons } from "@/components/pipeline/pipeline-buttons";
import { VideoMetadata } from "@/components/videos/video-metadata";
import { CopyViewer } from "@/components/videos/copy-viewer";
import type { Video } from "@/types/database";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  FileText,
  Headphones,
  Film,
  Clapperboard,
  ExternalLink,
} from "lucide-react";

const tabs = [
  { key: "copy", label: "Copy", icon: FileText },
  { key: "scenes", label: "Scenes", icon: Film },
  { key: "audio", label: "Audio", icon: Headphones },
  { key: "renders", label: "Renders", icon: Clapperboard },
] as const;

type Tab = (typeof tabs)[number]["key"];

export default function VideoDetailPage() {
  const params = useParams();
  const clientSlug = params["client-slug"] as string;
  const videoId = params.id as string;
  const [activeTab, setActiveTab] = useState<Tab>("copy");

  const { data: video, isLoading } = useVideo(videoId);

  // Subscribe to real-time updates
  useVideoRealtime(videoId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-24 bg-muted rounded-xl animate-pulse" />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 h-96 bg-muted rounded-xl animate-pulse" />
          <div className="h-96 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Video not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/${clientSlug}/videos`}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                #{video.name}
              </span>
              <h1 className="text-xl font-bold text-foreground">
                {video.titulo || video.titulo_youtube_a || "Untitled"}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {video.horizontalvertical || "Horizontal"} &middot;{" "}
              {video.voice_length_minutes || "-"}
            </p>
          </div>
        </div>

        {video.url_youtube && (
          <a
            href={video.url_youtube}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            YouTube
          </a>
        )}
      </div>

      {/* Pipeline Buttons - THE 4 MAIN BUTTONS */}
      <PipelineButtons video={video} recordId={video.airtable_id || video.id} />

      {/* Content area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  activeTab === tab.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="min-h-[400px]">
            {activeTab === "copy" && <CopyViewer video={video} />}
            {activeTab === "scenes" && (
              <div className="glass-card rounded-xl p-6">
                <Link
                  href={`/${clientSlug}/scenes/${videoId}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium rounded-lg transition-colors"
                >
                  <Film className="w-4 h-4" />
                  Open Scenes Editor
                </Link>
                <p className="text-sm text-muted-foreground mt-3">
                  Edit scenes, scripts, audio, and slides for this video.
                </p>
              </div>
            )}
            {activeTab === "audio" && (
              <div className="glass-card rounded-xl p-6 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Audio</h3>
                {video.elevenlabs_voice_url ? (
                  <audio controls className="w-full" src={video.elevenlabs_voice_url}>
                    <track kind="captions" />
                  </audio>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No audio generated yet.
                  </p>
                )}
                {video.voice_length_minutes && (
                  <p className="text-sm text-muted-foreground">
                    Duration: {video.voice_length_minutes}
                  </p>
                )}
              </div>
            )}
            {activeTab === "renders" && (
              <div className="glass-card rounded-xl p-6">
                <Link
                  href={`/${clientSlug}/renders/${videoId}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium rounded-lg transition-colors"
                >
                  <Clapperboard className="w-4 h-4" />
                  Open Render Manager
                </Link>
                <p className="text-sm text-muted-foreground mt-3">
                  Manage AE renders and timeline for this video.
                </p>
                {video.url_shotstack_production && (
                  <div className="mt-4">
                    <a
                      href={video.url_shotstack_production}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      View Production Render
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar metadata */}
        <div>
          <VideoMetadata video={video} />
        </div>
      </div>
    </div>
  );
}
