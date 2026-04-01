import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CreditCard, Lock, CheckCircle2, Loader2, ShieldCheck,
  Landmark, CalendarDays, TrendingUp, AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";

interface SavedCard {
  id: string;
  card_last_four: string;
  card_brand: string;
  cardholder_name: string;
  expiry_month: number;
  expiry_year: number;
  is_default: boolean;
}

interface PlatformFee {
  id: string;
  provider_id: string;
  period_month: string;
  total_earnings: number;
  fee_pct: number;
  fee_amount: number;
  status: string;
  paid_at: string | null;
  payment_ref: string | null;
  payment_method: string | null;
  created_at: string;
}

export function ProviderPlatformFees() {
  const { user } = useAuth();
  const [fees, setFees] = useState<PlatformFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingFee, setPayingFee] = useState<PlatformFee | null>(null);
  const [payStep, setPayStep] = useState<"form" | "processing" | "success">("form");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [saveCard, setSaveCard] = useState(false);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [selectedSavedCard, setSelectedSavedCard] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadFees();
    loadSavedCards();
  }, [user]);

  const loadSavedCards = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("saved_payment_methods")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false });
    const cards = (data as SavedCard[]) || [];
    setSavedCards(cards);
    const def = cards.find(c => c.is_default);
    if (def) setSelectedSavedCard(def.id);
  };

  const loadFees = async () => {
    if (!user) return;

    // Calculate current month's earnings from transactions
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthStart = `${currentMonth}-01T00:00:00Z`;
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthEnd = nextMonth.toISOString();

    // Fetch provider's transactions for current month
    const { data: txns } = await supabase
      .from("transactions" as any)
      .select("provider_payout")
      .eq("provider_id", user.id)
      .gte("created_at", monthStart)
      .lt("created_at", monthEnd);

    const totalEarnings = ((txns as unknown) as { provider_payout: number }[] || [])
      .reduce((sum, t) => sum + Number(t.provider_payout), 0);

    // Ensure a platform_fee record exists for current month
    if (totalEarnings > 0) {
      const feeAmount = parseFloat((totalEarnings * 2 / 100).toFixed(2));
      const { data: existing } = await supabase
        .from("platform_fees" as any)
        .select("id")
        .eq("provider_id", user.id)
        .eq("period_month", currentMonth)
        .maybeSingle();

      if (!existing) {
        await supabase.from("platform_fees" as any).insert({
          provider_id: user.id,
          period_month: currentMonth,
          total_earnings: totalEarnings,
          fee_pct: 2,
          fee_amount: feeAmount,
        });
      } else {
        await supabase.from("platform_fees" as any)
          .update({ total_earnings: totalEarnings, fee_amount: feeAmount } as any)
          .eq("id", (existing as any).id)
          .eq("status", "pending");
      }
    }

    // Load all fees
    const { data: allFees } = await supabase
      .from("platform_fees" as any)
      .select("*")
      .eq("provider_id", user.id)
      .order("period_month", { ascending: false });

    setFees(((allFees as unknown) as PlatformFee[]) || []);
    setLoading(false);
  };

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const detectBrand = (num: string) => {
    const d = num.replace(/\s/g, "");
    if (d.startsWith("4")) return "Visa";
    if (d.startsWith("5") || d.startsWith("2")) return "Mastercard";
    if (d.startsWith("3")) return "Amex";
    return "Card";
  };

  const handlePayFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingFee || !user) return;

    if (!selectedSavedCard) {
      const digits = cardNumber.replace(/\s/g, "");
      if (digits.length < 16) { toast.error("Enter a valid card number"); return; }
      if (expiry.length < 5) { toast.error("Enter a valid expiry date"); return; }
      if (cvc.length < 3) { toast.error("Enter a valid CVC"); return; }
    }

    setPayStep("processing");
    await new Promise(r => setTimeout(r, 2000 + Math.random() * 1000));

    // Save card if requested
    if (saveCard && !selectedSavedCard) {
      const digits = cardNumber.replace(/\s/g, "");
      const expiryParts = expiry.split("/");
      await supabase.from("saved_payment_methods").insert({
        user_id: user.id,
        card_last_four: digits.slice(-4),
        card_brand: detectBrand(digits),
        cardholder_name: name,
        expiry_month: parseInt(expiryParts[0]),
        expiry_year: 2000 + parseInt(expiryParts[1]),
        is_default: savedCards.length === 0,
      } as any);
    }

    const txnRef = `PLT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const selectedCard = savedCards.find(c => c.id === selectedSavedCard);
    const paymentMethod = selectedCard
      ? `${selectedCard.card_brand} ••${selectedCard.card_last_four}`
      : `${detectBrand(cardNumber)} ••${cardNumber.replace(/\s/g, "").slice(-4)}`;

    await supabase.from("platform_fees" as any)
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        payment_ref: txnRef,
        payment_method: paymentMethod,
      } as any)
      .eq("id", payingFee.id);

    setPayStep("success");
    setTimeout(() => {
      setPayingFee(null);
      setPayStep("form");
      setCardNumber(""); setExpiry(""); setCvc(""); setName("");
      loadFees();
      toast.success("Platform fee paid successfully!");
    }, 1500);
  };

  if (loading) return null;

  const pendingFees = fees.filter(f => f.status === "pending" && f.fee_amount > 0);
  const paidFees = fees.filter(f => f.status === "paid");
  const totalPending = pendingFees.reduce((s, f) => s + Number(f.fee_amount), 0);

  if (fees.length === 0 && pendingFees.length === 0) return null;

  const usingSavedCard = !!selectedSavedCard;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Landmark className="h-5 w-5 text-primary" />
            Platform Fees (2% Monthly)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pending fees summary */}
          {totalPending > 0 && (
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-warning" />
                <span className="font-medium text-sm">Outstanding Platform Fees</span>
              </div>
              <p className="text-2xl font-heading font-bold text-warning">
                CHF {totalPending.toFixed(2)}
              </p>
            </div>
          )}

          {/* Fee rows */}
          <div className="space-y-2">
            {fees.map(fee => (
              <div
                key={fee.id}
                className={`flex items-center justify-between rounded-lg border p-3 ${
                  fee.status === "pending" && fee.fee_amount > 0
                    ? "border-warning/20 bg-warning/5"
                    : "border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{fee.period_month}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Earnings: CHF {Number(fee.total_earnings).toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold">CHF {Number(fee.fee_amount).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{fee.fee_pct}% fee</p>
                  </div>
                  {fee.status === "paid" ? (
                    <span className="inline-flex items-center rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Paid
                    </span>
                  ) : fee.fee_amount > 0 ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-xs border-warning text-warning hover:bg-warning/10"
                      onClick={() => { setPayingFee(fee); setPayStep("form"); }}
                    >
                      Pay Now
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">No fee</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {paidFees.length > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              {paidFees.length} month(s) paid
            </p>
          )}
        </CardContent>
      </Card>

      {/* Payment modal */}
      {payingFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="border-primary/20 shadow-lg max-w-md w-full mx-auto overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/10">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Landmark className="h-5 w-5 text-primary" />
                Pay Platform Fee
                <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  Secure
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <AnimatePresence mode="wait">
                {payStep === "form" && (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handlePayFee}
                    className="space-y-4"
                  >
                    <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Period</span>
                        <span className="font-medium">{payingFee.period_month}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Earnings</span>
                        <span>CHF {Number(payingFee.total_earnings).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Platform Fee ({payingFee.fee_pct}%)</span>
                        <span className="font-heading text-lg font-bold text-primary">
                          CHF {Number(payingFee.fee_amount).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Saved cards */}
                    {savedCards.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm">Saved Cards</Label>
                        {savedCards.map(card => (
                          <button
                            key={card.id}
                            type="button"
                            onClick={() => setSelectedSavedCard(selectedSavedCard === card.id ? null : card.id)}
                            className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                              selectedSavedCard === card.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/30"
                            }`}
                          >
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{card.card_brand} •••• {card.card_last_four}</p>
                              <p className="text-xs text-muted-foreground">
                                {card.cardholder_name} • {String(card.expiry_month).padStart(2, "0")}/{card.expiry_year}
                              </p>
                            </div>
                            {selectedSavedCard === card.id && <CheckCircle2 className="h-4 w-4 text-primary" />}
                          </button>
                        ))}
                        {selectedSavedCard && (
                          <button type="button" onClick={() => setSelectedSavedCard(null)} className="text-xs text-primary hover:underline">
                            Use a new card instead
                          </button>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 p-2.5 text-xs text-warning">
                      <ShieldCheck className="h-4 w-4 shrink-0" />
                      Demo mode — no real charges.
                    </div>

                    {!usingSavedCard && (
                      <>
                        <div className="space-y-2">
                          <Label>Card Number</Label>
                          <Input value={cardNumber} onChange={e => setCardNumber(formatCardNumber(e.target.value))} placeholder="4242 4242 4242 4242" maxLength={19} required={!usingSavedCard} />
                        </div>
                        <div className="space-y-2">
                          <Label>Cardholder Name</Label>
                          <Input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" required={!usingSavedCard} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>Expiry</Label>
                            <Input value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))} placeholder="MM/YY" maxLength={5} required={!usingSavedCard} />
                          </div>
                          <div className="space-y-2">
                            <Label>CVC</Label>
                            <Input type="password" value={cvc} onChange={e => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="•••" maxLength={4} required={!usingSavedCard} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox id="save-card-plat" checked={saveCard} onCheckedChange={c => setSaveCard(c === true)} />
                          <Label htmlFor="save-card-plat" className="text-sm cursor-pointer">Save this card for future payments</Label>
                        </div>
                      </>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button type="submit" className="flex-1 rounded-xl gap-2">
                        <Lock className="h-4 w-4" />
                        Pay CHF {Number(payingFee.fee_amount).toFixed(2)}
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setPayingFee(null)}>Cancel</Button>
                    </div>
                  </motion.form>
                )}

                {payStep === "processing" && (
                  <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    <p className="font-medium text-lg">Processing payment…</p>
                    <p className="text-sm text-muted-foreground">Please do not close this window</p>
                  </motion.div>
                )}

                {payStep === "success" && (
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-12 gap-4">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.1 }} className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                      <CheckCircle2 className="h-8 w-8 text-success" />
                    </motion.div>
                    <p className="font-heading font-bold text-xl">Payment Successful!</p>
                    <p className="text-sm text-muted-foreground">
                      Platform fee for {payingFee.period_month} has been paid
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
