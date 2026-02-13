"use client";

import { GenericDataTable } from "@/components/app-data/generic-data-table";
import { Share2 } from "lucide-react";

export default function SocialProfilesPage() {
  return (
    <GenericDataTable
      table="social-profiles"
      title="Social Profiles"
      icon={<Share2 className="w-5 h-5" />}
      description="Perfiles de redes sociales"
      preferredImageField="Profile"
    />
  );
}
