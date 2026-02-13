"use client";

import { GenericDataTable } from "@/components/app-data/generic-data-table";
import { Tag } from "lucide-react";

export default function BrandsPage() {
  return (
    <GenericDataTable
      table="brands"
      title="Brands"
      icon={<Tag className="w-5 h-5" />}
      description="Marcas de referencia"
      preferredImageField="Profile (from Social Profiles)"
    />
  );
}
