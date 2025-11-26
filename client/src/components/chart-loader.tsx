/**
 * Individual Chart Loaders - Prevents 420kB bundle loading
 * Each chart component loads only when specifically needed
 */

import { lazy, Suspense, memo } from "react";
import type { LineChartProps, PieChartProps, BarChartProps } from "@/types/chart-types";
// Chart configuration constants
const CHART_CONFIG = {
  DEFAULT_HEIGHT: 300,
  PIE_CHART_HEIGHT: 300,
  BAR_CHART_HEIGHT: 400,
  COLORS: {
    primary: '#3B82F6',
    secondary: '#10B981',
    tertiary: '#F59E0B'
  }
};

const ChartSkeleton = memo(({ height = CHART_CONFIG.DEFAULT_HEIGHT }: { height?: number }) => (
  <div className="w-full bg-white/5 rounded-lg flex items-center justify-center animate-pulse" style={{ height }}>
    <div className="text-white/50 text-sm">Loading chart...</div>
  </div>
));
ChartSkeleton.displayName = 'ChartSkeleton';

// Individual chart loaders - only load when actually needed
export const LineChartLoader = memo(({ data, height }: LineChartProps) => {
  const LazyLineChart = lazy(async () => {
    const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = await import('recharts');
    return {
      default: memo(({ data, height = CHART_CONFIG.DEFAULT_HEIGHT }: LineChartProps) => (
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
      ))
    };
  });

  return (
    <Suspense fallback={<ChartSkeleton height={height} />}>
      <LazyLineChart data={data} height={height} />
    </Suspense>
  );
});
LineChartLoader.displayName = 'LineChartLoader';

export const PieChartLoader = memo(({ data, colors, height }: PieChartProps) => {
  const LazyPieChart = lazy(async () => {
    const { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } = await import('recharts');
    return {
      default: memo(({ data, colors, height = CHART_CONFIG.PIE_CHART_HEIGHT }: PieChartProps) => (
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
      ))
    };
  });

  return (
    <Suspense fallback={<ChartSkeleton height={height} />}>
      <LazyPieChart data={data} colors={colors} height={height} />
    </Suspense>
  );
});
PieChartLoader.displayName = 'PieChartLoader';

export const BarChartLoader = memo(({ data, height }: BarChartProps) => {
  const LazyBarChart = lazy(async () => {
    const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = await import('recharts');
    return {
      default: memo(({ data, height = CHART_CONFIG.BAR_CHART_HEIGHT }: BarChartProps) => (
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
      ))
    };
  });

  return (
    <Suspense fallback={<ChartSkeleton height={height} />}>
      <LazyBarChart data={data} height={height} />
    </Suspense>
  );
});
BarChartLoader.displayName = 'BarChartLoader';

export { ChartSkeleton };
