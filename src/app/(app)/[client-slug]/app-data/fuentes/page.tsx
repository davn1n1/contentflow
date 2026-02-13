"use client";

import { GenericDataTable } from "@/components/app-data/generic-data-table";
import { BookOpen } from "lucide-react";

export default function FuentesPage() {
  return (
    <GenericDataTable
      table="fuentes"
      title="Fuentes Inspiración"
      icon={<BookOpen className="w-5 h-5" />}
      description="Fuentes de inspiración para contenido"
    />
  );
}
