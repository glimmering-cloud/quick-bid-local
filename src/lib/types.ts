import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ServiceRequest = Database["public"]["Tables"]["service_requests"]["Row"];
export type Bid = Database["public"]["Tables"]["bids"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];

export type BidWithProvider = Bid & { profiles: Pick<Profile, "display_name" | "avatar_url"> };
export type ServiceRequestWithCustomer = ServiceRequest & { profiles: Pick<Profile, "display_name"> };
