/**
 * Standard normal CDF using erf approximation (Abramowitz & Stegun 7.1.26).
 * The coefficients approximate erf(x) via: erf(x) ≈ 1 - poly(t)*exp(-x²)
 * Then N(z) = 0.5 * (1 + erf(z / √2)).
 */
function normalCDF(z: number): number {
  if (z > 10) return 1;
  if (z < -10) return 0;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const x = Math.abs(z) * Math.SQRT1_2; // z / sqrt(2)
  const t = 1.0 / (1.0 + p * x);
  const erf = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return z >= 0 ? 0.5 * (1.0 + erf) : 0.5 * (1.0 - erf);
}

/**
 * Black-Scholes European call price.
 * S = spot, K = strike, T = time to expiry in years, r = risk-free rate, sigma = volatility
 */
export function bsCallPrice(S: number, K: number, T: number, r: number, sigma: number): number {
  if (T <= 0) return Math.max(0, S - K);
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  return S * normalCDF(d1) - K * Math.exp(-r * T) * normalCDF(d2);
}

/**
 * Black-Scholes delta for a European call.
 */
export function bsDelta(S: number, K: number, T: number, r: number, sigma: number): number {
  if (T <= 0) return S > K ? 1 : 0;
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  return normalCDF(d1);
}
