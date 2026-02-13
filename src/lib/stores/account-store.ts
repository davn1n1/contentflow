import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Account } from "@/types/database";
import type { AirtableUser } from "@/lib/hooks/use-auth-user";

interface AccountState {
  currentAccount: Account | null;
  accounts: Account[];
  airtableUser: AirtableUser | null;
  setCurrentAccount: (account: Account) => void;
  setAccounts: (accounts: Account[]) => void;
  setAirtableUser: (user: AirtableUser | null) => void;
  reset: () => void;
}

export const useAccountStore = create<AccountState>()(
  persist(
    (set) => ({
      currentAccount: null,
      accounts: [],
      airtableUser: null,
      setCurrentAccount: (account) => set({ currentAccount: account }),
      setAccounts: (accounts) => set({ accounts }),
      setAirtableUser: (user) => set({ airtableUser: user }),
      reset: () => set({ currentAccount: null, accounts: [], airtableUser: null }),
    }),
    {
      name: "cf365-account",
      version: 2, // Bump to invalidate stale data from before auth filtering
      // Only persist currentAccount selection — accounts list is always
      // fetched fresh and filtered by user permissions on each load
      partialize: (state) => ({ currentAccount: state.currentAccount }),
    }
  )
);
