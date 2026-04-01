import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CONSENT_KEY = "qs_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = (level: "all" | "essential") => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ level, date: new Date().toISOString() }));
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
        >
          <div className="mx-auto max-w-2xl rounded-2xl border bg-card p-5 shadow-xl">
            <div className="flex items-start gap-3">
              <Cookie className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="flex-1 space-y-3">
                <p className="text-sm font-medium">We value your privacy 🍪</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We use essential cookies for authentication and preferences. Optional cookies help us
                  improve the service. Read our{" "}
                  <Link to="/privacy" className="underline text-primary hover:text-primary/80">
                    Privacy Policy
                  </Link>{" "}
                  for details. You can change your preferences at any time.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" className="rounded-xl" onClick={() => accept("all")}>
                    Accept All
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-xl" onClick={() => accept("essential")}>
                    Essential Only
                  </Button>
                </div>
              </div>
              <button onClick={() => accept("essential")} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
