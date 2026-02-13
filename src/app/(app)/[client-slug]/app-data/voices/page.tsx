"use client";

import { GenericDataTable } from "@/components/app-data/generic-data-table";
import { Mic } from "lucide-react";

export default function VoicesPage() {
  return (
    <GenericDataTable
      table="voices"
      title="Voices"
      icon={<Mic className="w-5 h-5" />}
      description="Perfiles de voz para narración"
    />
  );
}
