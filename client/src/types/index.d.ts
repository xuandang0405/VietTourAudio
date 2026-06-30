export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface PoiType {
  id: string;
  stallId: string;
  stallName: string;
  name: string;
  slug: string;
  description: string | null;
  latitude: number;
  longitude: number;
  activationRadius: number;
  isPremiumContent: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'HIDDEN' | 'SUSPENDED';
  sortOrder: number;
  contents: number;
  mediaFiles: number;
  createdAt: string;
  updatedAt: string;
}

export interface StallType {
  id: string;
  name: string;
  zoneCode?: string;
  vendorId?: string;
  latitude?: number;
  longitude?: number;
  activationRadius?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ZoneType {
  id: string;
  code: string;
  name: string;
}

export interface UserType {
  id: string;
  email: string;
  displayName: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'FINANCE' | 'VENDOR';
  assignedZoneId: string | null;
  assignedZoneName?: string;
  status: string;
  createdAt: string;
}

export interface TopUpRequestType {
  id: string;
  vendorId: string;
  amount: number;
  provider: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  proofImageUrl: string | null;
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string;
  vendor?: {
    id: string;
    businessName: string;
    ownerEmail: string;
    wallet: { balance: number; totalTopUp: number } | null;
    subscription: string | null;
  };
}

export interface VendorWalletType {
  id: string;
  balance: number;
  totalTopUp: number;
  transactions?: WalletTransactionType[];
}

export interface WalletTransactionType {
  id: string;
  walletId: string;
  type: 'SUBSCRIPTION_FEE' | 'MANUAL_DEBIT' | 'MANUAL_CREDIT' | 'TOP_UP';
  amount: string;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

export interface VendorType {
  id: string;
  businessName: string;
  legalName: string;
  ownerEmail: string;
  ownerDisplayName: string;
  contactPhone: string;
  address: string;
  verificationStatus: string;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  wallet: VendorWalletType | null;
  subscription: {
    id: string;
    status: string;
    periodStart: string;
    periodEnd: string;
    plan: {
      id: string | null;
      name: string;
      monthlyPrice: number;
    };
  } | null;
  stalls: { id: string }[];
  topUpRequests?: TopUpRequestType[];
  mediaFiles?: MediaType[];
}

export interface MediaType {
  id: string;
  vendorId: string;
  stallId: string | null;
  poiId: string | null;
  mediaType: 'IMAGE' | 'AUDIO' | 'VIDEO';
  storagePath: string;
  publicUrl: string;
  mimeType: string;
  sizeBytes: number;
  moderationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN';
  createdAt: string;
}

export interface AuditLogType {
  id: string;
  actorUserId: string | null;
  performedById: string | null;
  performedBy: string;
  actorName: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  targetLabel: string;
  beforeData: unknown;
  afterData: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  reason: string | null;
  createdAt: string;
}
