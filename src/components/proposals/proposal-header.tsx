"use client";

import { Calendar, Building2, User } from "lucide-react";

interface ProposalHeaderProps {
  prospectName: string;
  companyName?: string;
  createdAt: string;
  expiresAt?: string;
}

export function ProposalHeader({
  prospectName,
  companyName,
  createdAt,
  expiresAt,
}: ProposalHeaderProps) {
  const formattedDate = new Date(createdAt).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const isExpiringSoon =
    expiresAt &&
    new Date(expiresAt).getTime() - Date.now() < 48 * 60 * 60 * 1000;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f0f19]/80 to-[#0a0a0f]/90 border border-[#2996d7]/10 p-8 mb-8">
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#2996d7]/5 blur-3xl" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-[#2996d7]/3 blur-2xl" />

      <div className="relative">
        <p className="text-sm text-[#2996d7] font-medium mb-2 uppercase tracking-wider">
          Propuesta personalizada
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">
          Hola,{" "}
          <span className="bg-gradient-to-r from-[#2996d7] to-[#5bbef0] bg-clip-text text-transparent">
            {prospectName}
          </span>
        </h1>

        <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
          {companyName && (
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              <span>{companyName}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <User className="w-4 h-4" />
            <span>Preparada para ti</span>
          </div>
        </div>

        {isExpiringSoon && expiresAt && (
          <div className="mt-4 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm inline-block">
            Esta propuesta expira el{" "}
            {new Date(expiresAt).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "long",
            })}
          </div>
        )}
      </div>
    </div>
  );
}
