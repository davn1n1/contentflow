"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAccountStore } from "@/lib/stores/account-store";
import { cn } from "@/lib/utils";
import { ChevronDown, Building2, Check } from "lucide-react";

export function ClientSelector() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { currentAccount, accounts, setCurrentAccount } = useAccountStore();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (account: typeof currentAccount) => {
    if (!account) return;
    setCurrentAccount(account);
    const newSlug = (account.nameapp || account.name || "").toLowerCase().replace(/\s+/g, "-");

    // Extract current section from pathname: /old-slug/section/... → /section/...
    const segments = pathname.split("/");
    const sectionPath = segments.length > 2 ? "/" + segments.slice(2).join("/") : "/videos";
    router.push(`/${newSlug}${sectionPath}`);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm",
          open
            ? "border-primary/40 bg-primary/5"
            : "border-border hover:border-primary/20 hover:bg-muted"
        )}
      >
        <Building2 className="w-4 h-4 text-primary" />
        <span className="font-medium max-w-[180px] truncate">
          {currentAccount?.name || "Select Account"}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && accounts.length > 0 && (
        <div className="absolute top-full left-0 mt-1 w-64 rounded-xl border border-border bg-popover shadow-xl shadow-black/20 overflow-hidden z-50">
          <div className="p-1">
            {accounts.map((account) => (
              <button
                key={account.id}
                onClick={() => handleSelect(account)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  account.id === currentAccount?.id
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {account.name?.charAt(0) || "?"}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="font-medium truncate">{account.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {account.status || "Active"}
                  </div>
                </div>
                {account.id === currentAccount?.id && (
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
