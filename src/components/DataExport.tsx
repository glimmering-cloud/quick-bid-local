import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Loader2, FileDown } from "lucide-react";
import { toast } from "sonner";

export function DataExport() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      // Gather all user data in parallel
      const [profileRes, requestsRes, bidsRes, bookingsRes, reviewsRes, transactionsRes, notifRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id),
        supabase.from("service_requests").select("*").eq("customer_id", user.id),
        supabase.from("bids").select("*").eq("provider_id", user.id),
        supabase.from("bookings").select("*").or(`customer_id.eq.${user.id},provider_id.eq.${user.id}`),
        supabase.from("reviews").select("*").or(`reviewer_id.eq.${user.id},reviewee_id.eq.${user.id}`),
        supabase.from("transactions").select("*").or(`customer_id.eq.${user.id},provider_id.eq.${user.id}`),
        supabase.from("notifications").select("*").eq("user_id", user.id),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        user_id: user.id,
        email: user.email,
        profile: profileRes.data || [],
        service_requests: requestsRes.data || [],
        bids: bidsRes.data || [],
        bookings: bookingsRes.data || [],
        reviews: reviewsRes.data || [],
        transactions: transactionsRes.data || [],
        notifications: notifRes.data || [],
      };

      // Download as JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quickserve-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(t("gdpr.exportSuccess"));
    } catch (err: any) {
      toast.error(err.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileDown className="h-4 w-4 text-primary" />
          {t("gdpr.dataPortability")}
        </CardTitle>
        <CardDescription>{t("gdpr.dataPortabilityDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleExport} disabled={exporting} variant="outline" className="w-full rounded-xl">
          {exporting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("gdpr.exporting")}</>
          ) : (
            <><Download className="mr-2 h-4 w-4" />{t("gdpr.exportData")}</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
