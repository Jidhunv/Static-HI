import { priceStay } from './stay-pricing';

describe('priceStay', () => {
  it('prices own inventory from the calendar average with the full markup', () => {
    const price = priceStay([200, 200, 230], 25, 3);
    expect(price).toMatchObject({ netRate: 210, sellRate: 263, subtotal: 789, taxTotal: 79, totalAmount: 868 });
    expect(price.commissionPct).toBeNull();
    expect(price.sellable).toBe(true);
  });

  it('prices published inventory from the published net rate and caps the markup', () => {
    const price = priceStay([200, 200], 25, 5, { id: 'v1', netRate: 150, maxMarkup: 20, commissionShare: 5 });
    expect(price).toMatchObject({
      netRate: 150,
      appliedMarkupPct: 20,
      sellRate: 180,
      subtotal: 900,
      taxTotal: 90,
      totalAmount: 990,
      commissionPct: 5,
      sellable: true,
    });
  });

  it('falls back to the calendar rate when no net rate is published', () => {
    const price = priceStay([100, 120], 10, 2, { id: 'v1', netRate: null, maxMarkup: null, commissionShare: null });
    expect(price).toMatchObject({ netRate: 110, appliedMarkupPct: 10, sellRate: 121, commissionPct: 0 });
  });

  it('is not sellable when the markup cannot cover the amount owed to the owner', () => {
    const price = priceStay([150], 25, 5, { id: 'v1', netRate: 150, maxMarkup: 2, commissionShare: 15 });
    expect(price.sellable).toBe(false);
  });
});
