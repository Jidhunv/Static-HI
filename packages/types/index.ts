// ============================================================================
// AUTH & TENANT
// ============================================================================

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string;
  tenantName: string;
  role: 'admin' | 'staff';
}

export interface LoginRequest {
  tenantId: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: AuthUser;
}

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  businessType: string;
  primaryCurrency: string;
  primaryColor?: string;
  logoUrl?: string;
  status: 'active' | 'suspended' | 'pending';
}

// ============================================================================
// PROPERTY & INVENTORY
// ============================================================================

export interface Property {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  type: string;
  countryId: string;
  stateId?: string;
  city: string;
  address: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
  starCategory?: number;
  chainName?: string;
  status: 'active' | 'inactive' | 'archived';
  visibility: 'private' | 'public_b2b' | 'public_b2c' | 'public_both';
  distributionMode: 'open' | 'permissioned';
  description?: string;
  usp?: string;
}

export interface Room {
  id: string;
  propertyId: string;
  type: string;
  code: string;
  quantity: number;
  area?: number;
  areaUnit: 'sqm' | 'sqft';
  minAdults: number;
  maxAdults: number;
  maxOccupancy: number;
  smokingPolicy?: string;
  status: 'active' | 'inactive';
}

export interface RatePlan {
  id: string;
  propertyId: string;
  roomId?: string;
  code: string;
  name: string;
  boardType: string;
  status: 'active' | 'inactive';
  taxInclusive: boolean;
}

export interface CalendarRate {
  id: string;
  roomId: string;
  ratePlanId: string;
  date: Date;
  netRate: number;
  availability: number;
  stopSell: boolean;
}

// ============================================================================
// PRICING & MARKUP
// ============================================================================

export interface RateMarkup {
  id: string;
  tenantId: string;
  channel: 'b2b' | 'b2c';
  type: 'percentage' | 'fixed';
  value: number;
  priority: number;
  sourceTenantId?: string;
  roomTypeCode?: string;
}

export interface RateBreakdown {
  netRate: number;
  b2bMarginApplied?: number;
  resellerMarkup?: number;
  b2cMarkupApplied?: number;
  taxTotal: number;
  feesTotal: number;
  finalRate: number;
}

// ============================================================================
// BOOKING
// ============================================================================

export interface Booking {
  id: string;
  bookingCode: string;
  propertyId: string;
  sourceTenantId: string;
  resellerTenantId?: string;
  guestEmail: string;
  guestName: string;
  checkInDate: Date;
  checkOutDate: Date;
  numberOfNights: number;
  netRate: number;
  subtotal: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Date;
}

// ============================================================================
// API RESPONSE
// ============================================================================

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}
