import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Zap } from "lucide-react";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t bg-card/50 mt-auto">
      <div className="container py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <Link to="/" className="flex items-center gap-2 font-heading text-lg font-bold">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                <Zap className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              QuickServe
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("footer.tagline")}
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-heading text-sm font-semibold">{t("footer.platform")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground transition-colors">{t("footer.howItWorks")}</Link></li>
              <li><Link to="/auth" className="hover:text-foreground transition-colors">{t("footer.getStarted")}</Link></li>
              <li><Link to="/auth" className="hover:text-foreground transition-colors">{t("footer.becomeProvider")}</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-heading text-sm font-semibold">{t("footer.servicesTitle")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Haircut & Barber</li>
              <li>Plumbing</li>
              <li>Electrician</li>
              <li>Home Cleaning</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-heading text-sm font-semibold">{t("footer.support")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/settings" className="hover:text-foreground transition-colors">{t("footer.accountSettings")}</Link></li>
              <li><Link to="/privacy" className="hover:text-foreground transition-colors">{t("footer.privacy")}</Link></li>
              <li><Link to="/terms" className="hover:text-foreground transition-colors">{t("footer.terms")}</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} QuickServe. {t("footer.rights")}
          </p>
          <p className="text-xs text-muted-foreground">
            GenAI Zurich Hackathon 2026 · Project QuickServe
          </p>
        </div>
      </div>
    </footer>
  );
}
