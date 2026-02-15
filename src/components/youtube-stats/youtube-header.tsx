import type { YouTubeChannelStats } from "@/types/youtube";
import { formatNumber } from "./utils";

interface YouTubeHeaderProps {
  channel: YouTubeChannelStats;
  fetchedAt: string;
}

export function YouTubeHeader({ channel, fetchedAt }: YouTubeHeaderProps) {
  return (
    <div className="glass-card rounded-xl border border-border p-5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        {channel.thumbnail && (
          <img
            src={channel.thumbnail}
            alt={channel.title}
            className="w-14 h-14 rounded-full border-2 border-red-500 object-cover"
          />
        )}
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            {channel.title}
            <span className="text-[11px] font-semibold bg-red-500 text-white px-1.5 py-0.5 rounded">
              YT
            </span>
          </h1>
          {channel.customUrl && (
            <p className="text-sm text-muted-foreground">{channel.customUrl}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-6 text-sm">
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">
            {formatNumber(channel.subscriberCount)}
          </p>
          <p className="text-xs text-muted-foreground">Suscriptores</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">
            {formatNumber(channel.viewCount)}
          </p>
          <p className="text-xs text-muted-foreground">Views totales</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">
            {channel.videoCount}
          </p>
          <p className="text-xs text-muted-foreground">Videos</p>
        </div>
        <div className="text-xs text-muted-foreground/60">
          {new Date(fetchedAt).toLocaleString("es-ES")}
        </div>
      </div>
    </div>
  );
}
