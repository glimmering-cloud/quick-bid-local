import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Zap } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
        <Zap className="h-8 w-8 text-muted-foreground" />
      </div>
      <h1 className="font-heading text-5xl font-bold">404</h1>
      <p className="mt-2 text-lg text-muted-foreground">This page doesn't exist</p>
      <p className="mt-1 text-sm text-muted-foreground/70">
        The page you're looking for may have been moved or removed.
      </p>
      <Link to="/" className="mt-6">
        <Button variant="outline" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
      </Link>
    </div>
  );
}
