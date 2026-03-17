import { Loader2 } from "lucide-react";

export function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-muted" />
          <div className="h-3 w-1/2 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
