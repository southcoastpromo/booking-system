/**
 * Optimized Icon Imports for Bundle Size Reduction
 * Only imports the specific icons needed rather than entire icon library
 */

// Direct imports for tree shaking - only imports what's used
export {
  TrendingUp,
  TrendingDown,
  PoundSterling,
  Calendar,
  Users,
  Target,
  Download,
  RefreshCw,
  BarChart3,
  Bell
} from "lucide-react";

// Re-export for easier imports
export * from "lucide-react";
