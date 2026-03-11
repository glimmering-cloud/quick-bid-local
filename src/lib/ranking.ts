import type { Bid } from "@/lib/types";

export interface RankedBid {
  bid: Bid & { profiles: any; provider?: any };
  score: number;
  priceScore: number;
  distanceScore: number;
  ratingScore: number;
  speedScore: number;
  tags: { label: string; reason: string; color: string }[];
}

export function rankBids(
  bids: (Bid & { profiles: any; provider?: any })[],
  requestLat: number,
  requestLng: number
): RankedBid[] {
  if (bids.length === 0) return [];

  const prices = bids.map((b) => Number(b.price));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  const distances = bids.map((b) => {
    if (b.provider?.latitude && b.provider?.longitude) {
      return haversine(requestLat, requestLng, b.provider.latitude, b.provider.longitude);
    }
    return 2; // default 2km
  });
  const minDist = Math.min(...distances);
  const maxDist = Math.max(...distances);
  const distRange = maxDist - minDist || 1;

  const ratings = bids.map((b) => Number(b.provider?.rating || 4.0));
  const speeds = bids.map((b) => {
    const created = new Date(b.created_at).getTime();
    return created;
  });
  const minSpeed = Math.min(...speeds);
  const maxSpeed = Math.max(...speeds);
  const speedRange = maxSpeed - minSpeed || 1;

  const ranked: RankedBid[] = bids.map((bid, i) => {
    const priceScore = 1 - (prices[i] - minPrice) / priceRange;
    const distanceScore = 1 - (distances[i] - minDist) / distRange;
    const ratingScore = (ratings[i] - 3) / 2; // normalize 3-5 to 0-1
    const speedScore = 1 - (speeds[i] - minSpeed) / speedRange;

    const score =
      0.4 * priceScore +
      0.3 * distanceScore +
      0.2 * ratingScore +
      0.1 * speedScore;

    return { bid, score, priceScore, distanceScore, ratingScore, speedScore, tags: [] };
  });

  ranked.sort((a, b) => b.score - a.score);

  // Assign tags
  const bestPrice = ranked.reduce((best, r) => (r.priceScore > best.priceScore ? r : best), ranked[0]);
  const closest = ranked.reduce((best, r) => (r.distanceScore > best.distanceScore ? r : best), ranked[0]);
  const topRated = ranked.reduce((best, r) => (r.ratingScore > best.ratingScore ? r : best), ranked[0]);
  const fastest = ranked.reduce((best, r) => (r.speedScore > best.speedScore ? r : best), ranked[0]);

  bestPrice.tags.push({ label: "Best Price", reason: `Lowest bid at CHF ${Number(bestPrice.bid.price).toFixed(0)}`, color: "success" });
  closest.tags.push({ label: "Closest", reason: `Nearest provider to your location`, color: "primary" });
  topRated.tags.push({ label: "Top Rated", reason: `Rating: ${Number(topRated.bid.provider?.rating || 4.0).toFixed(1)}★`, color: "warning" });
  fastest.tags.push({ label: "Fastest Response", reason: `First to respond`, color: "accent" });

  if (ranked[0]) {
    const hasRecommended = ranked[0].tags.some(t => t.label === "Recommended");
    if (!hasRecommended) {
      ranked[0].tags.unshift({ label: "⭐ Recommended", reason: "Best overall score combining price, distance, rating & speed", color: "primary" });
    }
  }

  return ranked;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function estimateETA(distKm: number): number {
  // Assume average city speed of 20km/h walking + transit
  return Math.max(3, Math.round((distKm / 20) * 60 + 5));
}
