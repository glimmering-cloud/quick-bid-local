import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, User, Briefcase, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { SERVICE_CATEGORIES } from "@/lib/categories";
import { LOCATIONS } from "@/lib/locations";

export default function Auth() {
  const { t } = useTranslation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"customer" | "provider">("customer");
  const [loading, setLoading] = useState(false);
  // Provider-specific fields
  const [businessName, setBusinessName] = useState("");
  const [serviceCategory, setServiceCategory] = useState("haircut");
  const [providerType, setProviderType] = useState("individual");
  const [locationIdx, setLocationIdx] = useState("0");
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const providerInfo = role === "provider" ? {
          businessName: businessName || displayName,
          serviceCategory,
          providerType,
          location: LOCATIONS[parseInt(locationIdx)] || LOCATIONS[0],
        } : undefined;
        await signUp(email, password, displayName, role, providerInfo);
        toast.success(t("auth.accountCreated"));
      } else {
        await signIn(email, password);
        toast.success(t("auth.welcomeBackToast"));
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-lg border-border/60">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-md shadow-primary/20">
              <Zap className="h-7 w-7 text-primary-foreground" />
            </div>
            <CardTitle className="font-heading text-2xl">
              {isSignUp ? t("auth.createAccount") : t("auth.welcomeBack")}
            </CardTitle>
            <CardDescription className="text-sm">
              {isSignUp ? t("auth.signUpSubtitle") : t("auth.signInSubtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="name">{t("auth.displayName")}</Label>
                    <Input
                      id="name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={t("auth.namePlaceholder")}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("auth.iAmA")}</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        { value: "customer" as const, label: t("auth.customer"), icon: User, desc: t("auth.findServices") },
                        { value: "provider" as const, label: t("auth.provider"), icon: Briefcase, desc: t("auth.offerServices") },
                      ]).map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setRole(opt.value)}
                          className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-4 transition-all duration-200 ${
                            role === opt.value
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border hover:border-muted-foreground/30"
                          }`}
                        >
                          <opt.icon className={`h-5 w-5 ${role === opt.value ? "text-primary" : "text-muted-foreground"}`} />
                          <span className={`text-sm font-medium ${role === opt.value ? "text-primary" : "text-muted-foreground"}`}>
                            {opt.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {role === "provider" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.3 }}
                      className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4"
                    >
                      <p className="text-xs font-medium text-primary flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5" />
                        Provider Details
                      </p>
                      <div className="space-y-2">
                        <Label htmlFor="bizName">Business Name</Label>
                        <Input
                          id="bizName"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          placeholder="e.g. Marco's Barbershop"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Service Category</Label>
                        <Select value={serviceCategory} onValueChange={setServiceCategory}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SERVICE_CATEGORIES.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.emoji} {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Provider Type</Label>
                        <Select value={providerType} onValueChange={setProviderType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="individual">Individual</SelectItem>
                            <SelectItem value="company">Company</SelectItem>
                            <SelectItem value="agency">Agency</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          Location
                        </Label>
                        <Select value={locationIdx} onValueChange={setLocationIdx}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {LOCATIONS.map((loc, i) => (
                              <SelectItem key={i} value={String(i)}>
                                {loc.name} ({loc.city})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full h-11 rounded-xl" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isSignUp ? t("auth.creating") : t("auth.signingIn")}
                  </>
                ) : (
                  isSignUp ? t("auth.createAccount") : t("nav.signIn")
                )}
              </Button>
            </form>
            {!isSignUp && (
              <div className="mt-5 space-y-2">
                <p className="text-xs text-center text-muted-foreground font-medium">Quick Demo Login</p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { label: "Demo Customer", icon: User, email: "customer@demo.quickserve.ch", color: "border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10" },
                    { label: "Demo Provider", icon: Briefcase, email: "provider@demo.quickserve.ch", color: "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10" },
                  ]).map((demo) => (
                    <button
                      key={demo.email}
                      type="button"
                      disabled={loading}
                      onClick={async () => {
                        setLoading(true);
                        try {
                          await signIn(demo.email, "Demo1234!");
                          toast.success(`Signed in as ${demo.label}`);
                        } catch {
                          toast.error("Demo account not found. Please run the seed function first.");
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${demo.color}`}
                    >
                      <demo.icon className="h-3.5 w-3.5" />
                      {demo.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-4 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {isSignUp ? t("auth.alreadyHaveAccount") + " " : t("auth.dontHaveAccount") + " "}
                <span className="font-medium text-primary">{isSignUp ? t("auth.signIn") : t("auth.signUp")}</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
