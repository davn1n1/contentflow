"use client";

import Link from "next/link";
import { useAccountStore } from "@/lib/stores/account-store";
import { useTheme } from "next-themes";
import {
  Sun, Moon, Monitor, SlidersHorizontal, Users, UserCircle, Megaphone,
  Film, Mic, BookOpen, Fingerprint, FileText, Target, Shield,
  MessageSquare, Handshake, Tag, Palette, Share2, Sparkles, Music,
  ChevronRight,
} from "lucide-react";

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

const appDataPages = [
  { href: "/app-data/default-settings", title: "Default Settings", description: "Configuracion por defecto de la cuenta", icon: SlidersHorizontal, color: "text-primary" },
  { href: "/app-data/avatares", title: "Avatares", description: "Avatares HeyGen para produccion de video", icon: Users, color: "text-violet-400" },
  { href: "/app-data/avatares-set", title: "Avatares Set", description: "Sets de avatares combinados", icon: Users, color: "text-violet-400" },
  { href: "/app-data/persona", title: "Persona", description: "Identidad del presentador IA", icon: UserCircle, color: "text-blue-400" },
  { href: "/app-data/ctas", title: "CTAs", description: "Plantillas de Call to Action", icon: Megaphone, color: "text-orange-400" },
  { href: "/app-data/broll", title: "Broll Custom", description: "Libreria de B-roll personalizado", icon: Film, color: "text-emerald-400" },
  { href: "/app-data/voices", title: "Voices", description: "Perfiles de voz ElevenLabs", icon: Mic, color: "text-pink-400" },
  { href: "/app-data/fuentes", title: "Fuentes Inspiracion", description: "Fuentes y canales de inspiracion", icon: BookOpen, color: "text-cyan-400" },
  { href: "/app-data/voicedna", title: "VoiceDNA", description: "ADN de voz y estilo de escritura", icon: Fingerprint, color: "text-rose-400" },
  { href: "/app-data/voicedna-sources", title: "VoiceDNA Sources", description: "Material de referencia para VoiceDNA", icon: FileText, color: "text-rose-300" },
  { href: "/app-data/audiencia", title: "Audiencia", description: "Definicion del publico objetivo", icon: Target, color: "text-amber-400" },
  { href: "/app-data/guardarails", title: "GuardaRails", description: "Reglas y restricciones del contenido IA", icon: Shield, color: "text-red-400" },
  { href: "/app-data/comentario-pineado", title: "Comentario Pineado", description: "Comentarios fijados en videos", icon: MessageSquare, color: "text-sky-400" },
  { href: "/app-data/sponsors", title: "Sponsors", description: "Integraciones de patrocinadores", icon: Handshake, color: "text-yellow-400" },
  { href: "/app-data/brands", title: "Brands", description: "Marcas y cuentas asociadas", icon: Tag, color: "text-indigo-400" },
  { href: "/app-data/identidad-visual", title: "Identidad Visual", description: "Colores, tipografia y branding", icon: Palette, color: "text-fuchsia-400" },
  { href: "/app-data/social-profiles", title: "Social Profiles", description: "Perfiles de redes sociales", icon: Share2, color: "text-teal-400" },
  { href: "/app-data/expresiones", title: "Expresiones Miniaturas", description: "Expresiones para thumbnails", icon: Sparkles, color: "text-lime-400" },
  { href: "/app-data/formato-diseno-slides", title: "Formato Diseno Slides", description: "Formatos y disenos de slides", icon: Palette, color: "text-purple-400" },
  { href: "/app-data/estilos-musicales", title: "Estilos Musicales", description: "Preferencias de musica y efectos", icon: Music, color: "text-green-400" },
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

      {/* App Data Pages */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Datos de la App</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Tablas de configuracion y datos asociados a la cuenta
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {appDataPages.map((page) => (
            <Link
              key={page.href}
              href={slug ? `/${slug}${page.href}` : "#"}
              className="glass-card rounded-xl p-4 hover:border-primary/20 transition-all group flex items-center gap-3"
            >
              <div className={`w-9 h-9 rounded-lg bg-muted/50 border border-border/50 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors ${page.color}`}>
                <page.icon className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-sm text-foreground truncate">
                  {page.title}
                </h4>
                <p className="text-[11px] text-muted-foreground truncate">
                  {page.description}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary/60 transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
