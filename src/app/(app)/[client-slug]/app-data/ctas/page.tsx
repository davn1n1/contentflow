"use client";

import { GenericDataTable } from "@/components/app-data/generic-data-table";
import { Phone } from "lucide-react";

export default function CtasPage() {
  return (
    <GenericDataTable
      table="ctas"
      title="CTAs"
      icon={<Phone className="w-5 h-5" />}
      description="Llamadas a la acción para videos"
    />
  );
}
