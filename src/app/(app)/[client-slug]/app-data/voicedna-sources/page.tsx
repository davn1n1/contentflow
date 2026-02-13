"use client";

import { GenericDataTable } from "@/components/app-data/generic-data-table";
import { FlaskConical } from "lucide-react";

export default function VoicednaSourcesPage() {
  return (
    <GenericDataTable
      table="voicedna-sources"
      title="VoiceDNA Sources"
      icon={<FlaskConical className="w-5 h-5" />}
      description="Fuentes para análisis de VoiceDNA"
    />
  );
}
