const PeakHourPricingStrategy = require('../../../src/strategies/pricing/PeakHourPricingStrategy');

describe('PeakHourPricingStrategy', () => {
  const strategy = new PeakHourPricingStrategy();

  function makeWindow(startHour, durationMinutes = 30) {
    const start = new Date(2024, 5, 15, startHour, 0, 0);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    return { start: start.toISOString(), end: end.toISOString() };
  }

  const option = { basePrice: 1 }; // $1/min to make math simple

  describe('peak hours (07:00–09:00)', () => {
    it('applies 1.5× at 07:00', () => {
      const { start, end } = makeWindow(7, 30);
      expect(strategy.calculatePrice(option, start, end)).toBe(45); // 1×30×1.5
    });

    it('applies 1.5× at 08:00', () => {
      const { start, end } = makeWindow(8, 60);
      expect(strategy.calculatePrice(option, start, end)).toBe(90); // 1×60×1.5
    });

    it('does NOT apply 1.5× at 09:00 (exclusive upper bound)', () => {
      const { start, end } = makeWindow(9, 30);
      expect(strategy.calculatePrice(option, start, end)).toBe(30); // 1×30×1.0
    });
  });

  describe('peak hours (17:00–19:00)', () => {
    it('applies 1.5× at 17:00', () => {
      const { start, end } = makeWindow(17, 30);
      expect(strategy.calculatePrice(option, start, end)).toBe(45);
    });

    it('applies 1.5× at 18:00', () => {
      const { start, end } = makeWindow(18, 30);
      expect(strategy.calculatePrice(option, start, end)).toBe(45);
    });

    it('does NOT apply 1.5× at 19:00 (exclusive upper bound)', () => {
      const { start, end } = makeWindow(19, 30);
      expect(strategy.calculatePrice(option, start, end)).toBe(30);
    });
  });

  describe('off-peak hours', () => {
    it('uses standard rate at 06:00', () => {
      const { start, end } = makeWindow(6, 30);
      expect(strategy.calculatePrice(option, start, end)).toBe(30);
    });

    it('uses standard rate at 12:00', () => {
      const { start, end } = makeWindow(12, 60);
      expect(strategy.calculatePrice(option, start, end)).toBe(60);
    });

    it('uses standard rate at 20:00', () => {
      const { start, end } = makeWindow(20, 30);
      expect(strategy.calculatePrice(option, start, end)).toBe(30);
    });
  });

  describe('general', () => {
    it('rounds to 2 decimal places', () => {
      const { start, end } = makeWindow(7, 10);
      const price = strategy.calculatePrice({ basePrice: 0.1 }, start, end);
      expect(price).toBe(1.5); // 0.1 × 10 × 1.5 = 1.5
    });

    it('peak price is exactly 1.5× the off-peak price for same window', () => {
      const peakWindow = makeWindow(7, 30);
      const offpeakWindow = makeWindow(12, 30);
      const peakPrice = strategy.calculatePrice(option, peakWindow.start, peakWindow.end);
      const offPeakPrice = strategy.calculatePrice(option, offpeakWindow.start, offpeakWindow.end);
      expect(peakPrice).toBe(offPeakPrice * 1.5);
    });
  });
});
