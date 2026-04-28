/**
 * Edge per contract: difference between premium received and expected payout.
 * Positive = option is overpriced (favorable to write).
 * Negative = option is underpriced (unfavorable to write).
 * Multiplied by 100 since each contract = 100 shares.
 */
export function edgePerContract(premium: number, expectedPayoutShort: number): number {
  return (premium - expectedPayoutShort) * 100;
}
