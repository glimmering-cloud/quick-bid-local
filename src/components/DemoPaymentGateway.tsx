import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CreditCard, Lock, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface SavedCard {
  id: string;
  card_last_four: string;
  card_brand: string;
  cardholder_name: string;
  expiry_month: number;
  expiry_year: number;
  is_default: boolean;
}

interface DemoPaymentGatewayProps {
  amount: number;
  currency?: string;
  serviceName: string;
  providerName: string;
  bookingId?: string;
  requestId?: string;
  providerId?: string;
  onPaymentSuccess: (transactionId: string) => void;
  onCancel?: () => void;
}

const CONVENIENCE_FEE_PCT = 2;
const BANK_CHARGE_RATE = 0.5; // 0.5% demo bank charges
const PLATFORM_FEE_PCT = 1; // 1% platform fee deducted from provider

export function DemoPaymentGateway({
  amount,
  currency = "CHF",
  serviceName,
  providerName,
  bookingId,
  requestId,
  providerId,
  onPaymentSuccess,
  onCancel,
}: DemoPaymentGatewayProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [step, setStep] = useState<"form" | "processing" | "success">("form");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [saveCard, setSaveCard] = useState(false);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [selectedSavedCard, setSelectedSavedCard] = useState<string | null>(null);

  // Fee calculations
  const serviceAmount = amount;
  const convenienceFee = parseFloat((serviceAmount * CONVENIENCE_FEE_PCT / 100).toFixed(2));
  const bankCharges = parseFloat((serviceAmount * BANK_CHARGE_RATE / 100).toFixed(2));
  const platformFee = parseFloat((serviceAmount * PLATFORM_FEE_PCT / 100).toFixed(2));
  const totalCharged = parseFloat((serviceAmount + convenienceFee + bankCharges).toFixed(2));
  const providerPayout = parseFloat((serviceAmount - bankCharges - platformFee).toFixed(2));

  useEffect(() => {
    if (user) loadSavedCards();
  }, [user]);

  const loadSavedCards = async () => {
    const { data } = await supabase
      .from("saved_payment_methods")
      .select("*")
      .eq("user_id", user!.id)
      .order("is_default", { ascending: false });
    const cards = (data as SavedCard[]) || [];
    setSavedCards(cards);
    const def = cards.find(c => c.is_default);
    if (def) setSelectedSavedCard(def.id);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSavedCard) {
      const digits = cardNumber.replace(/\s/g, "");
      if (digits.length < 16) { toast.error("Enter a valid card number"); return; }
      if (expiry.length < 5) { toast.error("Enter a valid expiry date"); return; }
      if (cvc.length < 3) { toast.error("Enter a valid CVC"); return; }
    }

    setStep("processing");

    // Simulate payment processing
    await new Promise((r) => setTimeout(r, 2000 + Math.random() * 1000));

    // Save card if requested
    if (saveCard && !selectedSavedCard && user) {
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

    const txnRef = `TXN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    // Record transaction
    if (user && bookingId && requestId && providerId) {
      const selectedCard = savedCards.find(c => c.id === selectedSavedCard);
      const paymentMethod = selectedCard
        ? `${selectedCard.card_brand} ••${selectedCard.card_last_four}`
        : `${detectBrand(cardNumber)} ••${cardNumber.replace(/\s/g, "").slice(-4)}`;

      await supabase.from("transactions" as any).insert({
        booking_id: bookingId,
        request_id: requestId,
        customer_id: user.id,
        provider_id: providerId,
        service_amount: serviceAmount,
        convenience_fee_pct: CONVENIENCE_FEE_PCT,
        convenience_fee: convenienceFee,
        bank_charges: bankCharges,
        total_charged: totalCharged,
        provider_payout: providerPayout,
        transaction_ref: txnRef,
        payment_method: paymentMethod,
        status: "completed",
        currency,
      });
    }

    setStep("success");

    setTimeout(() => {
      onPaymentSuccess(txnRef);
    }, 1500);
  };

  const usingSavedCard = !!selectedSavedCard;

  return (
    <Card className="border-primary/20 shadow-lg max-w-md mx-auto overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/10">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="h-5 w-5 text-primary" />
          {t("payment.title", "Payment")}
          <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            {t("payment.secure", "Secure")}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <AnimatePresence mode="wait">
          {step === "form" && (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* Order summary with fee breakdown */}
              <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("payment.service", "Service")}</span>
                  <span className="font-medium">{serviceName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("payment.provider", "Provider")}</span>
                  <span className="font-medium">{providerName}</span>
                </div>
                <div className="h-px bg-border my-1" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Service Amount</span>
                  <span>{currency} {serviceAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Convenience Fee ({CONVENIENCE_FEE_PCT}%)</span>
                  <span>{currency} {convenienceFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Bank/Transaction Charges</span>
                  <span>{currency} {bankCharges.toFixed(2)}</span>
                </div>
                <div className="h-px bg-border my-1" />
                <div className="flex justify-between">
                  <span className="font-medium">{t("payment.total", "Total")}</span>
                  <span className="font-heading text-xl font-bold text-primary">
                    {currency} {totalCharged.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Provider payout info */}
              <div className="rounded-lg border border-success/20 bg-success/5 p-2.5 text-xs text-success flex justify-between items-center">
                <span>Provider receives</span>
                <span className="font-semibold">{currency} {providerPayout.toFixed(2)}</span>
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
                        <p className="text-sm font-medium">
                          {card.card_brand} •••• {card.card_last_four}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {card.cardholder_name} • {String(card.expiry_month).padStart(2, "0")}/{card.expiry_year}
                        </p>
                      </div>
                      {selectedSavedCard === card.id && (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                  {selectedSavedCard && (
                    <button
                      type="button"
                      onClick={() => setSelectedSavedCard(null)}
                      className="text-xs text-primary hover:underline"
                    >
                      Use a new card instead
                    </button>
                  )}
                </div>
              )}

              {/* Demo notice */}
              <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 p-2.5 text-xs text-warning">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                {t("payment.demoNotice", "Demo mode — no real charges. Use any card number.")}
              </div>

              {/* New card form */}
              {!usingSavedCard && (
                <>
                  <div className="space-y-2">
                    <Label>{t("payment.cardNumber", "Card Number")}</Label>
                    <Input
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="4242 4242 4242 4242"
                      maxLength={19}
                      required={!usingSavedCard}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("payment.cardHolder", "Cardholder Name")}</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      required={!usingSavedCard}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>{t("payment.expiry", "Expiry")}</Label>
                      <Input
                        value={expiry}
                        onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                        placeholder="MM/YY"
                        maxLength={5}
                        required={!usingSavedCard}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("payment.cvc", "CVC")}</Label>
                      <Input
                        type="password"
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        placeholder="•••"
                        maxLength={4}
                        required={!usingSavedCard}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="save-card"
                      checked={saveCard}
                      onCheckedChange={(checked) => setSaveCard(checked === true)}
                    />
                    <Label htmlFor="save-card" className="text-sm cursor-pointer">
                      Save this card for future payments
                    </Label>
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1 rounded-xl gap-2">
                  <Lock className="h-4 w-4" />
                  {t("payment.pay", "Pay")} {currency} {totalCharged.toFixed(2)}
                </Button>
                {onCancel && (
                  <Button type="button" variant="ghost" onClick={onCancel}>
                    {t("payment.cancel", "Cancel")}
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground pt-1">
                <span>Visa</span><span>•</span><span>Mastercard</span><span>•</span><span>Amex</span><span>•</span><span>TWINT</span>
              </div>
            </motion.form>
          )}

          {step === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 gap-4"
            >
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="font-medium text-lg">{t("payment.processing", "Processing payment…")}</p>
              <p className="text-sm text-muted-foreground">{t("payment.doNotClose", "Please do not close this window")}</p>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12 gap-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center"
              >
                <CheckCircle2 className="h-8 w-8 text-success" />
              </motion.div>
              <p className="font-heading font-bold text-xl">{t("payment.success", "Payment Successful!")}</p>
              <p className="text-sm text-muted-foreground">
                {currency} {totalCharged.toFixed(2)} • {providerName}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
