"use client";

import { GenericDataTable } from "@/components/app-data/generic-data-table";
import { Shield } from "lucide-react";

export default function GuardarailsPage() {
  return (
    <GenericDataTable
      table="guardarails"
      title="GuardaRails"
      icon={<Shield className="w-5 h-5" />}
      description="Reglas de seguridad para contenido"
    />
  );
}
