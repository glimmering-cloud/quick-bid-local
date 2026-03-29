import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function PrivacyPolicy() {
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
        <h1 className="font-heading text-3xl font-bold">Privacy Policy</h1>
        
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
          <p className="text-sm font-medium text-warning">⚠️ Prototype Disclaimer</p>
          <p className="text-sm text-muted-foreground mt-1">
            This is a <strong>prototype web application</strong> built for the <strong>GenAI Zurich Hackathon 2026</strong> as part of <strong>Project QuickServe</strong>. 
            This application is not intended for production use and does not process real personal data for commercial purposes.
          </p>
        </div>

        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">1. About This Application</h2>
            <p>
              QuickServe is a prototype/demo application developed as part of the GenAI Zurich Hackathon 2026. 
              It demonstrates an AI-powered local services marketplace concept. All data entered into this application 
              is for demonstration purposes only.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">2. Data Collection</h2>
            <p>
              As a prototype, this application may collect: email addresses for authentication, display names, 
              location preferences, and service request data. This data is stored in a secure cloud database 
              and is used solely for demonstrating the application's functionality.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">3. Data Usage</h2>
            <p>
              Data collected in this prototype is used exclusively for:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Demonstrating the service marketplace functionality</li>
              <li>Showcasing AI-powered request parsing and provider matching</li>
              <li>Hackathon evaluation and presentation purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">4. No Commercial Use</h2>
            <p>
              This prototype does not process payments, does not sell data to third parties, and is not 
              intended for commercial deployment. Any pricing shown is simulated for demonstration purposes.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">5. Data Deletion</h2>
            <p>
              Users can delete their account and all associated data at any time through the Account Settings page. 
              All demo/seed data may be periodically cleared.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">6. Contact</h2>
            <p>
              For questions about this prototype, please reach out to the Project QuickServe team at the GenAI Zurich Hackathon 2026.
            </p>
          </section>
        </div>
      </div>
    </motion.div>
  );
}
