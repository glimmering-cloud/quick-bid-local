import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Receipt, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";

interface Transaction {
  id: string;
  booking_id: string;
  request_id: string;
  customer_id: string;
  provider_id: string;
  service_amount: number;
  convenience_fee: number;
  bank_charges: number;
  total_charged: number;
  provider_payout: number;
  transaction_ref: string;
  payment_method: string;
  status: string;
  currency: string;
  created_at: string;
}

interface TransactionHistoryProps {
  role: "customer" | "provider";
}

export function TransactionHistory({ role }: TransactionHistoryProps) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadTransactions();
  }, [user]);

  const loadTransactions = async () => {
    if (!user) return;
    const col = role === "customer" ? "customer_id" : "provider_id";
    const { data } = await supabase
      .from("transactions" as any)
      .select("*")
      .eq(col, user.id)
      .order("created_at", { ascending: false });
    setTransactions(((data as unknown) as Transaction[]) || []);
    setLoading(false);
  };

  if (loading) return null;
  if (transactions.length === 0) return null;

  const isCustomer = role === "customer";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Receipt className="h-5 w-5 text-primary" />
          Transaction History
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Ref</TableHead>
              <TableHead>Method</TableHead>
              {isCustomer ? (
                <>
                  <TableHead className="text-right">Service</TableHead>
                  <TableHead className="text-right">Fees</TableHead>
                  <TableHead className="text-right font-semibold">Total Paid</TableHead>
                </>
              ) : (
                <>
                  <TableHead className="text-right">Service</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right font-semibold">You Received</TableHead>
                </>
              )}
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((txn) => (
              <TableRow key={txn.id}>
                <TableCell className="text-sm">
                  {format(new Date(txn.created_at), "MMM d, HH:mm")}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {txn.transaction_ref.slice(0, 12)}…
                </TableCell>
                <TableCell className="text-sm">{txn.payment_method}</TableCell>
                {isCustomer ? (
                  <>
                    <TableCell className="text-right text-sm">
                      {txn.currency} {Number(txn.service_amount).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      +{txn.currency} {(Number(txn.convenience_fee) + Number(txn.bank_charges)).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-semibold flex items-center justify-end gap-1">
                      <ArrowUpRight className="h-3.5 w-3.5 text-destructive" />
                      {txn.currency} {Number(txn.total_charged).toFixed(2)}
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell className="text-right text-sm">
                      {txn.currency} {Number(txn.service_amount).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      −{txn.currency} {(Number(txn.service_amount) - Number(txn.provider_payout)).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-semibold flex items-center justify-end gap-1">
                      <ArrowDownRight className="h-3.5 w-3.5 text-success" />
                      {txn.currency} {Number(txn.provider_payout).toFixed(2)}
                    </TableCell>
                  </>
                )}
                <TableCell>
                  <span className="inline-flex rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                    {txn.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
