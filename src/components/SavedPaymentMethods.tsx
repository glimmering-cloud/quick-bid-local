import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Trash2, Star, Loader2, Plus } from "lucide-react";
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

export function SavedPaymentMethods() {
  const { user } = useAuth();
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) loadCards();
  }, [user]);

  const loadCards = async () => {
    const { data } = await supabase
      .from("saved_payment_methods")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    setCards((data as SavedCard[]) || []);
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

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const digits = cardNumber.replace(/\s/g, "");
    if (digits.length < 16) { toast.error("Enter a valid 16-digit card number"); return; }
    if (expiry.length < 5) { toast.error("Enter a valid expiry (MM/YY)"); return; }
    if (!name.trim()) { toast.error("Enter cardholder name"); return; }

    setSaving(true);
    const expiryParts = expiry.split("/");
    const { error } = await supabase.from("saved_payment_methods").insert({
      user_id: user.id,
      card_last_four: digits.slice(-4),
      card_brand: detectBrand(digits),
      cardholder_name: name.trim(),
      expiry_month: parseInt(expiryParts[0]),
      expiry_year: 2000 + parseInt(expiryParts[1]),
      is_default: cards.length === 0,
    } as any);

    if (error) {
      toast.error("Failed to save card");
    } else {
      toast.success("Card added successfully");
      setCardNumber(""); setName(""); setExpiry("");
      setShowForm(false);
      loadCards();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("saved_payment_methods").delete().eq("id", id);
    if (error) { toast.error("Failed to delete card"); return; }
    setCards(cards.filter(c => c.id !== id));
    toast.success("Card removed");
  };

  const handleSetDefault = async (id: string) => {
    await supabase.from("saved_payment_methods").update({ is_default: false } as any).eq("user_id", user!.id);
    await supabase.from("saved_payment_methods").update({ is_default: true } as any).eq("id", id);
    loadCards();
    toast.success("Default card updated");
  };

  const brandIcon = (brand: string) => {
    const b = brand.toLowerCase();
    if (b.includes("visa")) return "💳 Visa";
    if (b.includes("master")) return "💳 Mastercard";
    if (b.includes("amex")) return "💳 Amex";
    return "💳 " + brand;
  };

  if (loading) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            Payment Methods
          </span>
          {!showForm && (
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs" onClick={() => setShowForm(true)}>
              <Plus className="h-3.5 w-3.5" /> Add Card
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Add card form */}
        {showForm && (
          <form onSubmit={handleAddCard} className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="space-y-2">
              <Label className="text-sm">Card Number</Label>
              <Input
                value={cardNumber}
                onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="4242 4242 4242 4242"
                maxLength={19}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Cardholder Name</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Expiry</Label>
              <Input
                value={expiry}
                onChange={e => setExpiry(formatExpiry(e.target.value))}
                placeholder="MM/YY"
                maxLength={5}
              />
            </div>
            <p className="text-xs text-muted-foreground">Demo mode — no real card validation.</p>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={saving} className="rounded-xl gap-1.5">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
                Save Card
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => { setShowForm(false); setCardNumber(""); setName(""); setExpiry(""); }}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {cards.length === 0 && !showForm && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">No saved payment methods yet.</p>
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => setShowForm(true)}>
              <Plus className="h-3.5 w-3.5" /> Add your first card
            </Button>
          </div>
        )}

        {cards.map(card => (
          <div key={card.id} className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <span className="text-sm">{brandIcon(card.card_brand)}</span>
              <div>
                <p className="text-sm font-medium">
                  •••• {card.card_last_four}
                  {card.is_default && (
                    <span className="ml-2 inline-flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      <Star className="h-3 w-3" /> Default
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {card.cardholder_name} • {String(card.expiry_month).padStart(2, "0")}/{card.expiry_year}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!card.is_default && (
                <Button variant="ghost" size="sm" onClick={() => handleSetDefault(card.id)} className="text-xs">
                  Set Default
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => handleDelete(card.id)} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
