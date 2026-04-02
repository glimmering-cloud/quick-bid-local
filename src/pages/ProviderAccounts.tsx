import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Percent, ArrowUpRight, DollarSign, BarChart3 } from "lucide-react";
import { ProviderWallet } from "@/components/ProviderWallet";
import { TransactionHistory } from "@/components/TransactionHistory";
import { SavedPaymentMethods } from "@/components/SavedPaymentMethods";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

interface Transaction {
  service_amount: number;
  provider_payout: number;
  created_at: string;
}

interface MonthlyData {
  month: string;
  earnings: number;
  fees: number;
}

export default function ProviderAccounts() {
  const { user } = useAuth();
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [stats, setStats] = useState({ totalJobs: 0, avgPayout: 0, totalFees: 0 });

  useEffect(() => {
    if (user) loadEarningsData();
  }, [user]);

  const loadEarningsData = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("transactions")
      .select("service_amount, provider_payout, created_at")
      .eq("provider_id", user.id)
      .order("created_at", { ascending: true });

    const txns = (data as Transaction[]) || [];

    // Build monthly aggregation for last 6 months
    const months: MonthlyData[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const label = format(d, "MMM yy");
      const inRange = txns.filter(t => {
        const date = new Date(t.created_at);
        return date >= start && date <= end;
      });
      const earnings = inRange.reduce((s, t) => s + Number(t.provider_payout), 0);
      const fees = inRange.reduce((s, t) => s + (Number(t.service_amount) - Number(t.provider_payout)), 0);
      months.push({ month: label, earnings: +earnings.toFixed(2), fees: +fees.toFixed(2) });
    }
    setMonthlyData(months);

    const totalJobs = txns.length;
    const totalPayout = txns.reduce((s, t) => s + Number(t.provider_payout), 0);
    const totalFees = txns.reduce((s, t) => s + (Number(t.service_amount) - Number(t.provider_payout)), 0);
    setStats({
      totalJobs,
      avgPayout: totalJobs > 0 ? +(totalPayout / totalJobs).toFixed(2) : 0,
      totalFees: +totalFees.toFixed(2),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      <div>
        <h1 className="font-heading text-2xl font-bold">Accounts</h1>
        <p className="text-sm text-muted-foreground">Your financial overview, earnings, and payment methods</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-5 w-5 text-success mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Total Jobs</p>
            <p className="text-lg font-bold">{stats.totalJobs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ArrowUpRight className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Avg Payout</p>
            <p className="text-lg font-bold">CHF {stats.avgPayout.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Percent className="h-5 w-5 text-warning mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Total Fees</p>
            <p className="text-lg font-bold">CHF {stats.totalFees.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
            Earnings (Last 6 Months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyData.some(m => m.earnings > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
                <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                  formatter={(value: number, name: string) => [`CHF ${value.toFixed(2)}`, name === "earnings" ? "Net Earnings" : "Platform Fees"]}
                />
                <Bar dataKey="earnings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="earnings" />
                <Bar dataKey="fees" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} name="fees" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <TrendingUp className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No earnings data yet. Complete jobs to see your chart.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="wallet" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="cards">Payment Cards</TabsTrigger>
        </TabsList>

        <TabsContent value="wallet">
          <ProviderWallet />
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionHistory role="provider" />
        </TabsContent>

        <TabsContent value="cards">
          <SavedPaymentMethods />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
