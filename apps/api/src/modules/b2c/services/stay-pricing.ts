import { splitBooking } from './settlement.math';

export const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Terms a supplier publishes when it lets other tenants sell a room and rate plan. */
export interface PublishedTerms {
  id: string;
  netRate: number | null;
  maxMarkup: number | null;
  commissionShare: number | null;
}

/**
 * Guest price for a stay. Search and booking both use this, so the price a guest is shown is the
 * price they are charged. `published` is set when the seller does not own the inventory.
 */
export function priceStay(calendarNetRates: number[], markupPct: number, nights: number, published?: PublishedTerms | null) {
  const calendarAvg = calendarNetRates.reduce((sum, rate) => sum + rate, 0) / calendarNetRates.length;
  const avgNetRate = published?.netRate ?? calendarAvg;
  const appliedMarkupPct = published?.maxMarkup != null ? Math.min(markupPct, published.maxMarkup) : markupPct;

  const netRate = Math.round(avgNetRate);
  const sellRate = Math.round(avgNetRate * (1 + appliedMarkupPct / 100));
  const subtotal = Math.round(sellRate * nights);
  const taxTotal = Math.round(subtotal * 0.1); // 10% tax (simplified)
  const totalAmount = subtotal + taxTotal;

  // A seller must receive at least what it will owe the inventory owner.
  const commissionPct = published ? published.commissionShare ?? 0 : null;
  const split = commissionPct === null ? null : splitBooking(totalAmount, netRate * nights, commissionPct);

  return {
    avgNetRate,
    netRate,
    appliedMarkupPct,
    sellRate,
    subtotal,
    taxTotal,
    totalAmount,
    commissionPct,
    sellable: !split || split.ownerAmount <= split.sellerAmount,
  };
}

/** Published inventory a tenant may sell: public to everyone, or reserved for that tenant. */
export const publishedTo = (tenantId: string) => ({
  status: 'active',
  supplierTenantId: { not: tenantId },
  OR: [{ visibilityLevel: 'public' }, { visibilityLevel: 'reserved', reservedFor: tenantId }],
});

export const daysUntil = (date: Date) => Math.floor((date.getTime() - Date.now()) / MS_PER_DAY);
