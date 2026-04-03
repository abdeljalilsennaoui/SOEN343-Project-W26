const PerMinutePricingStrategy = require('../../../src/strategies/pricing/PerMinutePricingStrategy');

describe('PerMinutePricingStrategy', () => {
  const strategy = new PerMinutePricingStrategy();

  function times(startHour, durationMinutes) {
    const start = new Date(2024, 5, 15, startHour, 0, 0); // June 15 2024
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    return { start: start.toISOString(), end: end.toISOString() };
  }

  it('calculates price as basePrice × minutes', () => {
    const { start, end } = times(10, 30);
    const price = strategy.calculatePrice({ basePrice: 2 }, start, end);
    expect(price).toBe(60); // 2 × 30
  });

  it('rounds to 2 decimal places', () => {
    const { start, end } = times(10, 3);
    const price = strategy.calculatePrice({ basePrice: 0.333 }, start, end);
    expect(price).toBe(1); // 0.333 × 3 = 0.999 → rounded to 1.00
  });

  it('applies minimum charge of 1 minute for durations under 1 minute', () => {
    const start = new Date(2024, 5, 15, 10, 0, 0);
    const end = new Date(start.getTime() + 30 * 1000); // 30 seconds
    const price = strategy.calculatePrice({ basePrice: 1 }, start.toISOString(), end.toISOString());
    expect(price).toBe(1); // minimum 1 minute
  });

  it('handles exactly 60 minutes', () => {
    const { start, end } = times(10, 60);
    const price = strategy.calculatePrice({ basePrice: 0.5 }, start, end);
    expect(price).toBe(30); // 0.5 × 60
  });

  it('handles 90 minutes at $1.50/min', () => {
    const { start, end } = times(10, 90);
    const price = strategy.calculatePrice({ basePrice: 1.5 }, start, end);
    expect(price).toBe(135); // 1.5 × 90
  });

  it('returns 0 for zero basePrice', () => {
    const { start, end } = times(10, 60);
    const price = strategy.calculatePrice({ basePrice: 0 }, start, end);
    expect(price).toBe(0);
  });

  it('returns a number (not NaN)', () => {
    const { start, end } = times(14, 45);
    const price = strategy.calculatePrice({ basePrice: 1.25 }, start, end);
    expect(typeof price).toBe('number');
    expect(isNaN(price)).toBe(false);
  });
});
