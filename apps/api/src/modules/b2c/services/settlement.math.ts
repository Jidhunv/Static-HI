export const PLATFORM_FEE_PCT = 2;
export const GATEWAY_FEE_PCT = 3;

const cents = (n: number) => Math.round(n * 100) / 100;

/**
 * Two-tier split, following CommissionService: the seller collects the guest payment less fees,
 * then owes the inventory owner its net amount plus the agreed commission on that net amount.
 */
export function splitBooking(guestPaid: number, ownerNetAmount: number, commissionPct: number) {
  const platformFee = cents((guestPaid * PLATFORM_FEE_PCT) / 100);
  const gatewayFee = cents((guestPaid * GATEWAY_FEE_PCT) / 100);
  const commission = cents((ownerNetAmount * commissionPct) / 100);
  return {
    platformFee,
    gatewayFee,
    commission,
    sellerAmount: cents(guestPaid - platformFee - gatewayFee),
    ownerAmount: cents(ownerNetAmount + commission),
    markup: cents(guestPaid - ownerNetAmount),
  };
}
