import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function TermsOfService() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-2xl space-y-6"
    >
      <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="space-y-6">
        <h1 className="font-heading text-3xl font-bold">Terms of Service</h1>
        
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
          <p className="text-sm font-medium text-warning">⚠️ Prototype Notice</p>
          <p className="text-sm text-muted-foreground mt-1">
            This is a <strong>prototype web application</strong> built for the <strong>GenAI Zurich Hackathon 2026</strong> as part of <strong>Project QuickServe</strong>. 
            These terms are for demonstration purposes only.
          </p>
        </div>

        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">1. Prototype Status</h2>
            <p>
              QuickServe is a hackathon prototype and not a production service. No real services are provided, 
              no real payments are processed, and no guarantees are made regarding uptime or data persistence.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">2. Use at Your Own Risk</h2>
            <p>
              This application is provided "as is" without warranties. Users acknowledge that this is a demonstration 
              application and should not rely on it for actual service bookings.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">3. Demo Data</h2>
            <p>
              Provider listings, prices, ratings, and reviews shown in this prototype may be simulated demo data 
              and do not represent real businesses or real customer experiences.
            </p>
          </section>
        </div>
      </div>
    </motion.div>
  );
}
