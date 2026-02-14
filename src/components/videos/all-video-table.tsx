"use client";

import Link from "next/link";
import type { Video } from "@/types/database";
import { StatusBadge } from "./status-badge";
import { ExternalLink, Check, X as XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AllVideoTableProps {
  videos: Video[];
  clientSlug: string;
  sponsorMap: Record<string, string>;
}

function BooleanCell({ value }: { value: boolean | string | null }) {
  if (value === true || value === "true") {
    return <Check className="w-4 h-4 text-success mx-auto" />;
  }
  if (value === false || value === "false" || value === null || value === undefined) {
    return <XIcon className="w-4 h-4 text-muted-foreground/30 mx-auto" />;
  }
  // String value (like a status text)
  return (
    <span className="text-xs text-foreground truncate max-w-[120px] block">
      {String(value)}
    </span>
  );
}

function ThumbnailCell({ url, alt }: { url: string | null; alt: string }) {
  if (!url) return <span className="text-xs text-muted-foreground">-</span>;
  return (
    <img
      src={url}
      alt={alt}
      className="w-16 h-9 object-cover rounded border border-border"
    />
  );
}

function LinkCell({ url, label }: { url: string | null; label?: string }) {
  if (!url) return <span className="text-xs text-muted-foreground">-</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
    >
      <ExternalLink className="w-3 h-3 flex-shrink-0" />
      <span className="truncate max-w-[80px]">{label || "Link"}</span>
    </a>
  );
}

function TextCell({ value, maxW = "max-w-[200px]" }: { value: string | null; maxW?: string }) {
  if (!value) return <span className="text-xs text-muted-foreground">-</span>;
  return (
    <span className={cn("text-xs text-foreground truncate block", maxW)} title={value}>
      {value}
    </span>
  );
}

function DateCell({ value }: { value: string | null }) {
  if (!value) return <span className="text-xs text-muted-foreground">-</span>;
  return (
    <span className="text-xs text-muted-foreground whitespace-nowrap">
      {new Date(value).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
      })}
    </span>
  );
}

function LogoCell({ url }: { url: string | null }) {
  if (!url) return <span className="text-xs text-muted-foreground">-</span>;
  return (
    <img
      src={url}
      alt="Logo"
      className="w-6 h-6 rounded-full object-cover border border-border"
    />
  );
}

// Column definitions
const COLUMNS: { key: string; label: string; sticky?: boolean; width: string }[] = [
  { key: "name", label: "Name", sticky: true, width: "w-[70px]" },
  { key: "scheduled_date", label: "Scheduled Date", width: "w-[110px]" },
  { key: "titulo_a", label: "Título Youtube A", width: "w-[220px]" },
  { key: "estado", label: "Estado", width: "w-[120px]" },
  { key: "status_copy_analysis", label: "Status & Copy Analysis", width: "w-[160px]" },
  { key: "status_audio", label: "Status Audio", width: "w-[100px]" },
  { key: "status_avatares", label: "Status Avatares Render", width: "w-[150px]" },
  { key: "status_rendering_video", label: "Status Rendering Video", width: "w-[160px]" },
  { key: "status_youtube_publishing", label: "Status YT Publishing", width: "w-[150px]" },
  { key: "logo_account", label: "Logo (from AI Account)", width: "w-[80px]" },
  { key: "status_agentes", label: "Status AgentesIA", width: "w-[130px]" },
  { key: "horizontalvertical", label: "Horizontal/Vert", width: "w-[110px]" },
  { key: "post_content", label: "Post Content", width: "w-[200px]" },
  { key: "portada_a", label: "Portada Youtube A", width: "w-[100px]" },
  { key: "portada_b", label: "Portada Youtube B", width: "w-[100px]" },
  { key: "portada_c", label: "Portada Youtube C", width: "w-[100px]" },
  { key: "sponsors", label: "Sponsors", width: "w-[130px]" },
  { key: "url_youtube", label: "URL Youtube", width: "w-[100px]" },
  { key: "status_edicion_manual", label: "Status Edición manual", width: "w-[150px]" },
  { key: "notas_revision", label: "NOTAS para la revisión", width: "w-[200px]" },
  { key: "created_time", label: "Created Time", width: "w-[100px]" },
  { key: "url_drive", label: "URL Drive", width: "w-[90px]" },
  { key: "url_shotstack_production", label: "URL Shotstack Production", width: "w-[160px]" },
  { key: "yt_video_id", label: "YT_VideoID", width: "w-[110px]" },
  { key: "logo_fuentes", label: "Logo Fuentes Insp.", width: "w-[80px]" },
  { key: "n_capitulo_podcast", label: "N. Capitulo Podcast", width: "w-[130px]" },
  { key: "record_id", label: "Record ID", width: "w-[120px]" },
];

export function AllVideoTable({ videos, clientSlug, sponsorMap }: AllVideoTableProps) {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-max min-w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "text-left text-[11px] font-semibold text-muted-foreground px-3 py-2.5 whitespace-nowrap",
                    col.width,
                    col.sticky && "sticky left-0 z-10 bg-muted/50"
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {videos.map((video) => (
              <tr
                key={video.id}
                className="border-b border-border/50 hover:bg-muted/20 transition-colors"
              >
                {/* 1. Name (sticky) */}
                <td className="px-3 py-2 sticky left-0 z-10 bg-background">
                  <Link
                    href={`/${clientSlug}/videos/${video.id}`}
                    className="text-xs font-mono font-bold text-primary hover:underline"
                  >
                    {video.name}
                  </Link>
                </td>

                {/* 2. Scheduled Date */}
                <td className="px-3 py-2">
                  <DateCell value={video.scheduled_date} />
                </td>

                {/* 3. Título Youtube A */}
                <td className="px-3 py-2">
                  <Link
                    href={`/${clientSlug}/videos/${video.id}`}
                    className="text-xs font-medium text-foreground hover:text-primary transition-colors line-clamp-2 max-w-[220px]"
                  >
                    {video.titulo || "Untitled"}
                  </Link>
                </td>

                {/* 4. Estado */}
                <td className="px-3 py-2">
                  <StatusBadge status={video.estado} />
                </td>

                {/* 5. Status & Copy Analysis */}
                <td className="px-3 py-2">
                  <TextCell value={video.status_copy_analysis} maxW="max-w-[150px]" />
                </td>

                {/* 6. Status Audio */}
                <td className="px-3 py-2 text-center">
                  <BooleanCell value={video.status_audio} />
                </td>

                {/* 7. Status Avatares Render */}
                <td className="px-3 py-2 text-center">
                  <BooleanCell value={video.status_avatares} />
                </td>

                {/* 8. Status Rendering Video */}
                <td className="px-3 py-2 text-center">
                  <BooleanCell value={video.status_rendering_video} />
                </td>

                {/* 9. Status YouTube Publishing */}
                <td className="px-3 py-2">
                  <TextCell value={video.status_youtube_publishing} maxW="max-w-[140px]" />
                </td>

                {/* 10. Logo (from AI Account) */}
                <td className="px-3 py-2">
                  <LogoCell url={video.logo_account} />
                </td>

                {/* 11. Status AgentesIA */}
                <td className="px-3 py-2">
                  <TextCell value={video.status_agentes} maxW="max-w-[120px]" />
                </td>

                {/* 12. Horizontal/Vert */}
                <td className="px-3 py-2">
                  <TextCell value={video.horizontalvertical} maxW="max-w-[100px]" />
                </td>

                {/* 13. Post Content */}
                <td className="px-3 py-2">
                  <TextCell value={video.post_content} maxW="max-w-[200px]" />
                </td>

                {/* 14. Portada Youtube A */}
                <td className="px-3 py-2">
                  <ThumbnailCell url={video.portada_a} alt="Portada A" />
                </td>

                {/* 15. Portada Youtube B */}
                <td className="px-3 py-2">
                  <ThumbnailCell url={video.portada_b} alt="Portada B" />
                </td>

                {/* 16. Portada Youtube C */}
                <td className="px-3 py-2">
                  <ThumbnailCell url={video.portada_c} alt="Portada C" />
                </td>

                {/* 17. Sponsors */}
                <td className="px-3 py-2">
                  {video.sponsor_ids && video.sponsor_ids.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {video.sponsor_ids.map((id) => (
                        <span
                          key={id}
                          className="inline-flex px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 text-[10px] font-medium"
                        >
                          {sponsorMap[id] || id.substring(0, 6)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </td>

                {/* 18. URL Youtube */}
                <td className="px-3 py-2">
                  <LinkCell url={video.url_youtube} label="YouTube" />
                </td>

                {/* 19. Status Edición manual */}
                <td className="px-3 py-2">
                  <TextCell value={video.status_edicion_manual} maxW="max-w-[140px]" />
                </td>

                {/* 20. NOTAS para la revisión */}
                <td className="px-3 py-2">
                  <TextCell value={video.notas_revision} maxW="max-w-[200px]" />
                </td>

                {/* 21. Created Time */}
                <td className="px-3 py-2">
                  <DateCell value={video.created_time} />
                </td>

                {/* 22. URL Drive */}
                <td className="px-3 py-2">
                  <LinkCell url={video.url_drive} label="Drive" />
                </td>

                {/* 23. URL Shotstack Production */}
                <td className="px-3 py-2">
                  <LinkCell url={video.url_shotstack_production} label="Shotstack" />
                </td>

                {/* 24. YT_VideoID */}
                <td className="px-3 py-2">
                  <TextCell value={video.yt_video_id} maxW="max-w-[100px]" />
                </td>

                {/* 25. Logo Fuentes Inspiracion */}
                <td className="px-3 py-2">
                  <LogoCell url={video.logo_fuentes_inspiracion} />
                </td>

                {/* 26. N. Capitulo Podcast */}
                <td className="px-3 py-2">
                  <TextCell value={video.n_capitulo_podcast} maxW="max-w-[120px]" />
                </td>

                {/* 27. Record ID */}
                <td className="px-3 py-2">
                  <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[110px] block" title={video.id}>
                    {video.id}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {videos.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm">No se encontraron videos</p>
        </div>
      )}
    </div>
  );
}
