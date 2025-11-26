/**
 * Shared API Response Types
 * 
 * DTOs and response shapes used across client and server
 */

/**
 * Campaign Response Type (from DB select)
 */
export interface CampaignResponse {
  id: number;
  name: string;
  description: string | null;
  location: string;
  startDate: Date;
  endDate: Date;
  totalSlots: number;
  availableSlots: number;
  pricePerSlot: string;
  status: 'active' | 'inactive' | 'completed' | null;
  imageUrl: string | null;
  category: string | null;
  targetAudience: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Booking with Campaign Details Response
 */
export interface BookingWithDetails {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  company: string;
  campaignId: number;
  campaignName: string;
  slotsBooked: number;
  slotsRequired: number;
  totalPrice: string;
  status: string;
  bookingDate: string;
  paymentStatus: string | null;
  requirements: string;
  paymentReference: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Analytics Response Type
 */
export interface AnalyticsResponse {
  totalRevenue: number;
  totalBookings: number;
  activeCampaigns: number;
  conversionRate: number;
  revenueGrowth: number;
  bookingGrowth: number;
  campaignGrowth: number;
}

/**
 * System Health Response
 */
export interface SystemHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  database: boolean;
  caching: {
    enabled: boolean;
    hitRate: number;
  };
  uptime: number;
  memory: {
    used: number;
    limit: number;
  };
}

/**
 * Pagination Response Wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * API Error Response
 */
export interface ApiErrorResponse {
  error: string;
  message: string;
  code?: string;
  details?: unknown;
}
