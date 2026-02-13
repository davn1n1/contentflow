"use client";

import { GenericDataTable } from "@/components/app-data/generic-data-table";
import { Megaphone } from "lucide-react";

export default function AudienciaPage() {
  return (
    <GenericDataTable
      table="audiencia"
      title="Audiencia"
      icon={<Megaphone className="w-5 h-5" />}
      description="Perfiles de audiencia objetivo"
    />
  );
}
