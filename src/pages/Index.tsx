import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap, MapPin, Clock, ArrowRight, Sparkles, Shield, Globe } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { SERVICE_CATEGORIES } from "@/lib/categories";

export default function Index() {
  const { user, profile } = useAuth();

  return (
    <div className="flex flex-col items-center">
      {/* Hero */}
      <section className="flex flex-col items-center text-center py-16 sm:py-24 px-4 max-w-3xl mx-auto">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
          <Zap className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
          Local services,<br />
          <span className="text-primary">on demand.</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-md">
          Post your request. Nearby providers bid in real-time. Compare offers with AI-powered ranking and book instantly.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {SERVICE_CATEGORIES.slice(0, 5).map((cat) => (
            <span key={cat.id} className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/50 px-3 py-1 text-sm text-muted-foreground">
              {cat.emoji} {cat.label.split("/")[0].trim()}
            </span>
          ))}
          <span className="inline-flex items-center rounded-full border border-border bg-secondary/50 px-3 py-1 text-sm text-muted-foreground">
            +{SERVICE_CATEGORIES.length - 5} more
          </span>
        </div>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          {user && profile ? (
            <Link to={profile.role === "provider" ? "/provider" : "/dashboard"}>
              <Button size="lg" className="gap-2">
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/auth">
                <Button size="lg" className="gap-2">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="gap-2">
                  I'm a Provider
                  <Shield className="h-4 w-4" />
                </Button>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="w-full py-16 border-t">
        <div className="container max-w-3xl">
          <h2 className="font-heading text-2xl font-bold text-center mb-10">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { icon: Sparkles, title: "Describe your need", desc: "Use natural language or pick a category. Our AI parses your request automatically." },
              { icon: Zap, title: "Get real-time bids", desc: "Nearby providers see your request and submit competitive price offers in CHF." },
              { icon: Clock, title: "Book the best", desc: "AI ranks bids by price, distance, rating & speed. Pick your provider and book." },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                  <step.icon className="h-6 w-6 text-foreground" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">{i + 1}</span>
                  <h3 className="font-heading font-semibold">{step.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services grid */}
      <section className="w-full py-16 border-t">
        <div className="container max-w-3xl">
          <h2 className="font-heading text-2xl font-bold text-center mb-2">Services</h2>
          <p className="text-center text-muted-foreground mb-8">All the local services you need, one platform</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SERVICE_CATEGORIES.map((cat) => (
              <div key={cat.id} className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center transition-all hover:shadow-md hover:border-primary/20">
                <span className="text-2xl">{cat.emoji}</span>
                <span className="text-sm font-medium">{cat.label}</span>
                <span className="text-xs text-muted-foreground">from CHF {cat.avgPrice}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
