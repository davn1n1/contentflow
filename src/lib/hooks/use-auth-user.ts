"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface AirtableUser {
  id: string;
  airtable_id: string;
  name: string | null;
  email: string | null;
  status: string | null;
  rol: string[];
  account_ids: string[];
  account_names: string[];
  agency_ids: string[];
  user_val: string | null;
  notes: string | null;
  created: string;
}

export function useAuthUser() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["auth-user"],
    queryFn: async (): Promise<{ profile: { id: string; email: string; airtable_user_id: string | null }; airtableUser: AirtableUser | null } | null> => {
      // 1. Get Supabase session
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        // "Auth session missing!" is expected during logout — not an error
        return null;
      }

      // 2. Get profile (with airtable_user_id)
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, airtable_user_id")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        console.error("[useAuthUser] Profile fetch failed:", profileError?.message);
        return null;
      }

      console.log("[useAuthUser] Profile loaded:", profile.email, "airtable_user_id:", profile.airtable_user_id);

      // 3. Fetch Airtable user data if linked
      let airtableUser: AirtableUser | null = null;
      if (profile.airtable_user_id) {
        try {
          const res = await fetch(`/api/data/users?airtableId=${encodeURIComponent(profile.airtable_user_id)}`);
          if (res.ok) {
            airtableUser = await res.json();
            console.log("[useAuthUser] Airtable user loaded:", airtableUser?.name, "accounts:", airtableUser?.account_ids);
          } else {
            console.error("[useAuthUser] /api/data/users failed:", res.status, await res.text());
          }
        } catch (err) {
          console.error("[useAuthUser] /api/data/users error:", err);
        }
      } else {
        console.warn("[useAuthUser] No airtable_user_id in profile");
      }

      return { profile, airtableUser };
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnMount: "always", // Always refetch on mount (critical for logout→login with different user)
    gcTime: 0, // Don't keep stale null results after component unmounts
  });
}
