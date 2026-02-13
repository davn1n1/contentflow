"use client";

import { GenericDataTable } from "@/components/app-data/generic-data-table";
import { Eye } from "lucide-react";

export default function SpyPage() {
  return (
    <GenericDataTable
      table="spy"
      title="Spy Ads & Reels"
      icon={<Eye className="w-5 h-5" />}
      description="Monitoreo de anuncios y reels de competencia"
    />
  );
}
