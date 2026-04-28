/**
 * Covered call P&L at expiration (European-style).
 * If assigned (S_T > K): upside capped at strike + premium.
 * If unassigned (S_T <= K): full stock P&L + premium received.
 */
export function coveredCallPnL(
  spotTerminal: number,
  spotEntry: number,
  strike: number,
  premium: number,
  shares: number,
): number {
  if (spotTerminal <= strike) {
    return (spotTerminal - spotEntry + premium) * shares;
  }
  return (strike - spotEntry + premium) * shares;
}

/**
 * Expected value of the short call payout at expiration.
 * This is E[max(0, S_T - K)] — what you owe the buyer on average.
 */
export function expectedPayoutShort(terminalPrices: number[], strike: number): number {
  if (terminalPrices.length === 0) return 0;
  let sum = 0;
  for (const S of terminalPrices) {
    sum += Math.max(0, S - strike);
  }
  return sum / terminalPrices.length;
}
