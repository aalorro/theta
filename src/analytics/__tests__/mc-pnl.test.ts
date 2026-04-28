import { describe, it, expect } from 'vitest';
import { coveredCallPnL, expectedPayoutShort } from '../mc-pnl';

describe('coveredCallPnL', () => {
  const shares = 100;
  const spotEntry = 100;
  const strike = 110;
  const premium = 3;

  it('stock below strike: full stock P&L + premium', () => {
    // S_T = 105, didn't get assigned
    const pnl = coveredCallPnL(105, spotEntry, strike, premium, shares);
    // (105 - 100 + 3) * 100 = 800
    expect(pnl).toBe(800);
  });

  it('stock at strike: unassigned, max upside before cap', () => {
    const pnl = coveredCallPnL(110, spotEntry, strike, premium, shares);
    // (110 - 100 + 3) * 100 = 1300
    expect(pnl).toBe(1300);
  });

  it('stock above strike: capped at strike', () => {
    // S_T = 120, assigned
    const pnl = coveredCallPnL(120, spotEntry, strike, premium, shares);
    // (110 - 100 + 3) * 100 = 1300
    expect(pnl).toBe(1300);
  });

  it('stock drops: loss offset by premium', () => {
    const pnl = coveredCallPnL(90, spotEntry, strike, premium, shares);
    // (90 - 100 + 3) * 100 = -700
    expect(pnl).toBe(-700);
  });

  it('breakeven: stock drops by premium amount', () => {
    const pnl = coveredCallPnL(97, spotEntry, strike, premium, shares);
    // (97 - 100 + 3) * 100 = 0
    expect(pnl).toBe(0);
  });

  it('ATM strike: capped immediately above', () => {
    const pnl = coveredCallPnL(105, spotEntry, 100, premium, shares);
    // (100 - 100 + 3) * 100 = 300
    expect(pnl).toBe(300);
  });
});

describe('expectedPayoutShort', () => {
  it('returns 0 for empty array', () => {
    expect(expectedPayoutShort([], 100)).toBe(0);
  });

  it('returns 0 when all prices below strike', () => {
    expect(expectedPayoutShort([90, 95, 99], 100)).toBe(0);
  });

  it('computes correctly for mixed prices', () => {
    // Prices: [90, 100, 110, 120]
    // Payouts: [0, 0, 10, 20] → mean = 7.5
    expect(expectedPayoutShort([90, 100, 110, 120], 100)).toBe(7.5);
  });

  it('all prices above strike', () => {
    // Prices: [110, 120] → Payouts: [10, 20] → mean = 15
    expect(expectedPayoutShort([110, 120], 100)).toBe(15);
  });
});
