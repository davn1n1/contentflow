"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/lib/stores/ui-store";
import { useAccountStore } from "@/lib/stores/account-store";
import { cn } from "@/lib/utils";
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
  Zap,
  Clapperboard,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, global: true },
  { name: "Remotion", href: "/remotion", icon: Clapperboard, global: true },
  { name: "Videos", href: "/videos", icon: Video },
  { name: "Ideas & Research", href: "/ideas", icon: Lightbulb },
  { name: "Script & Audio", href: "/scripts", icon: FileText },
  { name: "Renders", href: "/renders", icon: Film },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Team", href: "/team", icon: Users },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { currentAccount } = useAccountStore();
  const pathname = usePathname();
  const slug = (currentAccount?.nameapp || currentAccount?.name || "").toLowerCase().replace(/\s+/g, "-");

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
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          {!sidebarCollapsed && (
            <span className="font-bold text-sm gradient-text whitespace-nowrap">
              ContentFlow365
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          // For account-specific items, need a valid slug to build the URL
          const href = item.global
            ? item.href
            : slug
              ? `/${slug}${item.href}`
              : "#"; // Disabled until account is loaded
          const isActive = href !== "#" && (pathname === href || pathname.startsWith(href + "/"));
          const isDisabled = href === "#";

          return (
            <Link
              key={item.name}
              href={href}
              onClick={isDisabled ? (e) => e.preventDefault() : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : isDisabled
                    ? "text-muted-foreground/50 cursor-not-allowed"
                    : "text-sidebar-foreground hover:text-foreground hover:bg-muted",
                sidebarCollapsed && "justify-center px-2"
              )}
              title={sidebarCollapsed ? item.name : undefined}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary")} />
              {!sidebarCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-border">
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
