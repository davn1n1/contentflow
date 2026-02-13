"use client";

import { GenericDataTable } from "@/components/app-data/generic-data-table";
import { FolderOpen } from "lucide-react";

export default function CampanasPage() {
  return (
    <GenericDataTable
      table="campanas"
      title="Campañas"
      icon={<FolderOpen className="w-5 h-5" />}
      description="Productos y campañas publicitarias"
      defaultView="gallery"
      defaultSort="desc"
    />
  );
}
