import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

export function Footer() {
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
              AI-powered local services marketplace. Find trusted providers near you in Zurich.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-heading text-sm font-semibold">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground transition-colors">How it Works</Link></li>
              <li><Link to="/auth" className="hover:text-foreground transition-colors">Get Started</Link></li>
              <li><Link to="/auth" className="hover:text-foreground transition-colors">Become a Provider</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-heading text-sm font-semibold">Services</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Haircut & Barber</li>
              <li>Plumbing</li>
              <li>Electrician</li>
              <li>Home Cleaning</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-heading text-sm font-semibold">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/settings" className="hover:text-foreground transition-colors">Account Settings</Link></li>
              <li><span className="cursor-default">Privacy Policy</span></li>
              <li><span className="cursor-default">Terms of Service</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} QuickServe. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built for Zurich 🇨🇭
          </p>
        </div>
      </div>
    </footer>
  );
}
