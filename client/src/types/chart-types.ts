/**
 * Type definitions for chart components
 * Replacing 'any' types with proper TypeScript interfaces
 */

// Base chart data structures
export interface ChartDataPoint {
  name: string;
  value: number;
  count?: number;
  revenue?: number;
  month?: string;
  bookings?: number;
}

export interface RevenueData {
  month?: string;
  date?: string;
  revenue: number;
  bookings: number;
  [key: string]: string | number | undefined;
}

export interface PaymentStatusData {
  status?: string;
  name?: string;
  count?: number;
  value?: number;
  revenue?: number;
  percentage?: number;
  [key: string]: string | number | undefined;
}

export interface CampaignPerformanceData {
  name: string;
  revenue: number;
  bookings?: number;
  [key: string]: string | number | undefined;
}

// Chart component props
export interface LineChartProps {
  data: RevenueData[];
  height?: number;
}

export interface PieChartProps {
  data: PaymentStatusData[];
  colors: string[];
  height?: number;
}

export interface BarChartProps {
  data: CampaignPerformanceData[];
  height?: number;
}

// Chart loading states
export interface ChartSkeletonProps {
  height?: number;
}

// Common chart colors
export const CHART_COLORS = [
  "#3b82f6",
  "#1e40af",
  "#06b6d4",
  "#10b981",
  "#f59e0b"
] as const;
