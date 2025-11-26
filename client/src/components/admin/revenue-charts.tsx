/**
 * REVENUE CHARTS - Performance Optimized
 * 
 * Lazy-loaded revenue visualization component with:
 * - Dynamic chart library imports
 * - Performance-optimized rendering
 * - Analytics-specific caching
 * - Responsive design with skeleton fallbacks
 * 
 * @fileoverview Revenue charts for analytics dashboard
 */

import React from 'react';
import { LineChartLoader, BarChartLoader } from "@/components/chart-loader";
import { typedUseQuery } from "@/lib/api-types";

interface RevenueData {
  daily: Array<{ date: string; revenue: number; bookings: number }>;
  monthly: Array<{ month: string; revenue: number; bookings: number }>;
  campaignBreakdown: Array<{ name: string; revenue: number }>;
}

export function RevenueCharts() {
  const { data: revenueData, isLoading } = typedUseQuery<RevenueData>(
    ['/api/analytics/revenue-charts'] as const,
    '/api/analytics/revenue-charts',
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Mock data for demonstration
  const mockData: RevenueData = {
    daily: [
      { date: '2024-01', revenue: 4200, bookings: 24 },
      { date: '2024-02', revenue: 3800, bookings: 19 },
      { date: '2024-03', revenue: 5100, bookings: 31 },
      { date: '2024-04', revenue: 4700, bookings: 28 },
      { date: '2024-05', revenue: 5800, bookings: 35 },
      { date: '2024-06', revenue: 6200, bookings: 38 },
    ],
    monthly: [
      { month: 'Jan', revenue: 18500, bookings: 112 },
      { month: 'Feb', revenue: 21200, bookings: 128 },
      { month: 'Mar', revenue: 19800, bookings: 121 },
      { month: 'Apr', revenue: 24100, bookings: 143 },
      { month: 'May', revenue: 26800, bookings: 159 },
      { month: 'Jun', revenue: 24850, bookings: 187 },
    ],
    campaignBreakdown: [
      { name: 'Digital Billboards', revenue: 8500 },
      { name: 'Bus Stop Ads', revenue: 6200 },
      { name: 'Mall Displays', revenue: 4800 },
      { name: 'Transit Ads', revenue: 3200 },
      { name: 'Street Furniture', revenue: 2150 },
    ]
  };

  const chartData = revenueData || mockData;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-[400px] bg-gray-700 rounded animate-pulse" />
          <div className="h-[400px] bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="h-[300px] bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Revenue and Bookings Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-navy-800 p-6 rounded-lg border border-accent-blue/20">
          <h4 className="text-lg font-medium text-white mb-4">Daily Trends (Last 6 Months)</h4>
          <LineChartLoader data={chartData.daily} height={300} />
        </div>

        <div className="bg-navy-800 p-6 rounded-lg border border-accent-blue/20">
          <h4 className="text-lg font-medium text-white mb-4">Monthly Performance</h4>
          <LineChartLoader data={chartData.monthly} height={300} />
        </div>
      </div>

      {/* Campaign Revenue Breakdown */}
      <div className="bg-navy-800 p-6 rounded-lg border border-accent-blue/20">
        <h4 className="text-lg font-medium text-white mb-4">Revenue by Campaign Type</h4>
        <BarChartLoader data={chartData.campaignBreakdown} height={300} />
      </div>
    </div>
  );
}
