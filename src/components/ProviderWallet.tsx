import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, ArrowUpRight, TrendingUp, Percent, Loader2, CreditCard, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface WalletData {
  balance: number;
  total_earned: number;
  total_platform_fees: number;
  total_withdrawn: number;
}

interface SavedCard {
  id: string;
  card_last_four: string;
  card_brand: string;
  cardholder_name: string;
  is_default: boolean;
}

export function ProviderWallet() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [cards, setCards] = useState<SavedCard[]>([]);

  // Password gate state
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      loadWallet();
      loadCards();
    }
  }, [user]);

  const loadWallet = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("provider_wallets" as any)
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setWallet(data as any);
    setLoading(false);
  };

  const loadCards = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("saved_payment_methods")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false });
    setCards((data as SavedCard[]) || []);
  };

  const handleUnlock = async () => {
    if (!user?.email || !password) return;
    setVerifying(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });
      if (error) {
        toast.error("Incorrect password. Please try again.");
      } else {
        setUnlocked(true);
        setPassword("");
        toast.success("Wallet unlocked");
      }
    } catch {
      toast.error("Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleWithdraw = async () => {
    if (!user || !wallet || wallet.balance <= 0) return;

    const defaultCard = cards.find(c => c.is_default) || cards[0];
    if (!defaultCard) {
      toast.error("Please add a card in Settings first to receive payouts.");
      return;
    }

    setWithdrawing(true);
    await new Promise(r => setTimeout(r, 1500));

    const amount = wallet.balance;

    await supabase.from("provider_wallets" as any).update({
      balance: 0,
      total_withdrawn: Number(wallet.total_withdrawn) + amount,
    } as any).eq("user_id", user.id);

    await supabase.from("notifications").insert({
      user_id: user.id,
      request_id: "00000000-0000-0000-0000-000000000000",
      type: "payout_sent",
      message: `🏦 Payout of CHF ${amount.toFixed(2)} sent to your ${defaultCard.card_brand} ••••${defaultCard.card_last_four}. Allow 1-3 business days.`,
    } as any);

    toast.success(`CHF ${amount.toFixed(2)} sent to ${defaultCard.card_brand} ••••${defaultCard.card_last_four}`);
    setWithdrawing(false);
    loadWallet();
  };

  if (loading) return null;
  if (!wallet) return null;

  // Password gate UI
  if (!unlocked) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="h-5 w-5 text-primary" />
            Wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-6 text-center space-y-4">
            <Lock className="h-10 w-10 text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">
              Enter your account password to view your wallet
            </p>
            <div className="max-w-xs mx-auto space-y-3">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button
                onClick={handleUnlock}
                disabled={verifying || !password}
                className="w-full rounded-xl"
              >
                {verifying ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Verifying…</>
                ) : (
                  <><Lock className="h-4 w-4 mr-2" /> Unlock Wallet</>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const defaultCard = cards.find(c => c.is_default) || cards[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wallet className="h-5 w-5 text-primary" />
          Wallet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-5 text-center">
          <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
          <p className="font-heading text-3xl font-bold text-primary">
            CHF {Number(wallet.balance).toFixed(2)}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border p-3 text-center">
            <TrendingUp className="h-4 w-4 text-success mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Total Earned</p>
            <p className="text-sm font-semibold">CHF {Number(wallet.total_earned).toFixed(2)}</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <Percent className="h-4 w-4 text-warning mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Platform Fees (1%)</p>
            <p className="text-sm font-semibold">CHF {Number(wallet.total_platform_fees).toFixed(2)}</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <ArrowUpRight className="h-4 w-4 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Withdrawn</p>
            <p className="text-sm font-semibold">CHF {Number(wallet.total_withdrawn).toFixed(2)}</p>
          </div>
        </div>

        {wallet.balance > 0 && (
          <div className="space-y-2">
            {defaultCard ? (
              <Button
                onClick={handleWithdraw}
                disabled={withdrawing}
                className="w-full rounded-xl gap-2"
              >
                {withdrawing ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Processing payout…</>
                ) : (
                  <><CreditCard className="h-4 w-4" /> Withdraw to {defaultCard.card_brand} ••••{defaultCard.card_last_four}</>
                )}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">
                Add a card in Settings to withdraw earnings.
              </p>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          1% platform fee is deducted from each transaction. Payouts are demo-only.
        </p>
      </CardContent>
    </Card>
  );
}
