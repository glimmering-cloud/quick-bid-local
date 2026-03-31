import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Timer, Star, Navigation, Sparkles, Award, Building2, User, Briefcase } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { RankedBid } from "@/lib/ranking";
import { estimateETA } from "@/lib/ranking";

interface BidRankingCardProps {
  rankedBid: RankedBid;
  index: number;
  isCustomer: boolean;
  requestConfirmed: boolean;
  requestLat?: number;
  requestLng?: number;
  onAccept: () => void;
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

const PROVIDER_TYPE_ICONS: Record<string, typeof Building2> = {
  company: Building2,
  agency: Briefcase,
  individual: User,
};

export function BidRankingCard({ rankedBid, index, isCustomer, requestConfirmed, requestLat, requestLng, onAccept }: BidRankingCardProps) {
  const { bid, score, tags } = rankedBid;
  const { t } = useTranslation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const providerName = bid.provider?.business_name || bid.profiles?.display_name || t("auth.provider");
  const providerType = bid.provider?.provider_type || "company";
  const ProviderTypeIcon = PROVIDER_TYPE_ICONS[providerType] || Building2;

  const distKm = (bid.provider?.latitude && bid.provider?.longitude && requestLat && requestLng)
    ? haversine(requestLat, requestLng, bid.provider.latitude, bid.provider.longitude)
    : null;
  const eta = distKm !== null ? estimateETA(distKm) : null;

  const isTop = index === 0;
  const isAccepted = bid.status === "accepted";

  return (
    <Card
      className={`transition-all duration-300 animate-fade-in-up overflow-hidden ${
        isTop ? "border-primary/40 shadow-lg ring-2 ring-primary/15" : "hover:shadow-md"
      } ${isAccepted ? "border-success/40 bg-success/5 ring-2 ring-success/15" : ""}`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Top pick banner */}
      {isTop && !isAccepted && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-1.5 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-primary">{t("bidCard.aiRecommended")}</span>
          <span className="ml-auto text-xs text-primary/70 font-mono">{(score * 100).toFixed(0)}% {t("bidCard.match")}</span>
        </div>
      )}

      <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        {/* Main row - responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Rank badge */}
            <div className={`flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
              isTop ? "bg-primary text-primary-foreground shadow-sm" :
              index === 1 ? "bg-secondary text-foreground" :
              "bg-muted text-muted-foreground"
            }`}>
              {isTop ? <Award className="h-4 w-4 sm:h-5 sm:w-5" /> : `#${index + 1}`}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="font-heading font-semibold text-sm sm:text-base truncate">{providerName}</p>
                <span title={t(`providerType.${providerType}`)}><ProviderTypeIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" /></span>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-0.5 text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                {bid.provider?.rating && (
                  <span className="flex items-center gap-0.5 font-medium">
                    <Star className="h-3 w-3 text-warning fill-warning" />
                    {Number(bid.provider.rating).toFixed(1)}
                  </span>
                )}
                {distKm !== null && (
                  <span className="flex items-center gap-0.5">
                    <Navigation className="h-3 w-3 text-primary" />
                    {distKm.toFixed(1)} km
                  </span>
                )}
                {eta !== null && (
                  <span className="flex items-center gap-0.5 font-medium text-foreground">
                    <Timer className="h-3 w-3 text-success" />
                    ~{eta} min ETA
                  </span>
                )}
                {bid.estimated_wait_minutes && (
                  <span className="flex items-center gap-0.5">
                    <Timer className="h-3 w-3" />
                    {bid.estimated_wait_minutes} min {t("bidCard.wait")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Price + action - always visible */}
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 shrink-0">
            <div className="text-left sm:text-right">
              <p className={`font-heading font-bold ${isTop ? "text-xl sm:text-2xl" : "text-lg sm:text-xl"}`}>
                CHF {Number(bid.price).toFixed(0)}
              </p>
              {!isTop && (
                <p className="text-[10px] text-muted-foreground">
                  {t("bidCard.score")}: {(score * 100).toFixed(0)}%
                </p>
              )}
            </div>
            {isCustomer && !requestConfirmed && bid.status === "pending" && (
              <Button
                size={isTop ? "default" : "sm"}
                onClick={() => setConfirmOpen(true)}
                className={`text-xs sm:text-sm ${isTop ? "rounded-xl shadow-sm" : ""}`}
              >
                <Check className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {isTop ? t("bidCard.acceptBest") : t("bidCard.accept")}
              </Button>
            )}
            {isAccepted && (
              <span className="rounded-full bg-success/10 border border-success/20 px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold text-success flex items-center gap-1">
                <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                {t("bidCard.accepted")}
              </span>
            )}
          </div>
        </div>

        {/* Tags row */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 sm:gap-1.5">
            {tags.map((tag) => (
              <Badge
                key={tag.label}
                variant={tag.color === "success" ? "default" : "secondary"}
                className={`text-[10px] sm:text-xs font-medium ${
                  tag.color === "success" ? "bg-success/15 text-success border-success/25 hover:bg-success/20" :
                  tag.color === "warning" ? "bg-warning/15 text-warning border-warning/25 hover:bg-warning/20" :
                  tag.color === "primary" ? "bg-primary/15 text-primary border-primary/25 hover:bg-primary/20" :
                  "bg-accent text-accent-foreground"
                }`}
                title={tag.reason}
              >
                {tag.label}
              </Badge>
            ))}
          </div>
        )}

        {/* Message */}
        {bid.message && (
          <p className="text-xs sm:text-sm text-muted-foreground italic line-clamp-2 border-l-2 border-primary/20 pl-2 sm:pl-3">
            "{bid.message}"
          </p>
        )}
      </CardContent>

      {/* Confirm dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-success" />
              {t("bidCard.confirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                {t("bidCard.confirmDesc")} <strong>{providerName}</strong> {t("bidCard.confirmFor")}{" "}
                <strong>CHF {Number(bid.price).toFixed(0)}</strong>.
              </span>
              {bid.estimated_wait_minutes && (
                <span className="block">⏱ {t("bidCard.estWait")}: {bid.estimated_wait_minutes} {t("bidCard.minutes")}</span>
              )}
              {eta !== null && (
                <span className="block">🚗 {t("bidCard.estArrival")}: ~{eta} {t("bidCard.minutes")}</span>
              )}
              <span className="block text-xs">{t("bidCard.confirmNote")}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("dashboard.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={onAccept} className="bg-success hover:bg-success/90 text-success-foreground">
              {t("bidCard.confirmBook")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
