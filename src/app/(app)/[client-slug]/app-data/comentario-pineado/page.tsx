"use client";

import { GenericDataTable } from "@/components/app-data/generic-data-table";
import { AtSign } from "lucide-react";

export default function ComentarioPineadoPage() {
  return (
    <GenericDataTable
      table="comentario-pineado"
      title="Comentario Pineado"
      icon={<AtSign className="w-5 h-5" />}
      description="Plantillas de comentarios fijados"
    />
  );
}
