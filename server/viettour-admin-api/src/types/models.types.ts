export interface TourModel {
  id: bigint;
  vendor_id: bigint;
  name: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  status: string;
  sort_order: number;
  is_premium: number;
  created_at: Date;
  updated_at: Date;
}

export interface ZoneModel {
  id: bigint;
  tour_id: bigint;
  stall_id: bigint;
  free_listens_allowed: number;
  name: string;
  slug: string;
  description: string | null;
  latitude: number;
  longitude: number;
  activation_radius: number;
  is_premium_content: number;
  status: string;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
  stall_name?: string;
  contents_count?: number;
  media_count?: number;
}

export interface StallModel {
  id: bigint;
  vendor_id: bigint;
  name: string;
  slug: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  activation_radius: number;
  status: string;
  created_at: Date;
  updated_at: Date;
  trade_name?: string;
  contact_email?: string;
}

export interface UserModel {
  id: bigint;
  email: string;
  pass_hash: string;
  full_name: string;
  role: string;
  assigned_zone_id: bigint | null;
  status: string;
  created_at: Date;
  updated_at: Date;
  zone_name?: string;
}

export interface TopUpRequestModel {
  id: bigint;
  vendor_id: bigint;
  wallet_id: bigint;
  amount: number;
  provider: string;
  status: string;
  proof_url: string | null;
  note: string | null;
  reviewed_by_user_id: bigint | null;
  reviewed_at: Date | null;
  created_at: Date;
  updated_at: Date;
  trade_name?: string;
  contact_email?: string;
  balance?: number;
  total_top_up?: number;
  subscription_status?: string;
  plan_name?: string;
  plan_price?: number;
}

export interface VendorWalletModel {
  id: bigint;
  vendor_id: bigint;
  balance: number;
  total_top_up: number;
  created_at: Date;
  updated_at: Date;
}

export interface AuditLogModel {
  id: bigint;
  user_id: bigint | null;
  vendor_id: bigint | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: string | null;
  ip_address: string | null;
  created_at: Date;
}
