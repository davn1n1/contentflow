"use client";

import { GenericDataTable } from "@/components/app-data/generic-data-table";
import { SlidersHorizontal } from "lucide-react";

export default function DefaultSettingsPage() {
  return (
    <GenericDataTable
      table="default-settings"
      title="Default Settings"
      icon={<SlidersHorizontal className="w-5 h-5" />}
      description="Configuración por defecto de la cuenta"
      autoOpenSingle
    />
  );
}
