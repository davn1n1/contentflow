"use client";

import { GenericDataTable } from "@/components/app-data/generic-data-table";
import { Palette } from "lucide-react";

export default function IdentidadVisualPage() {
  return (
    <GenericDataTable
      table="identidad-visual"
      title="Identidad Visual"
      icon={<Palette className="w-5 h-5" />}
      description="Guías de identidad visual"
    />
  );
}
