"use client";

import { GenericDataTable } from "@/components/app-data/generic-data-table";
import { Dna } from "lucide-react";

export default function VoicednaPage() {
  return (
    <GenericDataTable
      table="voicedna"
      title="VoiceDNA"
      icon={<Dna className="w-5 h-5" />}
      description="Perfiles de ADN de voz"
    />
  );
}
