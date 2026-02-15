"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useUIStore } from "@/lib/stores/ui-store";
import { useAccountStore } from "@/lib/stores/account-store";
import { useVideoContextStore } from "@/lib/stores/video-context-store";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  LayoutDashboard,
  Video,
  Lightbulb,
  FileText,
  Settings,
  HelpCircle,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Bot,
  ImageIcon,
  Scissors,
  ListVideo,
  Megaphone,
  Clapperboard,
  BarChart3,
  Contact,
  Building2,
  BadgeDollarSign,
  TrendingUp,
  FolderOpen,
  LayoutTemplate,
  Target,
  PenTool,
  Headphones,
  Film,
  PlaySquare,
  UserCircle,
  UserCog,
  Phone,
  Mic,
  BookOpen,
  Dna,
  FlaskConical,
  Shield,
  AtSign,
  Banknote,
  Tag,
  Palette,
  Share2,
  SlidersHorizontal,
  Eye,
  MonitorPlay,
  Rocket,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────

interface NavSubItem {
  name: string;
  tabParam: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  global?: boolean;
  subItems?: NavSubItem[];
}

interface NavSection {
  title: string;
  key: string;
  items: NavItem[];
  collapsible?: boolean;
}

// ─── Section Color Themes ────────────────────────────────

const SECTION_COLORS: Record<string, string> = {
  overview: "#a855f7",           // Purple
  "ads-reels": "#0668E1",       // Meta blue
  "produccion-reels": "#0668E1", // Meta blue
  "produccion-yt": "#FF0000",    // YouTube red
  "app-data": "#06b6d4",
  "gestion-mc": "#f59e0b",      // Amber/gold
};

// ─── Navigation Structure ────────────────────────────────

const sections: NavSection[] = [
  {
    title: "Overview",
    key: "overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, global: true },
    ],
  },
  {
    title: "Ads & Reels",
    key: "ads-reels",
    collapsible: true,
    items: [
      { name: "Campañas", href: "/campanas", icon: FolderOpen },
      { name: "Cartel", href: "/cartel", icon: LayoutTemplate },
      { name: "Selección de Angulos", href: "/angulos", icon: Target },
      { name: "Creación de Copy", href: "/copy-ads", icon: PenTool },
    ],
  },
  {
    title: "Producción Reels & ADs",
    key: "produccion-reels",
    collapsible: true,
    items: [
      { name: "Ideas Inspiración", href: "/ideas-reels", icon: Lightbulb },
      { name: "Script & Audio", href: "/scripts-reels", icon: Headphones },
      { name: "Video Completo", href: "/videos-reels", icon: Film },
      { name: "Montaje Video", href: "/montaje-video", icon: Scissors },
      { name: "Listado Completo", href: "/listado-reels", icon: ListVideo },
    ],
  },
  {
    title: "Producción YT",
    key: "produccion-yt",
    collapsible: true,
    items: [
      { name: "Research", href: "/research", icon: Bot },
      { name: "Ideas Inspiración", href: "/ideas", icon: Lightbulb },
      { name: "Listado Videos", href: "/all-videos", icon: ListVideo },
      {
        name: "Video Studio",
        href: "/videos",
        icon: MonitorPlay,
        subItems: [
          { name: "Copy", tabParam: "copy", icon: FileText },
          { name: "Audio", tabParam: "audio", icon: Headphones },
          { name: "Montaje Video", tabParam: "montaje", icon: Film },
          { name: "Miniaturas", tabParam: "miniaturas", icon: ImageIcon },
          { name: "Render", tabParam: "render", icon: Clapperboard },
        ],
      },
      { name: "YouTube Stats", href: "/youtube-stats", icon: BarChart3 },
      { name: "Clips Opus", href: "/clips", icon: Clapperboard },
      { name: "Remotion Pro", href: "/remotion", icon: Film, global: true },
      { name: "Remotion Lite", href: "/remotion-lite", icon: Rocket, global: true },
      { name: "Templates", href: "/remotion/templates", icon: LayoutTemplate, global: true },
    ],
  },
  {
    title: "App Data",
    key: "app-data",
    collapsible: true,
    items: [
      { name: "Avatares", href: "/app-data/avatares", icon: UserCircle },
      { name: "Avatares Set", href: "/app-data/avatares-set", icon: Users },
      { name: "Persona", href: "/app-data/persona", icon: UserCog },
      { name: "CTAs", href: "/app-data/ctas", icon: Phone },
      { name: "Broll Custom", href: "/app-data/broll", icon: Film },
      { name: "Voices", href: "/app-data/voices", icon: Mic },
      { name: "Fuentes Inspiración", href: "/app-data/fuentes", icon: BookOpen },
      { name: "VoiceDNA", href: "/app-data/voicedna", icon: Dna },
      { name: "VoiceDNA Sources", href: "/app-data/voicedna-sources", icon: FlaskConical },
      { name: "Audiencia", href: "/app-data/audiencia", icon: Megaphone },
      { name: "GuardaRails", href: "/app-data/guardarails", icon: Shield },
      { name: "Comentario Pineado", href: "/app-data/comentario-pineado", icon: AtSign },
      { name: "Sponsors", href: "/app-data/sponsors", icon: Banknote },
      { name: "Brands", href: "/app-data/brands", icon: Tag },
      { name: "Identidad Visual", href: "/app-data/identidad-visual", icon: Palette },
      { name: "Social Profiles", href: "/app-data/social-profiles", icon: Share2 },
      { name: "Default Settings", href: "/app-data/default-settings", icon: SlidersHorizontal },
      { name: "Spy Ads & Reels", href: "/app-data/spy", icon: Eye },
    ],
  },
  {
    title: "Gestión MC",
    key: "gestion-mc",
    collapsible: true,
    items: [
      { name: "Elementos", href: "/gestion/elementos", icon: Contact },
      { name: "Empresarial", href: "/gestion/empresarial", icon: Building2 },
      { name: "Ofertas", href: "/gestion/ofertas", icon: BadgeDollarSign },
      { name: "Transacciones", href: "/gestion/transacciones", icon: TrendingUp },
    ],
  },
];

const bottomNav: NavItem[] = [
  { name: "Centro de Ayuda", href: "/help", icon: HelpCircle, global: true },
  { name: "Settings", href: "/settings", icon: Settings },
];

// ─── Component ───────────────────────────────────────────

const COLLAPSIBLE_KEYS = sections.filter((s) => s.collapsible).map((s) => s.key);

export function Sidebar() {
  const { sidebarCollapsed, collapsedSections, toggleSidebar, toggleSection } = useUIStore();
  const { currentAccount } = useAccountStore();
  const { activeVideoId } = useVideoContextStore();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const slug = (currentAccount?.nameapp || currentAccount?.name || "")
    .toLowerCase()
    .replace(/\s+/g, "-");

  function buildHref(item: NavItem) {
    if (item.global) return item.href;
    // Video Studio: if last video is known, go directly to it
    if (item.subItems && activeVideoId) {
      return slug ? `/${slug}/videos/${activeVideoId}` : "#";
    }
    return slug ? `/${slug}${item.href}` : "#";
  }

  function buildSubItemHref(subItem: NavSubItem) {
    if (!slug || !activeVideoId) return slug ? `/${slug}/videos` : "#";
    return `/${slug}/videos/${activeVideoId}?tab=${subItem.tabParam}`;
  }

  function isActive(href: string) {
    return href !== "#" && (pathname === href || pathname.startsWith(href + "/"));
  }

  function isStudioActive() {
    // Video Studio is active when we're on /videos/[id] (the workspace)
    if (!slug) return false;
    const videoStudioPattern = `/${slug}/videos/`;
    return pathname.startsWith(videoStudioPattern) && pathname !== `/${slug}/videos`;
  }

  function isSubItemActive(subItem: NavSubItem) {
    if (!isStudioActive()) return false;
    const currentTab = searchParams.get("tab") || "copy";
    return currentTab === subItem.tabParam;
  }

  function isSectionActive(section: NavSection) {
    return section.items.some((item) => {
      if (item.subItems) return isStudioActive();
      return isActive(buildHref(item));
    });
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-border flex flex-col transition-all duration-300 z-40",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-border">
        <div className="flex items-center gap-3 overflow-hidden">
          <Image
            src="/logo.png"
            alt="ContentFlow365"
            width={32}
            height={32}
            className="flex-shrink-0"
          />
          {!sidebarCollapsed && (
            <span className="font-bold text-sm gradient-text whitespace-nowrap">
              ContentFlow365
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 px-2 overflow-y-auto scrollbar-thin">
        <div className="space-y-2">
          {sections.map((section) => {
            const isCollapsed = collapsedSections[section.key] ?? false;
            const hasActiveItem = isSectionActive(section);
            const color = SECTION_COLORS[section.key] || "#64748b";

            const isExpanded = section.collapsible && !isCollapsed && !sidebarCollapsed;

            return (
              <div
                key={section.key}
                className="rounded-lg overflow-hidden transition-colors duration-200"
                style={{
                  background: isExpanded
                    ? `${color}18`
                    : hasActiveItem
                      ? `linear-gradient(135deg, ${color}08, ${color}03)`
                      : undefined,
                  border: isExpanded || hasActiveItem
                    ? `1px solid ${color}20`
                    : "1px solid transparent",
                }}
              >
                {/* Section Header */}
                {section.collapsible ? (
                  <button
                    onClick={() => toggleSection(section.key, COLLAPSIBLE_KEYS)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
                      sidebarCollapsed && "justify-center px-1 py-2"
                    )}
                    title={sidebarCollapsed ? section.title : undefined}
                  >
                    {!sidebarCollapsed && (
                      <>
                        {/* Colored dot */}
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span
                          className="flex-1 text-left truncate"
                          style={{ color: hasActiveItem ? color : undefined }}
                        >
                          {section.title}
                        </span>
                        <ChevronDown
                          className={cn(
                            "w-3.5 h-3.5 transition-transform duration-200 text-muted-foreground/50",
                            isCollapsed && "-rotate-90"
                          )}
                        />
                      </>
                    )}
                    {sidebarCollapsed && (
                      <span
                        className="w-6 h-1 rounded-full"
                        style={{ backgroundColor: `${color}60` }}
                      />
                    )}
                  </button>
                ) : (
                  /* Non-collapsible header (Overview) */
                  !sidebarCollapsed ? (
                    <div className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold uppercase tracking-wider">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span style={{ color: hasActiveItem ? color : undefined }}>
                        {section.title}
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-center py-2">
                      <span
                        className="w-6 h-1 rounded-full"
                        style={{ backgroundColor: `${color}60` }}
                      />
                    </div>
                  )
                )}

                {/* Section Items */}
                {(!section.collapsible || !isCollapsed || sidebarCollapsed) && (
                  <div className={cn("pb-1", !sidebarCollapsed && "px-1")}>
                    {section.items.map((item) => {
                      const href = buildHref(item);
                      const active = item.subItems ? isStudioActive() : isActive(href);
                      const disabled = href === "#";
                      const hasSubItems = item.subItems && !sidebarCollapsed;

                      return (
                        <div key={`${section.key}-${item.name}`}>
                          <Link
                            href={href}
                            onClick={disabled ? (e) => e.preventDefault() : undefined}
                            className={cn(
                              "flex items-center gap-3 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 relative",
                              active
                                ? "text-white"
                                : disabled
                                  ? "text-muted-foreground/40 cursor-not-allowed"
                                  : "text-sidebar-foreground hover:text-foreground hover:bg-white/[0.04]",
                              sidebarCollapsed && "justify-center px-2"
                            )}
                            style={
                              active
                                ? {
                                    backgroundColor: `${color}18`,
                                    color: color,
                                  }
                                : undefined
                            }
                            title={sidebarCollapsed ? item.name : undefined}
                          >
                            {/* Active indicator bar */}
                            {active && !sidebarCollapsed && (
                              <span
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full"
                                style={{ backgroundColor: color }}
                              />
                            )}
                            <span style={active ? { color } : undefined}>
                              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                            </span>
                            {!sidebarCollapsed && (
                              <span className="truncate">{item.name}</span>
                            )}
                          </Link>

                          {/* Sub-items for Video Studio */}
                          {hasSubItems && active && item.subItems!.map((subItem) => {
                            const subHref = buildSubItemHref(subItem);
                            const subActive = isSubItemActive(subItem);
                            const SubIcon = subItem.icon;

                            return (
                              <Link
                                key={subItem.tabParam}
                                href={subHref}
                                className={cn(
                                  "flex items-center gap-2.5 pl-9 pr-3 py-1 rounded-md text-xs font-medium transition-all duration-200 relative",
                                  subActive
                                    ? "text-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                                )}
                                style={
                                  subActive
                                    ? {
                                        backgroundColor: `${color}12`,
                                        color: color,
                                      }
                                    : undefined
                                }
                              >
                                {subActive && (
                                  <span
                                    className="absolute left-5 top-1/2 -translate-y-1/2 w-[2px] h-3 rounded-r-full"
                                    style={{ backgroundColor: color }}
                                  />
                                )}
                                <SubIcon className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="truncate">{subItem.name}</span>
                              </Link>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Bottom Nav */}
      <div className="px-2 py-2 border-t border-border space-y-0.5">
        {bottomNav.map((item) => {
          const href = buildHref(item);
          const active = isActive(href);
          const disabled = href === "#";

          return (
            <Link
              key={item.name}
              href={href}
              onClick={disabled ? (e) => e.preventDefault() : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                active
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : disabled
                    ? "text-muted-foreground/50 cursor-not-allowed"
                    : "text-sidebar-foreground hover:text-foreground hover:bg-muted",
                sidebarCollapsed && "justify-center px-2"
              )}
              title={sidebarCollapsed ? item.name : undefined}
            >
              <item.icon
                className={cn(
                  "w-[18px] h-[18px] flex-shrink-0",
                  active && "text-primary"
                )}
              />
              {!sidebarCollapsed && (
                <span className="truncate">{item.name}</span>
              )}
            </Link>
          );
        })}

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
