"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/lib/stores/ui-store";
import { useAccountStore } from "@/lib/stores/account-store";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  LayoutDashboard,
  Video,
  Lightbulb,
  FileText,
  Film,
  Settings,
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
  Contact,
  Building2,
  BadgeDollarSign,
  TrendingUp,
  Database,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  global?: boolean;
}

interface NavSection {
  title: string;
  key: string;
  items: NavItem[];
  collapsible?: boolean;
}

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
    title: "Producción YT",
    key: "produccion-yt",
    collapsible: true,
    items: [
      { name: "Research", href: "/research", icon: Bot },
      { name: "Ideas Inspiración", href: "/ideas", icon: Lightbulb },
      { name: "Script & Audio", href: "/scripts", icon: FileText },
      { name: "Video Completo", href: "/videos", icon: Video },
      { name: "Miniatura & Publish", href: "/thumbnails", icon: ImageIcon },
      { name: "Clips Opus", href: "/clips", icon: Scissors },
      { name: "Listado Todos", href: "/all-videos", icon: ListVideo },
    ],
  },
  {
    title: "Reels & ADs",
    key: "reels-ads",
    collapsible: true,
    items: [
      { name: "Ads & Reels", href: "/ads-reels", icon: Megaphone },
      { name: "Producción Reels", href: "/produccion-reels", icon: Clapperboard },
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
  { name: "App Data", href: "/app-data", icon: Database },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Team", href: "/team", icon: Users },
];

// ─── Component ───────────────────────────────────────────

export function Sidebar() {
  const { sidebarCollapsed, collapsedSections, toggleSidebar, toggleSection } = useUIStore();
  const { currentAccount } = useAccountStore();
  const pathname = usePathname();
  const slug = (currentAccount?.nameapp || currentAccount?.name || "")
    .toLowerCase()
    .replace(/\s+/g, "-");

  function buildHref(item: NavItem) {
    if (item.global) return item.href;
    return slug ? `/${slug}${item.href}` : "#";
  }

  function isActive(href: string) {
    return href !== "#" && (pathname === href || pathname.startsWith(href + "/"));
  }

  function isSectionActive(section: NavSection) {
    return section.items.some((item) => isActive(buildHref(item)));
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
      <nav className="flex-1 py-3 px-2 overflow-y-auto">
        {sections.map((section) => {
          const isCollapsed = collapsedSections[section.key] ?? false;
          const hasActiveItem = isSectionActive(section);

          return (
            <div key={section.key} className="mb-1">
              {/* Section Header */}
              {section.collapsible ? (
                <button
                  onClick={() => toggleSection(section.key)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider rounded-md transition-colors",
                    hasActiveItem
                      ? "text-primary/80"
                      : "text-muted-foreground/60 hover:text-muted-foreground",
                    sidebarCollapsed && "justify-center px-1"
                  )}
                  title={sidebarCollapsed ? section.title : undefined}
                >
                  {!sidebarCollapsed && (
                    <>
                      <ChevronDown
                        className={cn(
                          "w-3 h-3 transition-transform duration-200",
                          isCollapsed && "-rotate-90"
                        )}
                      />
                      <span>{section.title}</span>
                    </>
                  )}
                  {sidebarCollapsed && (
                    <div className="w-5 h-[1px] bg-border" />
                  )}
                </button>
              ) : (
                !sidebarCollapsed && (
                  <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    {section.title}
                  </div>
                )
              )}

              {/* Section Items */}
              {(!section.collapsible || !isCollapsed || sidebarCollapsed) && (
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const href = buildHref(item);
                    const active = isActive(href);
                    const disabled = href === "#";

                    return (
                      <Link
                        key={item.name}
                        href={href}
                        onClick={disabled ? (e) => e.preventDefault() : undefined}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
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
                </div>
              )}
            </div>
          );
        })}
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
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
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
