import { motion } from "framer-motion";
import { Zap, Users, Clock, Globe, ArrowRight, Repeat, Brain, BarChart3, MapPin, Flame, Code, Cloud, Cpu, Map, Timer, DollarSign, Route, Scaling, Eye, Sparkles, Shield, Languages, Accessibility, FileText, Database, CreditCard, Bell, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const Section = ({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) => (
  <section id={id} className={`py-20 md:py-28 ${className}`}>
    <div className="container max-w-5xl">{children}</div>
  </section>
);


export default function About() {
  const problems = [
    { icon: Users, text: "Providers have idle time with no way to find nearby demand" },
    { icon: Eye, text: "Users can't find instant availability — only static listings" },
    { icon: Globe, text: "Existing platforms require tedious manual searching & comparing" },
    { icon: Clock, text: "Real-time demand and supply remain disconnected — no live bidding exists" },
  ];

  const uniqueFeatures = [
    { icon: Zap, label: "⚡ Real-Time Bidding", desc: "Providers compete live with price + ETA — no static listings, no waiting. Bids stream in within seconds of a request.", highlight: true },
    { icon: Brain, label: "🤖 AI-Powered Intelligence", desc: "Natural language parsing turns 'I need a plumber near Zurich at 4 PM' into a structured request. AI ranks bids using price, distance, rating & speed.", highlight: true },
    { icon: Scaling, label: "🔧 Multi-Service Scalability", desc: "From barbers to plumbers to AC repair — one platform scales across all local service categories with zero config changes.", highlight: true },
    { icon: Repeat, label: "Reverse marketplace", desc: "Demand drives supply — users broadcast needs, providers come to them" },
    { icon: Flame, label: "Demand heatmap", desc: "Pricing insights and demand visualization for providers" },
  ];

  const techStack = [
    { icon: Code, label: "React + TypeScript", desc: "Modern, type-safe frontend" },
    { icon: Cloud, label: "Lovable Cloud", desc: "Managed backend, auth, database" },
    { icon: Cpu, label: "AI Integration", desc: "NLP parsing via edge functions + smart ranking algorithm" },
    { icon: Map, label: "Leaflet Maps", desc: "Geo-based provider matching with radius search" },
  ];

  const impacts = [
    { icon: Timer, value: "< 60s", label: "Request to booking" },
    { icon: DollarSign, value: "↑ 40%", label: "Provider utilization" },
    { icon: Route, value: "↓ 30%", label: "Unnecessary travel" },
    { icon: Scaling, value: "∞", label: "Service categories" },
  ];

  const builtFeatures = [
    { icon: Users, title: "Dual Dashboards", desc: "Separate experiences for customers & providers with role-based routing" },
    { icon: Zap, title: "Live Bidding Engine", desc: "Real-time bid submission, AI ranking, and instant notifications" },
    { icon: Brain, title: "AI Request Parsing", desc: "Natural language → service type, location, and time extraction" },
    { icon: MapPin, title: "Location Matching", desc: "Geo-based provider discovery with configurable radius" },
    { icon: CreditCard, title: "Payment System", desc: "Demo payment gateway with transaction history & provider fee tracking" },
    { icon: Shield, title: "GDPR Compliance", desc: "Cookie consent, data export, privacy policy, and signup consent" },
    { icon: Star, title: "Reviews & Complaints", desc: "Full review system + complaint management dashboard for staff" },
    { icon: Bell, title: "Real-time Notifications", desc: "Push notifications for new bids, booking updates, and more" },
    { icon: Languages, title: "5 Languages", desc: "English, German, French, Italian, and Romansh — full i18n" },
    { icon: Accessibility, title: "Accessibility", desc: "High contrast, font scaling, reduced motion, skip links" },
    { icon: FileText, title: "Booking Verification", desc: "PIN-based provider identity verification at service location" },
    { icon: Database, title: "Management Dashboard", desc: "Staff tools for complaints, reviews, and team management" },
  ];

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8">
      {/* Hero / Title Slide */}
      <section className="relative overflow-hidden bg-primary py-28 md:py-40">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-20 h-96 w-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="container relative max-w-5xl text-center">
          <motion.h1
            className="mt-6 font-heading text-5xl font-bold text-primary-foreground md:text-7xl lg:text-8xl"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
          >
            QuickServe
          </motion.h1>
          <motion.p
            className="mx-auto mt-4 max-w-2xl text-xl text-primary-foreground/80 md:text-2xl"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
          >
            Real-Time Bidding Marketplace for Local Services
          </motion.p>
          <motion.p
            className="mx-auto mt-6 max-w-lg text-lg text-primary-foreground/60"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
          >
            Post a request. AI matches providers. Get live bids. Choose the best — across any service category.
          </motion.p>
          <motion.div
            className="mt-10 flex justify-center gap-4"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={4}
          >
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="gap-2 text-base">
                Try the Demo <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Problem */}
      <Section id="problem">
        
        <h2 className="mt-4 font-heading text-3xl font-bold md:text-5xl">
          Local services are <span className="text-destructive">inefficient</span>
        </h2>
        <p className="mt-3 text-lg text-muted-foreground">
          The current ecosystem is broken for both sides of the market.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {problems.map((p, i) => (
            <motion.div
              key={i}
              className="flex items-start gap-4 rounded-xl border bg-card p-6 shadow-sm"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                <p.icon className="h-5 w-5 text-destructive" />
              </div>
              <p className="text-base font-medium">{p.text}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Solution */}
      <Section className="bg-muted/50" id="solution">
        
        <h2 className="mt-4 font-heading text-3xl font-bold md:text-5xl">
          We flip the <span className="text-green-600">marketplace</span>
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-4">
          {[
            { step: "1", title: "User posts request", desc: "Describe what you need in plain language" },
            { step: "2", title: "Providers receive instantly", desc: "Nearby providers get notified in real-time" },
            { step: "3", title: "Bids come in", desc: "Providers compete with price + ETA" },
            { step: "4", title: "Pick the best", desc: "AI ranks by price, distance, rating & speed" },
          ].map((s, i) => (
            <motion.div
              key={i}
              className="text-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-600 text-2xl font-bold text-white">
                {s.step}
              </div>
              <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* What Makes Us Unique */}
      <Section id="unique">
        
        <h2 className="mt-4 font-heading text-3xl font-bold md:text-5xl">
          What makes us <span className="text-purple-600">unique</span>
        </h2>
        <div className="mt-12 space-y-4">
          {uniqueFeatures.map((f, i) => (
            <motion.div
              key={i}
              className={`flex items-center gap-5 rounded-xl border p-5 shadow-sm ${
                (f as any).highlight
                  ? "bg-primary/5 border-primary/30 ring-1 ring-primary/10"
                  : "bg-card"
              }`}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                (f as any).highlight ? "bg-primary/15" : "bg-purple-600/10"
              }`}>
                <f.icon className={`h-6 w-6 ${(f as any).highlight ? "text-primary" : "text-purple-600"}`} />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${(f as any).highlight ? "text-primary" : ""}`}>{f.label}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="mt-8 rounded-xl bg-primary/5 border border-primary/20 p-6 text-center">
          <p className="text-lg font-semibold italic text-primary">
            "We don't help users find services — we make services find users."
          </p>
        </div>
      </Section>

      {/* Technology */}
      <Section className="bg-muted/50" id="tech">
        
        <h2 className="mt-4 font-heading text-3xl font-bold md:text-5xl">Technology</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {techStack.map((t, i) => (
            <motion.div
              key={i}
              className="rounded-xl border bg-card p-6 text-center shadow-sm"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-700/10">
                <t.icon className="h-6 w-6 text-amber-700" />
              </div>
              <h3 className="mt-3 font-bold">{t.label}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
            </motion.div>
          ))}
        </div>
        <div className="mt-10 rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-3">Ranking Formula</h3>
          <div className="flex items-center justify-center rounded-lg bg-muted p-4">
            <code className="text-lg font-mono font-semibold">
              score = 0.4<span className="text-primary">P</span> + 0.3<span className="text-green-600">D</span> + 0.2<span className="text-purple-600">R</span> + 0.1<span className="text-amber-600">S</span>
            </code>
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <span><strong className="text-primary">P</strong> = Price</span>
            <span><strong className="text-green-600">D</strong> = Distance</span>
            <span><strong className="text-purple-600">R</strong> = Rating</span>
            <span><strong className="text-amber-600">S</strong> = Speed</span>
          </div>
        </div>
      </Section>

      {/* Impact */}
      <Section id="impact">
        
        <h2 className="mt-4 font-heading text-3xl font-bold md:text-5xl">Impact</h2>
        <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-4">
          {impacts.map((imp, i) => (
            <motion.div
              key={i}
              className="rounded-xl border bg-card p-6 text-center shadow-sm"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-orange-600/10">
                <imp.icon className="h-6 w-6 text-orange-600" />
              </div>
              <p className="mt-3 text-3xl font-bold">{imp.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{imp.label}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* What We Built */}
      <Section className="bg-muted/50" id="built">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-primary" />
          <h2 className="font-heading text-3xl font-bold md:text-5xl">What we built</h2>
        </div>
        <p className="mt-3 text-lg text-muted-foreground">
          A fully functional prototype built end-to-end during this hackathon.
        </p>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {builtFeatures.map((f, i) => (
            <motion.div
              key={i}
              className="rounded-xl border bg-card p-5 shadow-sm"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-bold">{f.title}</h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Vision */}
      <section className="relative overflow-hidden bg-primary py-28 md:py-36">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 h-80 w-80 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 left-20 h-64 w-64 rounded-full bg-white blur-3xl" />
        </div>
        <div className="container relative max-w-4xl text-center">
          
          <h2 className="mt-6 font-heading text-3xl font-bold text-primary-foreground md:text-5xl">
            The future of local services is real-time
          </h2>
          <div className="mx-auto mt-10 grid max-w-2xl gap-4 text-left md:grid-cols-2">
            {[
              "Demand-driven marketplaces",
              "AI-powered pricing & matching",
              "Global expansion across cities",
              "Turning idle time into opportunity",
            ].map((v, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-3 rounded-lg bg-white/10 p-4"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <ArrowRight className="h-4 w-4 shrink-0 text-primary-foreground" />
                <span className="text-primary-foreground font-medium">{v}</span>
              </motion.div>
            ))}
          </div>
          <p className="mt-10 text-primary-foreground/60 text-lg italic">
            Built with ❤️ at GenAI Zurich Hackathon 2026
          </p>
        </div>
      </section>
    </div>
  );
}
