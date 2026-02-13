"use client";

import { GenericDataTable } from "@/components/app-data/generic-data-table";
import { Film } from "lucide-react";

export default function BrollPage() {
  return (
    <GenericDataTable
      table="broll"
      title="Broll Custom"
      icon={<Film className="w-5 h-5" />}
      description="Biblioteca de videos B-roll personalizados"
    />
  );
}
