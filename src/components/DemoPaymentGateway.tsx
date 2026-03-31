import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Lock, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface DemoPaymentGatewayProps {
  amount: number;
  currency?: string;
  serviceName: string;
  providerName: string;
  onPaymentSuccess: (transactionId: string) => void;
  onCancel?: () => void;
}

export function DemoPaymentGateway({
  amount,
  currency = "CHF",
  serviceName,
  providerName,
  onPaymentSuccess,
  onCancel,
}: DemoPaymentGatewayProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<"form" | "processing" | "success">("form");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = cardNumber.replace(/\s/g, "");
    if (digits.length < 16) { toast.error("Enter a valid card number"); return; }
    if (expiry.length < 5) { toast.error("Enter a valid expiry date"); return; }
    if (cvc.length < 3) { toast.error("Enter a valid CVC"); return; }

    setStep("processing");

    // Simulate payment processing
    await new Promise((r) => setTimeout(r, 2000 + Math.random() * 1000));

    const txnId = `TXN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    setStep("success");

    setTimeout(() => {
      onPaymentSuccess(txnId);
    }, 1500);
  };

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
              {/* Order summary */}
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
                <div className="flex justify-between">
                  <span className="font-medium">{t("payment.total", "Total")}</span>
                  <span className="font-heading text-xl font-bold text-primary">
                    {currency} {amount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Demo notice */}
              <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 p-2.5 text-xs text-warning">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                {t("payment.demoNotice", "Demo mode — no real charges. Use any card number.")}
              </div>

              <div className="space-y-2">
                <Label>{t("payment.cardNumber", "Card Number")}</Label>
                <Input
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  placeholder="4242 4242 4242 4242"
                  maxLength={19}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>{t("payment.cardHolder", "Cardholder Name")}</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
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
                    required
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
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1 rounded-xl gap-2">
                  <Lock className="h-4 w-4" />
                  {t("payment.pay", "Pay")} {currency} {amount.toFixed(2)}
                </Button>
                {onCancel && (
                  <Button type="button" variant="ghost" onClick={onCancel}>
                    {t("payment.cancel", "Cancel")}
                  </Button>
                )}
              </div>

              {/* Accepted cards */}
              <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground pt-1">
                <span>Visa</span>
                <span>•</span>
                <span>Mastercard</span>
                <span>•</span>
                <span>Amex</span>
                <span>•</span>
                <span>TWINT</span>
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
                {currency} {amount.toFixed(2)} • {providerName}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
