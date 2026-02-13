"use client";

import { GenericDataTable } from "@/components/app-data/generic-data-table";
import { UserCircle } from "lucide-react";

export default function AvataresPage() {
  return (
    <GenericDataTable
      table="avatares"
      title="Avatares"
      icon={<UserCircle className="w-5 h-5" />}
      description="Gestión de avatares para producción de video"
    />
  );
}
