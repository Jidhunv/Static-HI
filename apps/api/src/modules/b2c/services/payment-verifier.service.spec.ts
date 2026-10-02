import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { PaymentVerifierService } from './payment-verifier.service';

const expected = { bookingId: 'b1', amount: 990, currency: 'USD' };
const goodIntent = { status: 'succeeded', amount_received: 99000, currency: 'usd', metadata: { bookingId: 'b1' } };

describe('PaymentVerifierService', () => {
  const env = { ...process.env };
  const service = new PaymentVerifierService();
  const stripeReturns = (body: object, status = 200) => {
    global.fetch = jest.fn(async () => ({ ok: status < 300, status, json: async () => body })) as any;
  };

  beforeEach(() => {
    process.env = { ...env, STRIPE_SECRET_KEY: 'sk_test_x', NODE_ENV: 'test' };
    delete process.env.ALLOW_UNVERIFIED_PAYMENTS;
  });
  afterAll(() => {
    process.env = env;
  });

  it('accepts a succeeded payment for this booking and amount', async () => {
    stripeReturns(goodIntent);
    await expect(service.verify('pi_123', expected)).resolves.toBe(true);
  });

  it.each([
    ['not succeeded', { ...goodIntent, status: 'requires_payment_method' }],
    ['a smaller amount', { ...goodIntent, amount_received: 100 }],
    ['another currency', { ...goodIntent, currency: 'inr' }],
    ['another booking', { ...goodIntent, metadata: { bookingId: 'b2' } }],
    ['no booking recorded', { ...goodIntent, metadata: {} }],
  ])('rejects a payment that is %s', async (_name, intent) => {
    stripeReturns(intent);
    await expect(service.verify('pi_123', expected)).rejects.toThrow(BadRequestException);
  });

  it('rejects a reference Stripe does not know', async () => {
    stripeReturns({}, 404);
    await expect(service.verify('pi_123', expected)).rejects.toThrow(BadRequestException);
  });

  it('rejects a malformed reference without calling Stripe', async () => {
    stripeReturns(goodIntent);
    await expect(service.verify('../customers', expected)).rejects.toThrow(BadRequestException);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('does not confirm when Stripe is unreachable', async () => {
    global.fetch = jest.fn(async () => {
      throw new Error('network down');
    }) as any;
    await expect(service.verify('pi_123', expected)).rejects.toThrow(ServiceUnavailableException);
  });

  it('refuses payments when Stripe is not configured', async () => {
    delete process.env.STRIPE_SECRET_KEY;
    await expect(service.verify('pi_123', expected)).rejects.toThrow(ServiceUnavailableException);
  });

  it('accepts unverified payments only with the explicit development setting', async () => {
    delete process.env.STRIPE_SECRET_KEY;
    process.env.ALLOW_UNVERIFIED_PAYMENTS = 'true';
    await expect(service.verify('anything', expected)).resolves.toBe(false);

    process.env.NODE_ENV = 'production';
    await expect(service.verify('anything', expected)).rejects.toThrow(ServiceUnavailableException);
  });
});
