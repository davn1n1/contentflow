"use client";

import { GenericDataTable } from "@/components/app-data/generic-data-table";
import { Users } from "lucide-react";

export default function AvatareSetPage() {
  return (
    <GenericDataTable
      table="avatares-set"
      title="Avatares Set"
      icon={<Users className="w-5 h-5" />}
      description="Conjuntos de avatares predefinidos"
    />
  );
}
