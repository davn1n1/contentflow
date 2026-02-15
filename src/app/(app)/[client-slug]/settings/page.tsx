"use client";

import Link from "next/link";
import { useAccountStore } from "@/lib/stores/account-store";
import { useTheme } from "next-themes";
import {
  Sun, Moon, Monitor, Users, Mic, Palette, Music, Shield,
  ChevronRight, SlidersHorizontal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

interface SettingsLink {
  href: string;
  label: string;
}

interface SettingsSection {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  links: SettingsLink[];
}

const settingsSections: SettingsSection[] = [
  {
    title: "Avatares & Persona",
    description: "Avatares HeyGen, sets combinados e identidad del presentador",
    icon: Users,
    color: "text-violet-400",
    bgColor: "from-violet-500/15 to-violet-500/5",
    links: [
      { href: "/app-data/avatares", label: "Avatares" },
      { href: "/app-data/avatares-set", label: "Avatares Set" },
      { href: "/app-data/persona", label: "Persona" },
    ],
  },
  {
    title: "Voices & VoiceDNA",
    description: "Perfiles de voz ElevenLabs y ADN de estilo de escritura",
    icon: Mic,
    color: "text-pink-400",
    bgColor: "from-pink-500/15 to-pink-500/5",
    links: [
      { href: "/app-data/voices", label: "Voices" },
      { href: "/app-data/voicedna", label: "VoiceDNA" },
      { href: "/app-data/voicedna-sources", label: "VoiceDNA Sources" },
    ],
  },
  {
    title: "Identidad Visual",
    description: "Branding, formatos de slides y expresiones para miniaturas",
    icon: Palette,
    color: "text-fuchsia-400",
    bgColor: "from-fuchsia-500/15 to-fuchsia-500/5",
    links: [
      { href: "/app-data/identidad-visual", label: "Identidad Visual" },
      { href: "/app-data/formato-diseno-slides", label: "Formato Slides" },
      { href: "/app-data/expresiones", label: "Expresiones Miniaturas" },
    ],
  },
  {
    title: "Estilos Musicales",
    description: "Preferencias de musica de fondo y efectos de sonido",
    icon: Music,
    color: "text-green-400",
    bgColor: "from-green-500/15 to-green-500/5",
    links: [
      { href: "/app-data/estilos-musicales", label: "Estilos Musicales" },
    ],
  },
  {
    title: "GuardaRails & Audiencia",
    description: "Reglas de contenido IA, publico objetivo y CTAs",
    icon: Shield,
    color: "text-red-400",
    bgColor: "from-red-500/15 to-red-500/5",
    links: [
      { href: "/app-data/guardarails", label: "GuardaRails" },
      { href: "/app-data/audiencia", label: "Audiencia" },
      { href: "/app-data/ctas", label: "CTAs" },
    ],
  },
  {
    title: "Default Settings",
    description: "Configuracion general por defecto de la cuenta",
    icon: SlidersHorizontal,
    color: "text-primary",
    bgColor: "from-primary/15 to-primary/5",
    links: [
      { href: "/app-data/default-settings", label: "Default Settings" },
    ],
  },
];

export default function SettingsPage() {
  const { currentAccount } = useAccountStore();
  const { theme, setTheme } = useTheme();

  const slug = (currentAccount?.nameapp || currentAccount?.name || "")
    .toLowerCase()
    .replace(/\s+/g, "-");

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
              {Array.isArray(currentAccount?.industria) ? currentAccount.industria.join(", ") : currentAccount?.industria || "General"}
            </p>
          </div>
        </div>
      </div>

      {/* Theme / Appearance */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-sm font-semibold text-foreground mb-1">Apariencia</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Elige el tema de la interfaz
        </p>
        <div className="flex gap-2">
          {themeOptions.map((opt) => {
            const active = theme === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                  active
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <opt.icon className="w-4 h-4" />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Settings sections — grouped by zone */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Configuracion de la Cuenta</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Accede a los datos de configuracion de produccion
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {settingsSections.map((section) => (
            <div
              key={section.title}
              className="glass-card rounded-xl overflow-hidden"
            >
              {/* Card header */}
              <div className={`px-5 pt-5 pb-3 bg-gradient-to-br ${section.bgColor}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-background/80 border border-border/50 flex items-center justify-center ${section.color}`}>
                    <section.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">{section.title}</h4>
                    <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{section.description}</p>
                  </div>
                </div>
              </div>
              {/* Links */}
              <div className="px-3 py-2 space-y-0.5">
                {section.links.map((link) => (
                  <Link
                    key={link.href}
                    href={slug ? `/${slug}${link.href}` : "#"}
                    className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-foreground/80 hover:bg-muted/50 hover:text-foreground transition-colors group"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
