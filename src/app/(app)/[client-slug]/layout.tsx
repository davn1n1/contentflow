"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccountStore } from "@/lib/stores/account-store";
import { useParams } from "next/navigation";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const clientSlug = params["client-slug"] as string;
  const { accounts, setCurrentAccount, currentAccount } = useAccountStore();

  useEffect(() => {
    if (!clientSlug || accounts.length === 0) return;

    const matched = accounts.find(
      (a) =>
        a.nameapp === clientSlug ||
        a.name?.toLowerCase().replace(/\s+/g, "-") === clientSlug
    );

    if (matched) {
      // Slug matches an account the user has access to
      if (matched.id !== currentAccount?.id) {
        setCurrentAccount(matched);
      }
    } else {
      // Slug does NOT match any of the user's accounts → redirect to first allowed, keeping current section
      const fallback = accounts[0];
      const fallbackSlug = (fallback.nameapp || fallback.name || "").toLowerCase().replace(/\s+/g, "-");
      if (fallbackSlug) {
        // Preserve current section path (e.g. /app-data/avatares)
        const segments = window.location.pathname.split("/");
        const sectionPath = segments.length > 2 ? "/" + segments.slice(2).join("/") : "/videos";
        router.replace(`/${fallbackSlug}${sectionPath}`);
      }
    }
  }, [clientSlug, accounts]); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
