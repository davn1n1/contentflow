"use client";

import { useEffect, useRef, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ChatWidget } from "@/components/chat/chat-widget";
import { PageTipBanner } from "@/components/engagement/page-tip-banner";
import { NpsSurvey } from "@/components/engagement/nps-survey";
import { useUIStore } from "@/lib/stores/ui-store";
import { useAccountStore } from "@/lib/stores/account-store";
import { useNpsStore } from "@/lib/stores/nps-store";
import { useAuthUser } from "@/lib/hooks/use-auth-user";
import { useAccounts } from "@/lib/hooks/use-accounts";
import type { Account } from "@/types/database";
import { cn } from "@/lib/utils";

function getAccountSlug(account: Account): string {
  return (account.nameapp || account.name || "").toLowerCase().replace(/\s+/g, "-");
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useUIStore();
  const { setAccounts, setCurrentAccount, currentAccount, setAirtableUser } = useAccountStore();
  // Both queries start in PARALLEL — accounts doesn't wait for auth
  const { data: authData, isLoading: authLoading } = useAuthUser();
  const { data: allAccounts, isLoading: accountsLoading } = useAccounts();
  const router = useRouter();
  const pathname = usePathname();
  const hasNavigated = useRef(false);

  const isLoading = authLoading || accountsLoading;

  // Increment NPS session count (once per browser tab)
  useEffect(() => {
    useNpsStore.getState().incrementSession();
  }, []);

  // Reset navigation flag when user changes (logout→login with different user)
  const prevUserRef = useRef<string | null>(null);
  useEffect(() => {
    const currentUserId = authData?.profile?.id || null;
    if (currentUserId && currentUserId !== prevUserRef.current) {
      hasNavigated.current = false; // Allow auto-navigate for new user
      prevUserRef.current = currentUserId;
    }
  }, [authData?.profile?.id]);

  // Store Airtable user when loaded
  useEffect(() => {
    if (authData?.airtableUser) {
      setAirtableUser(authData.airtableUser);
    }
  }, [authData?.airtableUser, setAirtableUser]);

  // Filter accounts by user's Airtable data — runs when both queries are done
  const filteredAccounts = useMemo(() => {
    if (!allAccounts || !authData) return [];

    if (authData.airtableUser) {
      const userAccountIds = authData.airtableUser.account_ids;
      if (userAccountIds.length > 0) {
        const filtered = allAccounts.filter((a) =>
          userAccountIds.includes(a.airtable_id || a.id)
        );
        if (filtered.length > 0) return filtered;
      }
    }

    return allAccounts;
  }, [allAccounts, authData]);

  // Set accounts + auto-navigate when data is ready
  useEffect(() => {
    if (isLoading || !authData || filteredAccounts.length === 0) return;

    setAccounts(filteredAccounts);

    // Select first account if none selected or current not in list
    // Always refresh currentAccount from API data to pick up new fields
    const freshMatch = filteredAccounts.find((a) => a.id === currentAccount?.id);
    let selectedAccount: typeof currentAccount;
    if (freshMatch) {
      selectedAccount = freshMatch;
      setCurrentAccount(freshMatch);
    } else {
      selectedAccount = filteredAccounts[0];
      setCurrentAccount(selectedAccount);
    }

    // Redirect to onboarding if account is in "Onboarding" status
    if (selectedAccount?.status === "Onboarding" && !hasNavigated.current) {
      hasNavigated.current = true;
      router.replace("/onboarding");
      return;
    }

    // Auto-navigate to account URL if on /dashboard or root
    if (selectedAccount && !hasNavigated.current && (pathname === "/dashboard" || pathname === "/")) {
      hasNavigated.current = true;
      const slug = getAccountSlug(selectedAccount);
      if (slug) {
        router.replace(`/${slug}/videos`);
      }
    }
  }, [filteredAccounts, isLoading, authData]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div
        className={cn(
          "transition-all duration-300",
          sidebarCollapsed ? "ml-16" : "ml-64"
        )}
      >
        <Header />
        <main className="p-6">{children}</main>
      </div>
      <ChatWidget />
      <PageTipBanner />
      <NpsSurvey />
    </div>
  );
}
