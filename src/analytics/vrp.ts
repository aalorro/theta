/**
 * Volatility Risk Premium: how much implied vol exceeds realized vol.
 * vrp > 0.20 — implied vol meaningfully above realized; favorable for selling.
 * vrp < 0 — implied vol below realized; option-selling unattractive.
 *
 * Returns null if realized vol is zero or unavailable.
 */
export function vrp(iv: number, realizedVol30d: number): number | null {
  if (realizedVol30d <= 0) return null;
  return (iv - realizedVol30d) / realizedVol30d;
}
