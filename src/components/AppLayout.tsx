import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AccessibilityMenu } from "@/components/AccessibilityMenu";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Zap, LogOut, LayoutDashboard, Settings, Menu, X, Shield, Wallet } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, profile, signOut } = useAuth();
  const { isStaff } = useRoles();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const dashboardPath = profile?.role === "provider" ? "/provider" : "/dashboard";
  const isOnDashboard = location.pathname.includes("dashboard") || location.pathname.includes("provider");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a href="#main-content" className="skip-link bg-primary text-primary-foreground font-medium rounded-b-md">
        Skip to content
      </a>
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 font-heading text-lg font-bold">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm">
              <Zap className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <span className="hidden sm:inline">QuickServe</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1.5 sm:flex">
            <Link to="/about">
              <Button
                variant={location.pathname === "/about" ? "secondary" : "ghost"}
                size="sm"
              >
                About
              </Button>
            </Link>
            {user && profile && (
              <>
                <Link to={dashboardPath}>
                  <Button
                    variant={isOnDashboard && location.pathname !== "/provider/accounts" ? "secondary" : "ghost"}
                    size="sm"
                  >
                    <LayoutDashboard className="mr-1.5 h-4 w-4" />
                    {t("nav.dashboard")}
                  </Button>
                </Link>
                {profile.role === "provider" && (
                  <Link to="/provider/accounts">
                    <Button
                      variant={location.pathname === "/provider/accounts" ? "secondary" : "ghost"}
                      size="sm"
                    >
                      <Wallet className="mr-1.5 h-4 w-4" />
                      Accounts
                    </Button>
                  </Link>
                )}
              </>
            )}
            {user && isStaff && (
              <Link to="/management">
                <Button
                  variant={location.pathname === "/management" ? "secondary" : "ghost"}
                  size="sm"
                >
                  <Shield className="mr-1.5 h-4 w-4" />
                  {t("nav.management")}
                </Button>
              </Link>
            )}
            <LanguageSwitcher />
            <AccessibilityMenu />
            <ThemeToggle />
            {user && profile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 transition-colors hover:bg-secondary/80 ml-1">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {profile.display_name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <span className="text-sm font-medium max-w-[120px] truncate">{profile.display_name}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <div className="px-3 py-2 border-b">
                    <p className="text-sm font-medium truncate">{profile.display_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{profile.role}</p>
                  </div>
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    {t("nav.settings")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("nav.signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button size="sm">{t("nav.signIn")}</Button>
              </Link>
            )}
          </nav>

          {/* Mobile hamburger */}
          <div className="flex items-center gap-2 sm:hidden">
            <LanguageSwitcher />
            <AccessibilityMenu />
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary transition-colors hover:bg-secondary/80"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t bg-card px-4 pb-4 pt-3 sm:hidden animate-fade-in-up space-y-2">
            {user && profile ? (
              <>
                <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {profile.display_name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{profile.display_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{profile.role}</p>
                  </div>
                </div>
                <Link
                  to={dashboardPath}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {t("nav.dashboard")}
                </Link>
                {isStaff && (
                  <Link
                    to="/management"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary transition-colors"
                  >
                    <Shield className="h-4 w-4" />
                    {t("nav.management")}
                  </Link>
                )}
                <Link
                  to="/settings"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  {t("nav.settings")}
                </Link>
                <button
                  onClick={() => { handleSignOut(); setMobileOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  {t("nav.signOut")}
                </button>
              </>
            ) : (
              <Link to="/auth" onClick={() => setMobileOpen(false)}>
                <Button className="w-full">{t("nav.signIn")}</Button>
              </Link>
            )}
          </div>
        )}
      </header>

      <main id="main-content" className="container flex-1 py-6" role="main">{children}</main>

      <Footer />
    </div>
  );
}
