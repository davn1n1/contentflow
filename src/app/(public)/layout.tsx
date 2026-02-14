import { ReactNode } from "react";
import { Film } from "lucide-react";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <header className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-2">
          <Film className="h-6 w-6 text-[#2996d7]" />
          <span className="text-xl font-bold bg-gradient-to-r from-[#2996d7] to-[#5bbef0] bg-clip-text text-transparent">
            ContentFlow365
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>

      <footer className="border-t border-white/5 mt-16 py-8 text-center text-sm text-zinc-500">
        <p>&copy; 2026 ContentFlow365. Producción de video automatizada con IA.</p>
      </footer>
    </div>
  );
}
