/**
 * Synthetic price series for testing.
 * 253 daily prices starting at $100 with known statistical properties.
 * Generated using a simple deterministic pattern.
 */
export function generateSyntheticPrices(
  startPrice: number,
  days: number,
  dailyDrift: number,
  dailyVol: number,
  seed: number,
): number[] {
  const prices: number[] = [startPrice];
  // Simple deterministic PRNG for reproducibility
  let s = seed;
  const next = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 4294967296;
  };

  for (let i = 1; i <= days; i++) {
    const u1 = next() || 0.0001;
    const u2 = next();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const ret = dailyDrift + dailyVol * z;
    prices.push(prices[i - 1]! * Math.exp(ret));
  }
  return prices;
}

// Standard test series: 252 trading days, ~20% annualized vol, slight upward drift
export const samplePrices = generateSyntheticPrices(100, 252, 0.0003, 0.0126, 42);
