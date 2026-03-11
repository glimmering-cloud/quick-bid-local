import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, User, Timer, MapPin, Star, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { RankedBid } from "@/lib/ranking";
import { estimateETA } from "@/lib/ranking";

interface BidRankingCardProps {
  rankedBid: RankedBid;
  index: number;
  isCustomer: boolean;
  requestConfirmed: boolean;
  onAccept: () => void;
}

export function BidRankingCard({ rankedBid, index, isCustomer, requestConfirmed, onAccept }: BidRankingCardProps) {
  const { bid, score, tags } = rankedBid;
  const distKm = bid.provider?.latitude ? undefined : undefined; // will use tag
  const eta = estimateETA(1); // default

  const tagColorMap: Record<string, string> = {
    success: "bg-success/10 text-success border-success/20",
    primary: "bg-primary/10 text-primary border-primary/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    accent: "bg-accent/10 text-accent-foreground border-accent/20",
  };

  return (
    <Card
      className={`transition-all animate-fade-in-up ${
        index === 0 ? "border-primary/30 shadow-md ring-1 ring-primary/10" : ""
      } ${bid.status === "accepted" ? "border-success/30 bg-success/5" : ""}`}
    >
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-bold">
              #{index + 1}
            </div>
            <div>
              <p className="font-medium">{bid.profiles?.display_name || "Provider"}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {bid.provider?.rating && (
                  <span className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 text-warning" />
                    {Number(bid.provider.rating).toFixed(1)}
                  </span>
                )}
                {bid.estimated_wait_minutes && (
                  <span className="flex items-center gap-0.5">
                    <Timer className="h-3 w-3" />
                    {bid.estimated_wait_minutes} min
                  </span>
                )}
                <span className="flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" />
                  Score: {(score * 100).toFixed(0)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-heading text-xl font-bold">CHF {Number(bid.price).toFixed(0)}</p>
            </div>
            {isCustomer && !requestConfirmed && bid.status === "pending" && (
              <Button size="sm" onClick={onAccept}>
                <Check className="mr-1 h-4 w-4" />
                Accept
              </Button>
            )}
            {bid.status === "accepted" && (
              <span className="rounded-full bg-success/10 border border-success/20 px-3 py-1 text-sm font-medium text-success">
                Accepted
              </span>
            )}
          </div>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag.label}
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${tagColorMap[tag.color] || tagColorMap.primary}`}
                title={tag.reason}
              >
                {tag.label}
                <span className="ml-1 text-[10px] opacity-70">— {tag.reason}</span>
              </span>
            ))}
          </div>
        )}

        {bid.message && (
          <p className="text-sm text-muted-foreground line-clamp-2">{bid.message}</p>
        )}
      </CardContent>
    </Card>
  );
}
