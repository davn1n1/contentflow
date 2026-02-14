export interface ServiceSelection {
  service_id: string;
  slug: string;
  name: string;
  unit_price: number;
  unit_label: string;
  quantity: number;
}

export interface PricingResult {
  subtotal: number;
  discount: number;
  total: number;
}

export function calculateProposal(
  items: ServiceSelection[],
  discountPercent: number = 0
): PricingResult {
  const subtotal = items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );
  const discount = (subtotal * discountPercent) / 100;
  const total = subtotal - discount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

export function formatCurrency(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
