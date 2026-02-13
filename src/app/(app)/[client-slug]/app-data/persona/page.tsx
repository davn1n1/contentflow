"use client";

import { GenericDataTable } from "@/components/app-data/generic-data-table";
import { UserCog } from "lucide-react";

export default function PersonaPage() {
  return (
    <GenericDataTable
      table="persona"
      title="Persona"
      icon={<UserCog className="w-5 h-5" />}
      description="Perfiles de presentadores y personas"
    />
  );
}
