import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { AlertTriangle, Loader2 } from "lucide-react";
import type { ComplaintCategory } from "@/lib/types";

const CATEGORIES: { value: ComplaintCategory; label: string; emoji: string }[] = [
  { value: "service_quality", label: "Service Quality", emoji: "⚠️" },
  { value: "payment_dispute", label: "Payment Dispute", emoji: "💰" },
  { value: "no_show", label: "No-show", emoji: "🚫" },
  { value: "inappropriate_behavior", label: "Inappropriate Behavior", emoji: "🛑" },
];

interface ComplaintFormProps {
  bookingId?: string;
  reportedUserId?: string;
  trigger?: React.ReactNode;
  onSubmitted?: () => void;
}

export function ComplaintForm({ bookingId, reportedUserId, trigger, onSubmitted }: ComplaintFormProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [category, setCategory] = useState<ComplaintCategory | "">("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async () => {
    if (!user || !category || !title.trim() || !description.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("complaints").insert({
        reporter_id: user.id,
        reported_user_id: reportedUserId || null,
        booking_id: bookingId || null,
        category: category as ComplaintCategory,
        title: title.trim(),
        description: description.trim(),
      });

      if (error) throw error;
      toast.success("Complaint submitted successfully");
      setOpen(false);
      setCategory("");
      setTitle("");
      setDescription("");
      onSubmitted?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit complaint");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/5">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Report Issue
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Report a Problem
          </DialogTitle>
          <DialogDescription>
            Describe the issue and we'll look into it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(val) => setCategory(val as ComplaintCategory)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.emoji} {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of the issue"
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details about what happened..."
              rows={4}
              maxLength={2000}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !category || !title.trim() || !description.trim()}
            variant="destructive"
          >
            {submitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</>
            ) : (
              "Submit Complaint"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
