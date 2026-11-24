import { auctionRound, bestRival, type AuctionLot, type AuctionRival, type AuctionRound } from '@haven/core';

export { auctionRound, type AuctionRound };

export function closeAuctionLot(lot: AuctionLot, rivals: readonly AuctionRival[], status: 'lost' | 'sold'): void {
  const winner = typeof lot.leader === 'number' ? lot.leader : bestRival(rivals, lot.out);
  if (winner === null) throw Error('Auction has no remaining rival.');
  lot.leader = winner;
  lot.status = status;
}

export function auctionTranscript(openingMilli: number, lot: AuctionLot, rivals: readonly AuctionRival[]): AuctionRound[] {
  let price = openingMilli, out = rivals.map(() => false);
  const rounds: AuctionRound[] = [];
  for (const raise of lot.raises) {
    const round = auctionRound(price, raise, out, rivals);
    rounds.push(round);
    price = round.priceMilli;
    out = round.out;
  }
  return rounds;
}
