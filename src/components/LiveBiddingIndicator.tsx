import { motion } from "framer-motion";
import { Sparkles, Radio } from "lucide-react";

interface LiveBiddingIndicatorProps {
  bidCount: number;
  isLive: boolean;
}

export function LiveBiddingIndicator({ bidCount, isLive }: LiveBiddingIndicatorProps) {
  if (!isLive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border border-primary/20 bg-primary/5 p-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="h-5 w-5 text-primary" />
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success animate-pulse-dot" />
          </div>
          <div>
            <p className="text-sm font-semibold flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              AI-Powered Live Bidding
            </p>
            <p className="text-xs text-muted-foreground">
              {bidCount === 0
                ? "Matching providers in your area..."
                : `${bidCount} bid${bidCount > 1 ? "s" : ""} received — providers are competing for your job`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-3 w-1 rounded-full bg-primary"
              animate={{ scaleY: [0.4, 1, 0.4] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
