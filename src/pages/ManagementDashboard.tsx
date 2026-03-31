import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
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
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  UserPlus,
  Loader2,
  Star,
  Users,
  MessageSquare,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import type { ComplaintStatus } from "@/lib/types";

const STATUS_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  open: { icon: AlertTriangle, color: "text-warning", label: "Open" },
  in_progress: { icon: Clock, color: "text-primary", label: "In Progress" },
  resolved: { icon: CheckCircle, color: "text-success", label: "Resolved" },
  dismissed: { icon: XCircle, color: "text-muted-foreground", label: "Dismissed" },
};

const CATEGORY_LABELS: Record<string, string> = {
  service_quality: "⚠️ Service Quality",
  payment_dispute: "💰 Payment Dispute",
  no_show: "🚫 No-show",
  inappropriate_behavior: "🛑 Inappropriate Behavior",
};

export default function ManagementDashboard() {
  const { user } = useAuth();
  const { isStaff, isAdmin, hasRole, loading: rolesLoading } = useRoles();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [complaints, setComplaints] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  // Invite form state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("");
  const [inviting, setInviting] = useState(false);

  // Status filter
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const loadComplaints = useCallback(async () => {
    const query = supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false });

    const { data } = await query;

    if (data && data.length > 0) {
      const userIds = [
        ...new Set([
          ...data.map((c) => c.reporter_id),
          ...data.filter((c) => c.reported_user_id).map((c) => c.reported_user_id),
        ]),
      ];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, phone")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.user_id, { name: p.display_name, phone: p.phone }]));

      setComplaints(
        data.map((c) => {
          const reporter = profileMap.get(c.reporter_id);
          const reported = c.reported_user_id ? profileMap.get(c.reported_user_id) : null;
          return {
            ...c,
            reporter_name: reporter?.name || "Unknown",
            reporter_phone: reporter?.phone || null,
            reported_name: reported?.name || null,
          };
        })
      );
    } else {
      setComplaints([]);
    }
  }, []);

  const loadReviews = useCallback(async () => {
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (data && data.length > 0) {
      const userIds = [...new Set([...data.map((r) => r.reviewer_id), ...data.map((r) => r.reviewee_id)])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.display_name]));

      setReviews(
        data.map((r) => ({
          ...r,
          reviewer_name: profileMap.get(r.reviewer_id) || "Unknown",
          reviewee_name: profileMap.get(r.reviewee_id) || "Unknown",
        }))
      );
    } else {
      setReviews([]);
    }
  }, []);

  const loadStaff = useCallback(async () => {
    if (!isAdmin) return;
    const { data } = await supabase.from("user_roles").select("*");
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.display_name]));

      // Group roles by user
      const grouped: Record<string, { user_id: string; name: string; roles: string[] }> = {};
      data.forEach((r) => {
        if (!grouped[r.user_id]) {
          grouped[r.user_id] = { user_id: r.user_id, name: profileMap.get(r.user_id) || "Unknown", roles: [] };
        }
        grouped[r.user_id].roles.push(r.role);
      });

      setStaffMembers(Object.values(grouped));
    }
  }, [isAdmin]);

  const loadAnalytics = useCallback(async () => {
    const [{ count: totalRequests }, { count: totalBookings }, { count: totalProviders }, { count: totalUsers }, { data: recentRequests }, { data: bookingsData }, { data: providersData }] = await Promise.all([
      supabase.from("service_requests").select("*", { count: "exact", head: true }),
      supabase.from("bookings").select("*", { count: "exact", head: true }),
      supabase.from("providers").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("service_requests").select("category, status").limit(1000),
      supabase.from("bookings").select("status, final_price_chf").limit(1000),
      supabase.from("providers").select("service_category, provider_type, rating").limit(1000),
    ]);

    // Category distribution
    const catCounts: Record<string, number> = {};
    (recentRequests || []).forEach(r => { catCounts[r.category] = (catCounts[r.category] || 0) + 1; });
    const categoryData = Object.entries(catCounts).map(([name, value]) => ({ name, value }));

    // Request status distribution
    const statusCounts: Record<string, number> = {};
    (recentRequests || []).forEach(r => { statusCounts[r.status] = (statusCounts[r.status] || 0) + 1; });
    const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    // Provider type distribution
    const typeCounts: Record<string, number> = {};
    (providersData || []).forEach(p => { typeCounts[p.provider_type || "company"] = (typeCounts[p.provider_type || "company"] || 0) + 1; });
    const providerTypeData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));

    // Revenue
    const totalRevenue = (bookingsData || []).reduce((sum, b) => sum + (Number(b.final_price_chf) || 0), 0);
    const completedBookings = (bookingsData || []).filter(b => b.status === "completed").length;

    // Avg rating
    const ratings = (providersData || []).map(p => Number(p.rating || 0)).filter(r => r > 0);
    const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    setAnalytics({
      totalRequests: totalRequests || 0,
      totalBookings: totalBookings || 0,
      totalProviders: totalProviders || 0,
      totalUsers: totalUsers || 0,
      categoryData,
      statusData,
      providerTypeData,
      totalRevenue,
      completedBookings,
      avgRating,
    });
  }, []);

  useEffect(() => {
    if (rolesLoading) return;
    if (!isStaff) {
      navigate("/");
      return;
    }

    const load = async () => {
      setLoadingData(true);
      await Promise.all([loadComplaints(), loadReviews(), loadStaff(), loadAnalytics()]);
      setLoadingData(false);
    };
    load();
  }, [rolesLoading, isStaff, navigate, loadComplaints, loadReviews, loadStaff, loadAnalytics]);

  const handleUpdateComplaint = async (id: string, status: ComplaintStatus, resolutionNote?: string) => {
    const updates: any = { status };
    if (resolutionNote) updates.resolution_note = resolutionNote;
    if (status === "in_progress") updates.assigned_to = user?.id;

    const { error } = await supabase.from("complaints").update(updates).eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Complaint ${status === "resolved" ? "resolved" : status === "dismissed" ? "dismissed" : "updated"}`);
      loadComplaints();
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail || !inviteRole) return;

    setInviting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("invite-staff", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { email: inviteEmail, role: inviteRole },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(data?.message || "Staff invited successfully");
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole("");
      loadStaff();
    } catch (err: any) {
      toast.error(err.message || "Failed to invite staff");
    } finally {
      setInviting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Review removed");
      loadReviews();
    }
  };

  const filteredComplaints = statusFilter === "all"
    ? complaints
    : complaints.filter((c) => c.status === statusFilter);

  if (rolesLoading || loadingData) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-5xl space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Management Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage complaints, reviews, and staff
          </p>
        </div>
        {isAdmin && (
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Staff
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Staff Member</DialogTitle>
                <DialogDescription>
                  Send an invite to join the management team
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="staff@example.com"
                    type="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer_service">Customer Service</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
                <Button onClick={handleInvite} disabled={inviting || !inviteEmail || !inviteRole}>
                  {inviting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Inviting...</>
                  ) : (
                    <><UserPlus className="mr-2 h-4 w-4" />Send Invite</>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="complaints" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Complaints
            {complaints.filter((c) => c.status === "open").length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                {complaints.filter((c) => c.status === "open").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Reviews
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="staff" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Staff
            </TabsTrigger>
          )}
        </TabsList>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          {analytics && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Total Requests", value: analytics.totalRequests, icon: "📋" },
                  { label: "Total Bookings", value: analytics.totalBookings, icon: "✅" },
                  { label: "Providers", value: analytics.totalProviders, icon: "👷" },
                  { label: "Users", value: analytics.totalUsers, icon: "👥" },
                ].map(s => (
                  <Card key={s.label} className="shadow-sm">
                    <CardContent className="p-4 text-center space-y-1">
                      <span className="text-xl">{s.icon}</span>
                      <p className="font-heading text-2xl font-bold text-primary">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="shadow-sm">
                  <CardContent className="p-4 text-center space-y-1">
                    <p className="text-xs text-muted-foreground">Total Revenue</p>
                    <p className="font-heading text-xl font-bold text-primary">CHF {analytics.totalRevenue.toFixed(0)}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="p-4 text-center space-y-1">
                    <p className="text-xs text-muted-foreground">Completed Bookings</p>
                    <p className="font-heading text-xl font-bold text-success">{analytics.completedBookings}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="p-4 text-center space-y-1">
                    <p className="text-xs text-muted-foreground">Avg Provider Rating</p>
                    <p className="font-heading text-xl font-bold text-warning">⭐ {analytics.avgRating.toFixed(1)}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Requests by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={analytics.categoryData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Provider Types</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={analytics.providerTypeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                          {analytics.providerTypeData.map((_: any, i: number) => (
                            <Cell key={i} fill={["hsl(var(--primary))", "hsl(var(--warning))", "hsl(var(--muted-foreground))"][i % 3]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Complaints Tab */}
        <TabsContent value="complaints" className="space-y-4">
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              {filteredComplaints.length} complaint{filteredComplaints.length !== 1 ? "s" : ""}
            </span>
          </div>

          {filteredComplaints.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center py-10 text-center">
                <CheckCircle className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No complaints found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredComplaints.map((complaint) => {
                const config = STATUS_CONFIG[complaint.status];
                const Icon = config.icon;
                return (
                  <ComplaintCard
                    key={complaint.id}
                    complaint={complaint}
                    config={config}
                    Icon={Icon}
                    onUpdate={handleUpdateComplaint}
                    canResolve={hasRole("customer_service") || isAdmin}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-3">
          {reviews.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center py-10 text-center">
                <Star className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No reviews yet</p>
              </CardContent>
            </Card>
          ) : (
            reviews.map((review) => (
              <Card key={review.id} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{review.reviewer_name}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-sm font-medium">{review.reviewee_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-4 w-4 ${
                              s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"
                            }`}
                          />
                        ))}
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(review.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    {(hasRole("moderator") || isAdmin) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteReview(review.id)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Staff Tab (Admin only) */}
        {isAdmin && (
          <TabsContent value="staff" className="space-y-3">
            {staffMembers.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center py-10 text-center">
                  <Users className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No staff members yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Use "Invite Staff" to add team members</p>
                </CardContent>
              </Card>
            ) : (
              staffMembers.map((member) => (
                <Card key={member.user_id} className="shadow-sm">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {member.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      {member.roles.map((role: string) => (
                        <Badge key={role} variant="secondary" className="capitalize text-xs">
                          {role.replace("_", " ")}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        )}
      </Tabs>
    </motion.div>
  );
}

// Complaint card sub-component
function ComplaintCard({
  complaint,
  config,
  Icon,
  onUpdate,
  canResolve,
}: {
  complaint: any;
  config: any;
  Icon: any;
  onUpdate: (id: string, status: ComplaintStatus, note?: string) => void;
  canResolve: boolean;
}) {
  const [resolveNote, setResolveNote] = useState("");
  const [showResolve, setShowResolve] = useState(false);

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${config.color}`} />
              <span className="text-sm font-semibold">{complaint.title}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{CATEGORY_LABELS[complaint.category]}</span>
              <span>·</span>
              <span>by {complaint.reporter_name}</span>
              {complaint.reported_name && (
                <>
                  <span>→</span>
                  <span>{complaint.reported_name}</span>
                </>
              )}
            </div>
          </div>
          <Badge
            variant={complaint.status === "open" ? "destructive" : complaint.status === "resolved" ? "default" : "secondary"}
            className="text-xs"
          >
            {config.label}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground">{complaint.description}</p>

        {complaint.resolution_note && (
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">Resolution Note</p>
            <p className="text-sm">{complaint.resolution_note}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {format(new Date(complaint.created_at), "MMM d, yyyy 'at' HH:mm")}
          </span>

          {canResolve && complaint.status !== "resolved" && complaint.status !== "dismissed" && (
            <div className="flex items-center gap-2">
              {complaint.status === "open" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdate(complaint.id, "in_progress")}
                >
                  <Clock className="mr-1.5 h-3 w-3" />
                  Take Over
                </Button>
              )}

              {!showResolve ? (
                <>
                  <Button size="sm" variant="outline" onClick={() => setShowResolve(true)}>
                    <CheckCircle className="mr-1.5 h-3 w-3" />
                    Resolve
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground"
                    onClick={() => onUpdate(complaint.id, "dismissed")}
                  >
                    Dismiss
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2 w-full">
                  <Input
                    value={resolveNote}
                    onChange={(e) => setResolveNote(e.target.value)}
                    placeholder="Resolution note..."
                    className="text-sm h-8"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      onUpdate(complaint.id, "resolved", resolveNote);
                      setShowResolve(false);
                      setResolveNote("");
                    }}
                  >
                    Done
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
