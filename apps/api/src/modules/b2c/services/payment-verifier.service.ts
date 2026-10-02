import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

export interface ExpectedPayment {
  bookingId: string;
  amount: number;
  currency: string;
}

/**
 * Confirms with Stripe that a payment intent really succeeded for the booking's amount, instead of
 * taking the caller's word for it. Fails closed: with no STRIPE_SECRET_KEY, payments are refused
 * unless ALLOW_UNVERIFIED_PAYMENTS=true is set explicitly (local development only).
 */
@Injectable()
export class PaymentVerifierService {
  private readonly logger = new Logger(PaymentVerifierService.name);

  /** Returns true when Stripe verified the payment, false when it was accepted unverified in development. */
  async verify(paymentIntentId: string, expected: ExpectedPayment): Promise<boolean> {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      if (process.env.ALLOW_UNVERIFIED_PAYMENTS === 'true' && process.env.NODE_ENV !== 'production') {
        this.logger.warn(`Payment for booking ${expected.bookingId} accepted WITHOUT verification (development setting)`);
        return false;
      }
      throw new ServiceUnavailableException('Payments are not configured');
    }

    if (!/^pi_[A-Za-z0-9_]+$/.test(paymentIntentId)) {
      throw new BadRequestException('Invalid payment reference');
    }

    let intent: { status?: string; amount_received?: number; currency?: string; metadata?: Record<string, string> };
    try {
      const response = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, {
        headers: { Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(10000),
      });
      if (response.status === 404) throw new BadRequestException('Payment not found');
      if (!response.ok) throw new Error(`Stripe responded ${response.status}`);
      intent = (await response.json()) as typeof intent;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Could not verify payment for booking ${expected.bookingId}: ${error.message}`);
      throw new ServiceUnavailableException('Payment could not be verified, please try again');
    }

    const expectedMinorUnits = Math.round(expected.amount * 100);
    if (
      intent.status !== 'succeeded' ||
      intent.amount_received !== expectedMinorUnits ||
      intent.currency?.toLowerCase() !== expected.currency.toLowerCase() ||
      // The intent must have been created for this booking, so one payment cannot confirm another booking.
      intent.metadata?.bookingId !== expected.bookingId
    ) {
      this.logger.warn(`Payment ${paymentIntentId} does not match booking ${expected.bookingId}`);
      throw new BadRequestException('Payment does not match this booking');
    }
    return true;
  }
}
