import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ServiceRequest = Database["public"]["Tables"]["service_requests"]["Row"];
export type Bid = Database["public"]["Tables"]["bids"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type Provider = Database["public"]["Tables"]["providers"]["Row"];
export type Complaint = Database["public"]["Tables"]["complaints"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type UserRole = Database["public"]["Tables"]["user_roles"]["Row"];

export type BidWithProvider = Bid & { profiles: Pick<Profile, "display_name" | "avatar_url"> };
export type ServiceRequestWithCustomer = ServiceRequest & { profiles: Pick<Profile, "display_name"> };

export type AppRole = "admin" | "customer_service" | "moderator";
export type ComplaintCategory = "service_quality" | "payment_dispute" | "no_show" | "inappropriate_behavior";
export type ComplaintStatus = "open" | "in_progress" | "resolved" | "dismissed";
