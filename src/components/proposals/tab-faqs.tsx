"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { GlassCard } from "./glass-card";
import {
  Zap,
  CreditCard,
  Film,
  Receipt,
  Shield,
} from "lucide-react";
import type { FAQCategory } from "@/lib/proposals/constants";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  funcionalidades: Zap,
  "plan-creditos": CreditCard,
  "produccion-calidad": Film,
  "facturacion-pagos": Receipt,
  "seguridad-soporte": Shield,
};

interface TabFAQsProps {
  categories: FAQCategory[];
}

export function TabFAQs({ categories }: TabFAQsProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold gradient-text mb-2">
          Preguntas Frecuentes
        </h2>
        <p className="text-sm text-zinc-400">
          Todo lo que necesitas saber sobre ContentFlow365
        </p>
      </div>

      {categories.map((category) => {
        const Icon = CATEGORY_ICONS[category.id] || Zap;
        return (
          <GlassCard key={category.id} className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Icon className="w-5 h-5 text-[#2996d7]" />
              <h3 className="text-base font-semibold text-zinc-100">
                {category.title}
              </h3>
              <span className="ml-auto text-xs text-zinc-500">
                {category.items.length} preguntas
              </span>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {category.items.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`${category.id}-${i}`}
                  className="border-white/5"
                >
                  <AccordionTrigger className="text-sm text-zinc-300 hover:text-zinc-100 hover:no-underline py-3">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-zinc-400 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </GlassCard>
        );
      })}
    </div>
  );
}
