import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { TicketPlus, Loader2, MessageSquareWarning } from "lucide-react";
import type { ComplaintCategory } from "@/lib/types";

const CATEGORIES: { value: ComplaintCategory; labelKey: string; emoji: string }[] = [
  { value: "service_quality", labelKey: "ticket.serviceQuality", emoji: "⚠️" },
  { value: "payment_dispute", labelKey: "ticket.paymentDispute", emoji: "💰" },
  { value: "no_show", labelKey: "ticket.noShow", emoji: "🚫" },
  { value: "inappropriate_behavior", labelKey: "ticket.inappropriate", emoji: "🛑" },
];

interface RaiseTicketProps {
  trigger?: React.ReactNode;
}

export function RaiseTicket({ trigger }: RaiseTicketProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [category, setCategory] = useState<ComplaintCategory | "">("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bookings, setBookings] = useState<{ id: string; label: string }[]>([]);
  const [selectedBooking, setSelectedBooking] = useState("");

  useEffect(() => {
    if (!user || !open) return;
    // Load user's bookings for context
    supabase
      .from("bookings")
      .select("id, request_id, status, created_at")
      .or(`customer_id.eq.${user.id},provider_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setBookings(
          (data || []).map((b) => ({
            id: b.id,
            label: `${b.status} — ${new Date(b.created_at).toLocaleDateString()}`,
          }))
        );
      });
  }, [user, open]);

  const handleSubmit = async () => {
    if (!user || !category || !title.trim() || !description.trim()) {
      toast.error(t("ticket.fillAll"));
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("complaints").insert({
        reporter_id: user.id,
        booking_id: selectedBooking || null,
        category: category as ComplaintCategory,
        title: title.trim(),
        description: description.trim(),
      });
      if (error) throw error;
      toast.success(t("ticket.submitted"));
      setOpen(false);
      setCategory("");
      setTitle("");
      setDescription("");
      setSelectedBooking("");
    } catch (err: any) {
      toast.error(err.message || t("ticket.failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1.5">
            <TicketPlus className="h-4 w-4" />
            {t("ticket.raise")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquareWarning className="h-5 w-5 text-warning" />
            {t("ticket.title")}
          </DialogTitle>
          <DialogDescription>{t("ticket.description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("ticket.category")}</Label>
            <Select value={category} onValueChange={(val) => setCategory(val as ComplaintCategory)}>
              <SelectTrigger>
                <SelectValue placeholder={t("ticket.selectCategory")} />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.emoji} {t(c.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {bookings.length > 0 && (
            <div className="space-y-2">
              <Label>{t("ticket.relatedBooking")}</Label>
              <Select value={selectedBooking} onValueChange={setSelectedBooking}>
                <SelectTrigger>
                  <SelectValue placeholder={t("ticket.selectBooking")} />
                </SelectTrigger>
                <SelectContent>
                  {bookings.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>{t("ticket.issueTitle")}</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("ticket.issueTitlePlaceholder")}
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("ticket.issueDesc")}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("ticket.issueDescPlaceholder")}
              rows={4}
              maxLength={2000}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>{t("dashboard.cancel")}</Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !category || !title.trim() || !description.trim()}
          >
            {submitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("ticket.submitting")}</>
            ) : (
              t("ticket.submit")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
