// Timeout cleanup utilities available if needed

import { X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form-inputs";
import { UKDateInput } from "@/components/uk-date-input";
// UK_DATE_CONFIG available if needed
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { debounce } from "@/shared/utils";
import { useCallback, useMemo } from "react";

interface FilterState {
  startDate: string;
  endDate: string;
  location: string;
  availability: string;
  searchTerm: string;
  minPrice: string;
  maxPrice: string;
  selectedLocations: string[];
}

interface FilterControlsProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  totalCampaigns: number;
  maxDate?: string;
  campaigns?: Array<{ campaign: string }>;
}

export default function FilterControls({
  filters,
  onFiltersChange,
  totalCampaigns,
  // maxDate: _maxDate, // Available if needed
  campaigns = [],
}: FilterControlsProps) {
  // Debounced filter updates for better performance
  const debouncedFilterChange = useMemo(
    () =>
      debounce((newFilters: FilterState) => {
        onFiltersChange(newFilters);
      }, 300),
    [onFiltersChange],
  );

  const updateFilter = useCallback(
    (key: keyof FilterState, value: string) => {
      const newFilters = { ...filters, [key]: value };
      // Immediate update for dropdowns, debounced for text inputs
      if (key === "startDate" || key === "endDate") {
        debouncedFilterChange(newFilters);
      } else {
        onFiltersChange(newFilters);
      }
    },
    [filters, onFiltersChange, debouncedFilterChange],
  );

  // Date formatting available if needed
  // const today = new Date().toLocaleDateString(UK_DATE_CONFIG.LOCALE, UK_DATE_CONFIG.INTL_OPTIONS);

  // Extract unique locations directly from campaign data - dynamically from CSV
  const getUniqueLocations = () => {
    const locations = new Set<string>();
    campaigns.forEach((campaign) => {
      // Use the exact campaign names as location identifiers
      // This ensures we capture all locations exactly as they appear in the CSV
      const campaignName = campaign.campaign.trim();
      if (campaignName) {
        locations.add(campaignName);
      }
    });
    return Array.from(locations).sort();
  };

  const availableLocations = getUniqueLocations();

  const clearFilters = () => {
    onFiltersChange({
      startDate: "",
      endDate: "",
      location: "all",
      availability: "all",
      searchTerm: "",
      minPrice: "",
      maxPrice: "",
      selectedLocations: [],
    });
  };

  return (
    <div className="southcoast-card rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
      <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center">
        <Filter className="mr-2 h-5 w-5" />
        Smart Search & Filters
      </h2>

      {/* Smart Search Bar */}
      <div className="mb-6">
        <Label className="block text-sm font-medium text-gray-300 mb-2">
          Smart Search
        </Label>
        <Input
          type="text"
          placeholder="Search by location, time, or date..."
          value={filters.searchTerm || ""}
          onChange={(e) => updateFilter("searchTerm", e.target.value)}
          className="bg-gray-700 text-white border-gray-600 min-h-[48px] h-12 sm:h-10 text-base sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex flex-col">
          <Label className="block text-sm font-medium text-gray-300 mb-2">
            Date Range (UK Format: DD/MM/YYYY)
          </Label>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 h-auto sm:h-10 relative z-[9999]">
            <div className="relative z-[9999] flex-1">
              <UKDateInput
                value={filters.startDate}
                onChange={(value) => updateFilter("startDate", value)}
                placeholder="Start Date"
                className="bg-gray-700 text-white border-gray-600 w-full h-full relative z-[9999]"
              />
            </div>
            <div className="relative z-[9999] flex-1">
              <UKDateInput
                value={filters.endDate}
                onChange={(value) => updateFilter("endDate", value)}
                placeholder="End Date"
                className="bg-gray-700 text-white border-gray-600 w-full h-full relative z-[9999]"
              />
            </div>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            UK Date Format: DD/MM/YYYY (e.g., 25/12/2024)
          </div>
        </div>

        <div className="flex flex-col">
          <Label className="block text-sm font-medium text-gray-300 mb-2">
            Campaign Location
          </Label>
          <Select
            value={filters.location}
            onValueChange={(value) => updateFilter("location", value)}
          >
            <SelectTrigger className="bg-gray-700 text-white border-gray-600 min-h-[48px] h-12 sm:h-10 text-base sm:text-sm">
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {availableLocations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location
                    .replace(/\//g, " / ")
                    .replace(/\(/g, "(")
                    .replace(/\)/g, ")")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col">
          <Label className="block text-sm font-medium text-gray-300 mb-2">
            Availability
          </Label>
          <Select
            value={filters.availability}
            onValueChange={(value) => updateFilter("availability", value)}
          >
            <SelectTrigger className="bg-gray-700 text-white border-gray-600 min-h-[48px] h-12 sm:h-10 text-base sm:text-sm">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="available">Available (Green)</SelectItem>
              <SelectItem value="limited">Limited (Amber)</SelectItem>
              <SelectItem value="full">Full (Red)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col">
          <Label className="block text-sm font-medium text-gray-300 mb-2">
            Price Range (GBP)
          </Label>
          <div className="flex space-x-2 h-10">
            <Input
              type="number"
              placeholder="Min"
              value={filters.minPrice || ""}
              onChange={(e) => updateFilter("minPrice", e.target.value)}
              className="bg-gray-700 text-white border-gray-600 flex-1 h-full"
              min="0"
              step="10"
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters.maxPrice || ""}
              onChange={(e) => updateFilter("maxPrice", e.target.value)}
              className="bg-gray-700 text-white border-gray-600 flex-1 h-full"
              min="0"
              step="10"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <Button
          variant="ghost"
          onClick={clearFilters}
          className="text-gray-400 hover:text-white"
        >
          <X className="mr-2 h-4 w-4" />
          Clear All Filters
        </Button>

        <div className="flex items-center space-x-4 text-sm text-gray-300">
          <span>{totalCampaigns} campaigns shown</span>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 availability-available rounded-full mr-2"></div>
              Available
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 availability-limited rounded-full mr-2"></div>
              Limited
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 availability-full rounded-full mr-2"></div>
              Full
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
