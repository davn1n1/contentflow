"use client";

import { Video, Search, Building2, BookOpen, RotateCcw } from "lucide-react";

interface ToolInvocationProps {
  toolName: string;
  state: string;
  result?: unknown;
}

export function ChatToolResult({ toolName, state, result }: ToolInvocationProps) {
  if (state !== "result") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10 text-xs text-muted-foreground">
        <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span>{getToolLabel(toolName)}...</span>
      </div>
    );
  }

  if (!result) return null;

  const data = result as Record<string, unknown>;

  if (data.error) {
    return (
      <div className="px-3 py-2 rounded-lg bg-destructive/5 border border-destructive/10 text-xs text-destructive">
        {String(data.error)}
      </div>
    );
  }

  return (
    <div className="px-3 py-2 rounded-lg bg-primary/5 border border-primary/10 text-xs space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
        {getToolIcon(toolName)}
        <span>{getToolLabel(toolName)}</span>
      </div>
      {renderToolResult(toolName, data)}
    </div>
  );
}

function getToolLabel(name: string): string {
  switch (name) {
    case "get_video_status": return "Consultando estado del video";
    case "search_videos": return "Buscando videos";
    case "get_account_info": return "Consultando cuenta";
    case "search_help_articles": return "Buscando articulos";
    case "retry_pipeline_step": return "Reintentando paso";
    default: return "Procesando";
  }
}

function getToolIcon(name: string) {
  const cls = "w-3.5 h-3.5";
  switch (name) {
    case "get_video_status": return <Video className={cls} />;
    case "search_videos": return <Search className={cls} />;
    case "get_account_info": return <Building2 className={cls} />;
    case "search_help_articles": return <BookOpen className={cls} />;
    case "retry_pipeline_step": return <RotateCcw className={cls} />;
    default: return null;
  }
}

function renderToolResult(toolName: string, data: Record<string, unknown>) {
  switch (toolName) {
    case "get_video_status": {
      const pipeline = data.pipeline as Record<string, string> | undefined;
      if (!pipeline) return null;
      return (
        <div className="space-y-1 text-foreground">
          <div className="font-medium">
            #{String(data.number || "")} {String(data.name || data.title || "")}
          </div>
          <div className="flex items-center gap-3">
            <PipelineStep label="Copy" status={pipeline.copy} />
            <PipelineStep label="Audio" status={pipeline.audio} />
            <PipelineStep label="Video" status={pipeline.video} />
            <PipelineStep label="Render" status={pipeline.render} />
          </div>
          {typeof data.youtube_url === "string" && (
            <a
              href={String(data.youtube_url)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Ver en YouTube
            </a>
          )}
        </div>
      );
    }

    case "search_videos": {
      const videos = (data.videos || []) as Array<Record<string, unknown>>;
      return (
        <div className="space-y-1 text-foreground">
          <div className="text-muted-foreground">{videos.length} video(s) encontrados</div>
          {videos.slice(0, 5).map((v, i) => {
            const p = v.pipeline as Record<string, string>;
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="font-medium">#{String(v.number)}</span>
                <span className="truncate flex-1">{String(v.name || v.title)}</span>
                <span className="text-muted-foreground">
                  {p?.copy}{p?.audio}{p?.video}{p?.render}
                </span>
              </div>
            );
          })}
        </div>
      );
    }

    case "search_help_articles": {
      const articles = (data.articles || []) as Array<Record<string, string>>;
      if (articles.length === 0) {
        return <div className="text-muted-foreground">No se encontraron articulos</div>;
      }
      return (
        <div className="space-y-1">
          {articles.map((a, i) => (
            <div key={i}>
              <a href={a.url} className="text-primary hover:underline font-medium">
                {a.title}
              </a>
              {a.summary && <span className="text-muted-foreground ml-1">— {a.summary}</span>}
            </div>
          ))}
        </div>
      );
    }

    case "retry_pipeline_step": {
      return (
        <div className="text-success font-medium">
          {data.success ? "✓ " : ""}{String(data.message || "Step retriggered")}
        </div>
      );
    }

    case "get_account_info": {
      return (
        <div className="text-foreground">
          <div className="font-medium">{String(data.name || "")}</div>
          {typeof data.industry === "string" && <div className="text-muted-foreground">{data.industry}</div>}
        </div>
      );
    }

    default:
      return <pre className="text-xs overflow-x-auto">{JSON.stringify(data, null, 2)}</pre>;
  }
}

function PipelineStep({ label, status }: { label: string; status: string }) {
  const isCompleted = status === "completed" || status === "✓" || status === true.toString();
  const isError = status === "error" || status === "✗";
  const isPending = status === "pending" || status === "○" || !status;

  return (
    <div className="flex items-center gap-1">
      <span
        className={`w-2 h-2 rounded-full ${
          isCompleted
            ? "bg-success"
            : isError
              ? "bg-destructive"
              : isPending
                ? "bg-muted-foreground/30"
                : "bg-warning animate-pulse"
        }`}
      />
      <span className="text-[10px]">{label}</span>
    </div>
  );
}
