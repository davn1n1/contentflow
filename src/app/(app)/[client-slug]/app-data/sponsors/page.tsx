"use client";

import { GenericDataTable } from "@/components/app-data/generic-data-table";
import { Banknote } from "lucide-react";

export default function SponsorsPage() {
  return (
    <GenericDataTable
      table="sponsors"
      title="Sponsors"
      icon={<Banknote className="w-5 h-5" />}
      description="Información de patrocinadores"
      preferredImageField="Logo"
    />
  );
}
