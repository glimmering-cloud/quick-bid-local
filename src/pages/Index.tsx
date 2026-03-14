import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Zap, MapPin, Clock, ArrowRight, Sparkles, Shield, Globe,
  Star, Users, CheckCircle2, ChevronRight, TrendingUp
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { SERVICE_CATEGORIES } from "@/lib/categories";

const STATS = [
  { value: "500+", label: "Service Providers" },
  { value: "< 30s", label: "Avg Response Time" },
  { value: "4.8★", label: "Customer Rating" },
  { value: "Zurich", label: "City Coverage" },
];

const TESTIMONIALS = [
  {
    name: "Lena M.",
    role: "Customer",
    text: "Found a plumber in under 2 minutes. The bidding system saved me CHF 80 compared to my usual repair service.",
    rating: 5,
  },
  {
    name: "Marco B.",
    role: "Barber / Provider",
    text: "I get new clients every day through QuickServe. The AI pricing suggestions help me stay competitive.",
    rating: 5,
  },
  {
    name: "Sarah K.",
    role: "Customer",
    text: "Best home services app in Zurich. Real-time bids, transparent pricing, and I can see provider ratings before booking.",
    rating: 5,
  },
];

export default function Index() {
  const { user, profile } = useAuth();

  return (
    <div className="flex flex-col items-center -mt-6">
      {/* Hero */}
      <section className="relative w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative flex flex-col items-center text-center py-20 sm:py-32 px-4 max-w-3xl mx-auto">
          <div className="mb-8 flex h-18 w-18 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25 p-4">
            <Zap className="h-9 w-9 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
            Local services,{" "}
            <span className="text-primary">delivered fast.</span>
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-muted-foreground max-w-lg leading-relaxed">
            Post your request. Nearby providers compete with real-time bids. AI ranks them by price, distance, rating & speed.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {SERVICE_CATEGORIES.slice(0, 5).map((cat) => (
              <span
                key={cat.id}
                className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm text-muted-foreground shadow-sm"
              >
                {cat.emoji} {cat.label.split("/")[0].trim()}
              </span>
            ))}
            <span className="inline-flex items-center rounded-full border bg-card px-3 py-1.5 text-sm text-muted-foreground shadow-sm">
              +{SERVICE_CATEGORIES.length - 5} more
            </span>
          </div>
          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            {user && profile ? (
              <Link to={profile.role === "provider" ? "/provider" : "/dashboard"}>
                <Button size="lg" className="gap-2 text-base px-8 h-12">
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button size="lg" className="gap-2 text-base px-8 h-12 shadow-lg shadow-primary/20">
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="lg" variant="outline" className="gap-2 text-base px-8 h-12">
                    I'm a Provider
                    <Shield className="h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="w-full border-y bg-card/50">
        <div className="container py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-heading text-2xl sm:text-3xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="w-full py-20">
        <div className="container max-w-4xl">
          <div className="text-center mb-14">
            <p className="text-sm font-medium text-primary mb-2">Simple process</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold">How it works</h2>
            <p className="text-muted-foreground mt-3 max-w-md mx-auto">
              From request to booked provider in under 60 seconds
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                icon: Sparkles,
                title: "Describe your need",
                desc: "Type in plain language or pick a category. Our AI parses your request — service type, time, and location.",
              },
              {
                icon: Zap,
                title: "Get real-time bids",
                desc: "Nearby providers see your request instantly and submit competitive price offers in CHF.",
              },
              {
                icon: CheckCircle2,
                title: "Book the best",
                desc: "AI ranks bids by price, distance, rating & speed. One tap to confirm your booking.",
              },
            ].map((step, i) => (
              <div key={i} className="relative flex flex-col items-center text-center space-y-4 p-6 rounded-2xl bg-card border shadow-sm">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-md">
                  {i + 1}
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary mt-2">
                  <step.icon className="h-7 w-7 text-foreground" />
                </div>
                <h3 className="font-heading text-lg font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services grid */}
      <section className="w-full py-20 bg-secondary/30">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <p className="text-sm font-medium text-primary mb-2">Wide coverage</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold">Popular Services</h2>
            <p className="text-muted-foreground mt-3">All the local services you need, one platform</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {SERVICE_CATEGORIES.map((cat) => (
              <Card
                key={cat.id}
                className="group cursor-pointer transition-all hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5"
              >
                <CardContent className="flex flex-col items-center gap-2.5 p-6 text-center">
                  <span className="text-3xl group-hover:scale-110 transition-transform">{cat.emoji}</span>
                  <span className="font-heading text-sm font-semibold">{cat.label}</span>
                  <span className="text-xs text-muted-foreground">from CHF {cat.avgPrice}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="w-full py-20">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <p className="text-sm font-medium text-primary mb-2">Trusted by locals</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold">What people say</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <Card key={t.name} className="bg-card">
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">"{t.text}"</p>
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-bold">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="w-full py-20 bg-primary/5">
          <div className="container max-w-2xl text-center">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold">
              Ready to get started?
            </h2>
            <p className="text-muted-foreground mt-4 text-lg">
              Join hundreds of customers and providers on Zurich's fastest-growing services marketplace.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/auth">
                <Button size="lg" className="gap-2 text-base px-8 h-12 shadow-lg shadow-primary/20">
                  Create Free Account
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
