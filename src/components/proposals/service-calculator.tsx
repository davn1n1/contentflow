"use client";

import { Minus, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/proposals/calculator";

interface Service {
  id: string;
  slug: string;
  name: string;
  description: string;
  unit_price: number;
  unit_label: string;
  category: string;
}

export interface CalculatorItem {
  service_id: string;
  slug: string;
  name: string;
  unit_price: number;
  unit_label: string;
  quantity: number;
}

interface ServiceCalculatorProps {
  services: Service[];
  items: CalculatorItem[];
  onItemsChange: (items: CalculatorItem[]) => void;
}

export function ServiceCalculator({
  services,
  items,
  onItemsChange,
}: ServiceCalculatorProps) {
  const videoServices = services.filter((s) => s.category === "video");
  const extraServices = services.filter((s) => s.category === "extra");

  function getQuantity(slug: string): number {
    return items.find((i) => i.slug === slug)?.quantity || 0;
  }

  function setQuantity(service: Service, qty: number) {
    const clamped = Math.max(0, Math.min(99, qty));
    const existing = items.filter((i) => i.slug !== service.slug);

    if (clamped > 0) {
      onItemsChange([
        ...existing,
        {
          service_id: service.id,
          slug: service.slug,
          name: service.name,
          unit_price: service.unit_price,
          unit_label: service.unit_label,
          quantity: clamped,
        },
      ]);
    } else {
      onItemsChange(existing);
    }
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#0f0f19]/80 to-[#0a0a0f]/90 border border-white/5 p-6 mb-8">
      <h2 className="text-lg font-semibold mb-1">Tu plan de contenido</h2>
      <p className="text-sm text-zinc-500 mb-6">
        Ajusta las cantidades mensuales según tus necesidades
      </p>

      {/* Video services */}
      <div className="mb-6">
        <h3 className="text-xs font-medium text-[#2996d7] uppercase tracking-wider mb-3">
          Producción de Video
        </h3>
        <div className="space-y-3">
          {videoServices.map((svc) => (
            <ServiceRow
              key={svc.slug}
              service={svc}
              quantity={getQuantity(svc.slug)}
              onQuantityChange={(qty) => setQuantity(svc, qty)}
            />
          ))}
        </div>
      </div>

      {/* Extra services */}
      <div>
        <h3 className="text-xs font-medium text-[#2996d7] uppercase tracking-wider mb-3">
          Servicios Adicionales
        </h3>
        <div className="space-y-3">
          {extraServices.map((svc) => (
            <ServiceRow
              key={svc.slug}
              service={svc}
              quantity={getQuantity(svc.slug)}
              onQuantityChange={(qty) => setQuantity(svc, qty)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ServiceRow({
  service,
  quantity,
  onQuantityChange,
}: {
  service: Service;
  quantity: number;
  onQuantityChange: (qty: number) => void;
}) {
  const lineTotal = service.unit_price * quantity;

  return (
    <div
      className={`flex items-center gap-4 p-3 rounded-xl border transition-colors ${
        quantity > 0
          ? "border-[#2996d7]/20 bg-[#2996d7]/5"
          : "border-white/5 bg-white/[0.02]"
      }`}
    >
      {/* Name + description */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-200">{service.name}</p>
        <p className="text-xs text-zinc-500 truncate">{service.description}</p>
      </div>

      {/* Unit price */}
      <div className="text-xs text-zinc-500 whitespace-nowrap hidden sm:block">
        {formatCurrency(service.unit_price)}/{service.unit_label}
      </div>

      {/* Quantity control */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onQuantityChange(quantity - 1)}
          disabled={quantity <= 0}
          className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 disabled:opacity-30 transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <input
          type="number"
          value={quantity}
          onChange={(e) => onQuantityChange(parseInt(e.target.value) || 0)}
          className="w-10 h-7 text-center text-sm font-medium bg-transparent border-none outline-none text-zinc-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          onClick={() => onQuantityChange(quantity + 1)}
          className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Line total */}
      <div className="w-20 text-right text-sm font-medium text-zinc-200">
        {quantity > 0 ? formatCurrency(lineTotal) : "—"}
      </div>
    </div>
  );
}
