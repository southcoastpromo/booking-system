import { Filter } from "lucide-react";
import { DatePickerComponent } from "./date-picker";

interface CampaignFiltersProps {
  isMobileFilterOpen: boolean;
  setIsMobileFilterOpen: (isOpen: boolean) => void;
  dateFrom: string;
  setDateFrom: (date: string) => void;
  dateTo: string;
  setDateTo: (date: string) => void;
  selectedLocation: string;
  setSelectedLocation: (location: string) => void;
  selectedAvailability: string;
  setSelectedAvailability: (availability: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  locations: string[];
  campaignCount: number;
}

export const CampaignFilters = ({
  isMobileFilterOpen,
  setIsMobileFilterOpen,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  selectedLocation,
  setSelectedLocation,
  selectedAvailability,
  setSelectedAvailability,
  sortBy,
  setSortBy,
  locations,
  campaignCount
}: CampaignFiltersProps) => {
  const clearAllFilters = () => {
    setDateFrom("");
    setDateTo("");
    setSelectedLocation("");
    setSelectedAvailability("All");
    setIsMobileFilterOpen(false);
  };

  return (
    <div className={`bg-slate-800 border border-slate-600 rounded-lg mb-6 shadow-sm transition-all duration-300
      ${isMobileFilterOpen ? 'block' : 'hidden sm:block'}
      transform ${isMobileFilterOpen ? 'translate-y-0 opacity-100' : 'sm:translate-y-0 sm:opacity-100 -translate-y-2 opacity-0 sm:block'}`}>
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between w-full mb-4 sm:mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <span className="text-white font-bold text-base sm:text-lg">Filter Campaigns</span>
          </div>
          {/* Close button for mobile only */}
          <button
            onClick={() => setIsMobileFilterOpen(false)}
            className="sm:hidden text-gray-400 hover:text-white transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close filters"
          >
            ✕
          </button>
        </div>

        {/* Mobile-First Filter Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 sm:gap-4 items-end">
          {/* Date Range Fields */}
          <div className="flex flex-col">
            <DatePickerComponent
              value={dateFrom}
              onChange={setDateFrom}
              placeholder="dd / mm / yyyy"
              label="Date Range"
              className="w-full"
            />
          </div>

          <div className="flex flex-col">
            <DatePickerComponent
              value={dateTo}
              onChange={setDateTo}
              placeholder="dd / mm / yyyy"
              label=""
              className="w-full"
            />
          </div>

          {/* Location Dropdown - Mobile-optimized */}
          <div className="flex flex-col">
            <label className="text-xs sm:text-xs font-semibold text-gray-300 mb-1" htmlFor="location-filter">Campaign Location</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full h-[48px] text-sm font-medium px-3 py-2 rounded-md border border-slate-600 bg-slate-700 text-white appearance-none
                         focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors
                         touch-manipulation"
              aria-label="Filter campaigns by location"
              id="location-filter"
            >
              <option value="">All Locations</option>
              {locations.map((location: string) => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>

          {/* Availability Filter - Mobile-first design */}
          <div className="flex flex-col">
            <label className="text-xs sm:text-xs font-semibold text-gray-300 mb-1" htmlFor="availability-filter">Availability Status</label>
            <select
              value={selectedAvailability}
              onChange={(e) => setSelectedAvailability(e.target.value)}
              className="w-full h-[48px] text-sm font-medium px-3 py-2 rounded-md border border-slate-600 bg-slate-700 text-white appearance-none
                         focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors
                         touch-manipulation"
              aria-label="Filter campaigns by availability"
              id="availability-filter"
            >
              <option value="All">All Status</option>
              <option value="available">Available</option>
              <option value="limited">Limited</option>
              <option value="full">Fully Booked</option>
            </select>
          </div>

          {/* Sort Options - Responsive design */}
          <div className="flex flex-col">
            <label className="text-xs sm:text-xs font-semibold text-gray-300 mb-1" htmlFor="sort-by-filter">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full h-[48px] text-sm font-medium px-3 py-2 rounded-md border border-slate-600 bg-slate-700 text-white appearance-none
                         focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors
                         touch-manipulation"
              aria-label="Sort campaigns by"
              id="sort-by-filter"
            >
              <option value="date">Date & Time</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="availability">Availability</option>
              <option value="location">Location (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Filter Summary & Clear Button - Mobile-optimized */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 pt-4 border-t border-slate-600 gap-3">
          <div className="text-xs text-gray-400">
            <span className="font-medium text-gray-300">{campaignCount} campaigns found</span>
            {(dateFrom || dateTo || selectedLocation || selectedAvailability !== "All") && (
              <span> • Filters active</span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              className="text-xs px-3 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 hover:text-white rounded-md transition-colors
                         border border-slate-600 min-h-[36px] font-medium"
              onClick={clearAllFilters}
              aria-label="Clear all active filters"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
