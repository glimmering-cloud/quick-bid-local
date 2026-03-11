import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { getCategoryById } from "@/lib/categories";

interface PriceSuggestionProps {
  category: string;
  distance_km?: number;
  providerRating?: number;
  onAcceptPrice: (price: number) => void;
}

export function PriceSuggestion({ category, distance_km = 1, providerRating = 4.0, onAcceptPrice }: PriceSuggestionProps) {
  const [suggested, setSuggested] = useState<number | null>(null);

  useEffect(() => {
    const cat = getCategoryById(category);
    const base = cat.avgPrice;
    // Adjust: farther = discount (to compete), higher rating = premium
    const distFactor = Math.max(0.85, 1 - distance_km * 0.03);
    const ratingFactor = 0.9 + (providerRating - 3) * 0.05;
    // Demand simulation: random factor
    const demandFactor = 0.95 + Math.random() * 0.1;
    const price = Math.round(base * distFactor * ratingFactor * demandFactor);
    setSuggested(price);
  }, [category, distance_km, providerRating]);

  if (!suggested) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm">
            AI suggests: <strong className="text-primary">CHF {suggested}</strong>
          </span>
          <span className="text-xs text-muted-foreground">(based on distance, rating & demand)</span>
        </div>
        <button
          onClick={() => onAcceptPrice(suggested)}
          className="text-xs font-medium text-primary hover:underline"
        >
          Use this price
        </button>
      </CardContent>
    </Card>
  );
}
