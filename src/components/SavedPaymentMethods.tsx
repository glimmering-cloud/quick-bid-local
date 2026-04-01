import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Trash2, Star, Loader2 } from "lucide-react";
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

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("saved_payment_methods").delete().eq("id", id);
    if (error) { toast.error("Failed to delete card"); return; }
    setCards(cards.filter(c => c.id !== id));
    toast.success("Card removed");
  };

  const handleSetDefault = async (id: string) => {
    // Unset all defaults first, then set the chosen one
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
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="h-4 w-4 text-primary" />
          Payment Methods
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {cards.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No saved payment methods. Cards will appear here when you save one during checkout.
          </p>
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
