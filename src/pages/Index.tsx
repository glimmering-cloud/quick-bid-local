import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Zap, MapPin, Clock, ArrowRight, Sparkles, Shield,
  Star, CheckCircle2, TrendingUp, ChevronDown
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { SERVICE_CATEGORIES } from "@/lib/categories";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

const STATS = [
  { value: "500+", label: "Service Providers", icon: "👷" },
  { value: "< 30s", label: "Avg Response Time", icon: "⚡" },
  { value: "4.8★", label: "Customer Rating", icon: "⭐" },
  { value: "Zurich", label: "City Coverage", icon: "🇨🇭" },
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
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/2 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.06)_0%,transparent_70%)] pointer-events-none" />
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="relative flex flex-col items-center text-center py-20 sm:py-28 lg:py-36 px-4 max-w-3xl mx-auto"
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="mb-7">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
              <Zap className="h-8 w-8 sm:h-10 sm:w-10 text-primary-foreground" />
            </div>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08]"
          >
            Local services,{" "}
            <span className="text-primary relative">
              delivered fast.
              <svg className="absolute -bottom-1 left-0 w-full h-2 text-primary/30" viewBox="0 0 200 8" preserveAspectRatio="none">
                <path d="M0 7 Q50 0 100 5 Q150 0 200 7" stroke="currentColor" strokeWidth="2.5" fill="none" />
              </svg>
            </span>
          </motion.h1>
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mt-5 text-base sm:text-lg text-muted-foreground max-w-lg leading-relaxed"
          >
            Post your request. Nearby providers compete with real-time bids. AI ranks them by price, distance, rating & speed.
          </motion.p>
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="mt-6 flex flex-wrap justify-center gap-2">
            {SERVICE_CATEGORIES.slice(0, 5).map((cat) => (
              <span
                key={cat.id}
                className="inline-flex items-center gap-1.5 rounded-full border bg-card/80 backdrop-blur-sm px-3 py-1.5 text-sm text-muted-foreground shadow-sm hover:border-primary/20 transition-colors"
              >
                {cat.emoji} {cat.label.split("/")[0].trim()}
              </span>
            ))}
            <span className="inline-flex items-center rounded-full border bg-card/80 backdrop-blur-sm px-3 py-1.5 text-sm text-muted-foreground shadow-sm">
              +{SERVICE_CATEGORIES.length - 5} more
            </span>
          </motion.div>
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="mt-10 flex flex-col sm:flex-row gap-3">
            {user && profile ? (
              <Link to={profile.role === "provider" ? "/provider" : "/dashboard"}>
                <Button size="lg" className="gap-2 text-base px-8 h-12 rounded-xl">
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button size="lg" className="gap-2 text-base px-8 h-12 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 transition-shadow">
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="lg" variant="outline" className="gap-2 text-base px-8 h-12 rounded-xl">
                    I'm a Provider
                    <Shield className="h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}
          </motion.div>
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-12 text-muted-foreground/40"
          >
            <ChevronDown className="h-5 w-5 animate-bounce" />
          </motion.div>
        </motion.div>
      </section>

      {/* Stats bar */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={stagger}
        className="w-full border-y bg-card/50"
      >
        <div className="container py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {STATS.map((stat) => (
              <motion.div key={stat.label} variants={fadeUp} transition={{ duration: 0.4 }} className="text-center space-y-1">
                <span className="text-2xl">{stat.icon}</span>
                <p className="font-heading text-2xl sm:text-3xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* How it works */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={stagger}
        className="w-full py-20 sm:py-24"
      >
        <div className="container max-w-4xl">
          <motion.div variants={fadeUp} transition={{ duration: 0.4 }} className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
              <Sparkles className="h-3 w-3" /> Simple process
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold">How it works</h2>
            <p className="text-muted-foreground mt-3 max-w-md mx-auto">
              From request to booked provider in under 60 seconds
            </p>
          </motion.div>
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
              <motion.div
                key={i}
                variants={fadeUp}
                transition={{ duration: 0.4 }}
                className="relative flex flex-col items-center text-center space-y-4 p-6 rounded-2xl bg-card border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-md">
                  {i + 1}
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary mt-2">
                  <step.icon className="h-7 w-7 text-foreground" />
                </div>
                <h3 className="font-heading text-lg font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Services grid */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={stagger}
        className="w-full py-20 bg-secondary/30"
      >
        <div className="container max-w-4xl">
          <motion.div variants={fadeUp} transition={{ duration: 0.4 }} className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
              <MapPin className="h-3 w-3" /> Wide coverage
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold">Popular Services</h2>
            <p className="text-muted-foreground mt-3">All the local services you need, one platform</p>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {SERVICE_CATEGORIES.map((cat) => (
              <motion.div key={cat.id} variants={fadeUp} transition={{ duration: 0.3 }}>
                <Card className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-primary/20 hover:-translate-y-1">
                  <CardContent className="flex flex-col items-center gap-2.5 p-6 text-center">
                    <span className="text-3xl group-hover:scale-110 transition-transform duration-300">{cat.emoji}</span>
                    <span className="font-heading text-sm font-semibold">{cat.label}</span>
                    <span className="text-xs text-muted-foreground">from CHF {cat.avgPrice}</span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Testimonials */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={stagger}
        className="w-full py-20 sm:py-24"
      >
        <div className="container max-w-4xl">
          <motion.div variants={fadeUp} transition={{ duration: 0.4 }} className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
              <Star className="h-3 w-3" /> Trusted by locals
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold">What people say</h2>
          </motion.div>
          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <motion.div key={t.name} variants={fadeUp} transition={{ duration: 0.4 }}>
                <Card className="bg-card h-full hover:shadow-md transition-shadow duration-300">
                  <CardContent className="p-6 space-y-4 flex flex-col h-full">
                    <div className="flex gap-0.5">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-1">"{t.text}"</p>
                    <div className="flex items-center gap-2.5 pt-3 border-t">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA */}
      {!user && (
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={stagger}
          className="w-full py-20 bg-gradient-to-b from-primary/5 to-primary/10"
        >
          <div className="container max-w-2xl text-center">
            <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold">
                Ready to get started?
              </h2>
              <p className="text-muted-foreground mt-4 text-lg">
                Join hundreds of customers and providers on Zurich's fastest-growing services marketplace.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/auth">
                  <Button size="lg" className="gap-2 text-base px-8 h-12 rounded-xl shadow-lg shadow-primary/20">
                    Create Free Account
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">No credit card required · Free for customers</p>
            </motion.div>
          </div>
        </motion.section>
      )}
    </div>
  );
}
