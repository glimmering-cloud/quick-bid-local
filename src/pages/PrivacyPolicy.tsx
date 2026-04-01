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
        <p className="text-xs text-muted-foreground">Last updated: 1 April 2026</p>

        <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
          <p className="text-sm font-medium text-warning">⚠️ Prototype Disclaimer</p>
          <p className="text-sm text-muted-foreground mt-1">
            This is a <strong>prototype web application</strong> built for the <strong>GenAI Zurich Hackathon 2026</strong> as part of <strong>Project QuickServe</strong>. 
            This application is not intended for production use and does not process real personal data for commercial purposes.
          </p>
        </div>

        <div className="space-y-5 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">1. Controller</h2>
            <p>
              The data controller for this prototype is Project QuickServe, GenAI Zurich Hackathon 2026.
              For data protection inquiries, contact: <strong className="text-foreground">privacy@quickserve.ch</strong> (demo address).
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">2. Data We Collect</h2>
            <p>We collect the following categories of personal data:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Account data:</strong> email address, display name, role (customer/provider)</li>
              <li><strong>Profile data:</strong> phone number, bio, location preferences</li>
              <li><strong>Service data:</strong> service requests, bids, bookings, reviews</li>
              <li><strong>Transaction data:</strong> payment records, fees (demo only — no real charges)</li>
              <li><strong>Technical data:</strong> browser type, language preferences, cookie consent choice</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">3. Legal Basis (GDPR Art. 6)</h2>
            <p>We process your personal data on the following legal bases:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Consent (Art. 6(1)(a)):</strong> You provide consent during registration and cookie acceptance</li>
              <li><strong>Contractual necessity (Art. 6(1)(b)):</strong> Processing needed to provide the service</li>
              <li><strong>Legitimate interest (Art. 6(1)(f)):</strong> Platform security and fraud prevention</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">4. Purpose of Processing</h2>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Providing and operating the local services marketplace</li>
              <li>Matching customers with nearby service providers</li>
              <li>AI-powered request parsing and bid ranking</li>
              <li>Processing demo transactions and maintaining booking records</li>
              <li>Hackathon evaluation and demonstration</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">5. Data Sharing</h2>
            <p>
              We do not sell your data. Data may be shared with:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Service providers:</strong> Limited profile info shared when you create a request or booking</li>
              <li><strong>Infrastructure providers:</strong> Hosting and database services (cloud-based)</li>
              <li><strong>AI services:</strong> Anonymized request text for AI parsing (no personal identifiers sent)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">6. Data Retention</h2>
            <p>
              As a prototype, data is retained for the duration of the hackathon and evaluation period.
              All demo/seed data may be periodically cleared. You may delete your account and all associated
              data at any time via Account Settings.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">7. Your Rights (GDPR Art. 12–23)</h2>
            <p>Under GDPR, you have the right to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Access (Art. 15):</strong> Request a copy of your personal data</li>
              <li><strong>Rectification (Art. 16):</strong> Update inaccurate data via Account Settings</li>
              <li><strong>Erasure (Art. 17):</strong> Delete your account and all data via Account Settings → Danger Zone</li>
              <li><strong>Data portability (Art. 20):</strong> Export your data in JSON format via Account Settings → Export My Data</li>
              <li><strong>Restriction (Art. 18):</strong> Request restriction of processing</li>
              <li><strong>Objection (Art. 21):</strong> Object to processing based on legitimate interest</li>
              <li><strong>Withdraw consent:</strong> You may withdraw consent at any time without affecting prior processing</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">8. Cookies</h2>
            <p>
              We use essential cookies for authentication and user preferences (theme, language).
              No third-party tracking cookies are used. You can manage cookie preferences via the
              consent banner shown on first visit.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">9. Data Security</h2>
            <p>
              We implement technical and organizational measures including: encrypted data transmission (TLS),
              row-level security policies, PIN-based identity verification, masked phone numbers, and
              approximate location sharing until job verification.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">10. International Transfers</h2>
            <p>
              Data may be processed on cloud infrastructure outside Switzerland/EEA. Where applicable, appropriate
              safeguards (Standard Contractual Clauses) are in place per GDPR Art. 46.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">11. Contact & Complaints</h2>
            <p>
              For questions about this privacy policy or to exercise your rights, contact:
              <strong className="text-foreground"> privacy@quickserve.ch</strong> (demo).
            </p>
            <p className="mt-2">
              You also have the right to lodge a complaint with a supervisory authority. In Switzerland,
              this is the <strong>Federal Data Protection and Information Commissioner (FDPIC)</strong>.
            </p>
          </section>
        </div>
      </div>
    </motion.div>
  );
}
