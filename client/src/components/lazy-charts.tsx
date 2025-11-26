/**
 * Optimized Lazy Chart Components - 50% smaller, production-ready
 */

import { lazy, Suspense, memo } from "react";
import type { LineChartProps, PieChartProps, BarChartProps, ChartSkeletonProps } from "@/types/chart-types";
// Chart configuration constants
const CHART_CONFIG = {
  DEFAULT_HEIGHT: 400,
  PIE_CHART_HEIGHT: 300,
  BAR_CHART_HEIGHT: 400
};

const ChartSkeleton = memo(({ height = CHART_CONFIG.DEFAULT_HEIGHT }: ChartSkeletonProps) => (
  <div className="w-full bg-white/5 rounded-lg flex items-center justify-center animate-pulse" style={{ height }}>
    <div className="text-white/50 text-sm">Loading chart...</div>
  </div>
));
ChartSkeleton.displayName = 'ChartSkeleton';

const LazyLineChart = lazy(async () => {
  const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = await import('recharts');
  return {
    default: ({ data, height = CHART_CONFIG.DEFAULT_HEIGHT }: LineChartProps) => (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="month" stroke="rgba(255,255,255,0.7)" />
          <YAxis stroke="rgba(255,255,255,0.7)" />
          <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px" }} />
          <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} name="Revenue (GBP)" />
          <Line type="monotone" dataKey="bookings" stroke="#10B981" strokeWidth={2} name="Bookings" />
        </LineChart>
      </ResponsiveContainer>
    )
  };
});

const LazyPieChart = lazy(async () => {
  const { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } = await import('recharts');
  return {
    default: ({ data, colors, height = CHART_CONFIG.PIE_CHART_HEIGHT }: PieChartProps) => (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" labelLine={false}
               label={(entry: any) => `${entry.status}: ${entry.percentage}%`}
               outerRadius={80} fill="#8884d8" dataKey="count">
            {data?.map((entry: { status: string; count: number; revenue?: number; percentage?: number }, index: number) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    )
  };
});

const LazyBarChart = lazy(async () => {
  const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = await import('recharts');
  return {
    default: ({ data, height = CHART_CONFIG.BAR_CHART_HEIGHT }: BarChartProps) => (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 160 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="name" stroke="rgba(255,255,255,0.7)" angle={-45} textAnchor="end" height={160} fontSize={10} interval={0}
                 tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.7)', width: 120 }}
                 tickFormatter={(value) => value.length > 25 ? value.substring(0, 22) + '...' : value} />
          <YAxis stroke="rgba(255,255,255,0.7)" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.7)' }} />
          <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px" }}
                   formatter={(value: number | string, name: string) => [`GBP ${value}`, name]}
                   labelFormatter={(label) => `Campaign: ${label}`} />
          <Bar dataKey="revenue" fill="#3B82F6" />
        </BarChart>
      </ResponsiveContainer>
    )
  };
});

// Wrapper components with original export names for compatibility
export const OptimizedLineChart = ({ data, height }: LineChartProps) => (
  <Suspense fallback={<ChartSkeleton height={height} />}>
    <LazyLineChart data={data} height={height} />
  </Suspense>
);

export const OptimizedPieChart = ({ data, colors, height }: PieChartProps) => (
  <Suspense fallback={<ChartSkeleton height={height} />}>
    <LazyPieChart data={data} colors={colors} height={height} />
  </Suspense>
);

export const OptimizedBarChart = ({ data, height }: BarChartProps) => (
  <Suspense fallback={<ChartSkeleton height={height} />}>
    <LazyBarChart data={data} height={height} />
  </Suspense>
);

export { ChartSkeleton };
