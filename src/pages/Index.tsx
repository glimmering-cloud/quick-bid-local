import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Scissors, Zap, MapPin, Clock, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Index() {
  const { user, profile } = useAuth();

  return (
    <div className="flex flex-col items-center">
      {/* Hero */}
      <section className="flex flex-col items-center text-center py-16 sm:py-24 px-4 max-w-3xl mx-auto">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
          <Scissors className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
          Get a haircut,<br />
          <span className="text-primary">right now.</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-md">
          Post your request. Local barbers in Zurich bid in real-time. Pick the best offer and book instantly.
        </p>
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
                  I'm a Barber
                  <Scissors className="h-4 w-4" />
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
              { icon: MapPin, title: "Post your request", desc: "Choose your location near Zurich and preferred time." },
              { icon: Zap, title: "Get real-time bids", desc: "Nearby barbers see your request and submit price offers in CHF." },
              { icon: Clock, title: "Book instantly", desc: "Compare bids, pick your barber, and confirm your appointment." },
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
    </div>
  );
}
