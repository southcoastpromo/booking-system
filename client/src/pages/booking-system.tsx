import { useMemo, useState, useCallback, lazy, Suspense, useRef, useEffect, type ChangeEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Filter, ShoppingCart } from "lucide-react";
import { createAPIEndpoints } from "@shared/config/constants";
import { filterCampaigns, extractUniqueLocations, getAvailabilityText, getAvailabilityColor, parseDate } from "@/shared/utils";
import { createCampaignQuery } from "@/lib/queryClient";
import { CampaignHeader } from "@/components/campaign-header";
import { DatePickerComponent } from "@/components/date-picker";
import { UKDateDisplay } from "@/components/uk-date-input";

import CartSidebar from "@/components/cart-sidebar";
import { CheckoutSummary } from "@/components/checkout-summary";
// Lazy load heavy form components for better performance
const CustomerInfoForm = lazy(() => import("@/components/customer-info-form"));
const PaymentForm = lazy(() => import("@/components/payment-form"));
import { useCart, BookingPhase } from "@/contexts/cart-context";
import { useLocation } from "wouter";
import type { Campaign } from "@shared/schema";

// File upload functionality managed by components

// Logger functionality handled by production-logger imports

export default function BookingSystem() {
  const API_ENDPOINTS = createAPIEndpoints();
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedAvailability, setSelectedAvailability] = useState<string>("All");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<number>(1);
  const [customerData, setCustomerData] = useState<{
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    company?: string;
    requirements?: string;
  } | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Render-phase guard to identify components calling setters during render
  const isRenderPhase = useRef(true);
  useEffect(() => { 
    isRenderPhase.current = false; 
  });

  const guarded = (fnName: string, fn: any) => (...args: any[]) => {
    if (isRenderPhase.current) {
      // Critical render-phase update detected - handled internally
      return;
    }
    fn(...args);
  };

  // Safe idempotent setters to prevent infinite re-render loops
  const debugSetDateFrom = useCallback((date: string) => {
    setDateFrom(prev => prev === date ? prev : date);
  }, []);

  const debugSetDateTo = useCallback((date: string) => {
    setDateTo(prev => prev === date ? prev : date);
  }, []);

  const handleLocationChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedLocation(e.target.value);
  }, []);

  const handleAvailabilityChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedAvailability(e.target.value);
  }, []);

  const [, setLocation] = useLocation();

  // Cart functionality and booking phase
  const {
    setIsCartOpen,
    totalItems,
    subtotal,
    addToCart,
    items,
    bookingPhase,
    setBookingPhase
  } = useCart();

  // Safe mobile filter setter to prevent infinite loops
  const setIsMobileFilterOpenSafe = useCallback((open: boolean) => {
    setIsMobileFilterOpen(prev => prev === open ? prev : open);
  }, []);

  // Direct booking phase setter - no useCallback to avoid dependency issues
  const setBookingPhaseSafe = (phase: BookingPhase) => {
    setBookingPhase(phase);
  };

  // Direct filter clear handler - no useCallback to avoid dependency issues
  const handleClearFilters = () => {
    debugSetDateFrom("");
    debugSetDateTo("");
    setSelectedLocation("");
    setSelectedAvailability("All");
    setIsMobileFilterOpenSafe(false);

    // Announce filter clear to screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = 'All filters cleared. Showing all campaigns.';
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 2000);
  };

  // Memoized helper function to check if campaign is in cart
  const isInCart = useCallback((campaignId: number) => {
    return items.some(item => item.campaignId === campaignId);
  }, [items]);

  const { data: campaignsResponse, isLoading, error } = useQuery({
    ...createCampaignQuery(['campaigns', { dateFrom, dateTo, selectedLocation, selectedAvailability }]),
    queryFn: async () => {
      try {
        const response = await fetch(API_ENDPOINTS.CAMPAIGNS, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const responseText = await response.text();

          // Check if this is a Vite development server error page
          if (responseText.includes('<!DOCTYPE html>')) {
            throw new Error('Server routing error - received HTML instead of JSON');
          }

          throw new Error('Server returned non-JSON response');
        }

        const data = await response.json();
        return data;

      } catch (parseError) {
        const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown error';
        throw new Error(`Failed to parse server response: ${errorMessage}`);
      }
    }
  });


  // ✅ ALL HOOKS MUST BE AT TOP LEVEL - BEFORE ANY EARLY RETURNS
  const campaigns: Campaign[] = useMemo(() => {
    if (!campaignsResponse) return [];
    const data = Array.isArray(campaignsResponse) ? campaignsResponse : (campaignsResponse as { campaigns?: Campaign[] }).campaigns || [];
    return Array.isArray(data) ? data : [];
  }, [campaignsResponse]);

  const locations = useMemo(() => {
    return extractUniqueLocations(campaigns);
  }, [campaigns]);

  const filteredCampaigns = useMemo(() => {
    const filtered = filterCampaigns(campaigns, {
      location: selectedLocation,
      availability: selectedAvailability === "All" ? "" : selectedAvailability,
      dateFrom,
      dateTo,
    });
    return filtered;
  }, [campaigns, selectedLocation, selectedAvailability, dateFrom, dateTo]);

  // Helper to show available date range for user guidance
  const availableDateRange = useMemo(() => {
    if (!campaigns || campaigns.length === 0) return null;
    const dates = campaigns.map(c => parseDate(c.date)).sort((a, b) => a.getTime() - b.getTime());
    const earliest = dates[0];
    const latest = dates[dates.length - 1];
    return {
      earliest: `${earliest.getDate().toString().padStart(2, '0')}/${(earliest.getMonth() + 1).toString().padStart(2, '0')}/${earliest.getFullYear()}`,
      latest: `${latest.getDate().toString().padStart(2, '0')}/${(latest.getMonth() + 1).toString().padStart(2, '0')}/${latest.getFullYear()}`,
    };
  }, [campaigns]);

  // ✅ EARLY RETURNS COME AFTER ALL HOOKS
  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy text-white flex items-center justify-center" role="status" aria-live="polite">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-blue mx-auto mb-4" aria-hidden="true"></div>
          <div className="text-2xl font-bold">Loading Campaigns...</div>
          <div className="mt-2 text-gray-300">Please wait while we fetch campaign data</div>
          <span className="sr-only">Loading campaigns, please wait...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-navy text-white flex items-center justify-center" role="alert" aria-live="assertive">
        <div className="text-center max-w-md px-4">
          <div className="text-6xl mb-4" aria-hidden="true">⚠️</div>
          <h1 className="text-2xl font-bold text-red-400 mb-4">Error Loading Campaigns</h1>
          <p className="text-gray-300 mb-6">We're having trouble loading campaign data. Please try refreshing the page.</p>
          <p className="text-sm text-gray-400">Technical details: {error?.message || 'Unknown error'}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-3 bg-accent-blue hover:bg-blue-600 text-white rounded-lg transition-colors
                       focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-navy"
            aria-label="Reload the page to try again"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Test if component rendering works at all
  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="min-h-screen bg-navy text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">No Campaigns Available</div>
          <div className="mt-2 text-gray-300">Campaign data: {JSON.stringify(campaignsResponse)}</div>
        </div>
      </div>
    );
  }


  // Direct customer info handler - no useCallback to avoid dependency issues
  const handleCustomerInfoNext = (data: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    company?: string;
    requirements?: string;
  }, files: any[]) => {
    setCustomerData(data);
    setUploadedFiles(files); // Files are already in correct format
    setBookingPhase(BookingPhase.PAYMENT);
  };


  // Phase-based UI control
  if (bookingPhase === BookingPhase.CHECKOUT) {
    return (
      <div className="min-h-screen bg-navy relative z-10 pb-20 lg:pb-8">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
          <CheckoutSummary />
        </div>
      </div>
    );
  }

  if (bookingPhase === BookingPhase.CUSTOMER_INFO) {
    return (
      <div className="min-h-screen bg-navy relative z-10 pb-20 lg:pb-8">
        <Suspense fallback={
          <div className="min-h-screen bg-navy flex items-center justify-center">
            <div className="text-white text-lg">Loading customer information form...</div>
          </div>
        }>
          <CustomerInfoForm
            onNext={handleCustomerInfoNext}
            onBack={() => setBookingPhase(BookingPhase.CHECKOUT)}
          />
        </Suspense>
      </div>
    );
  }


  if (bookingPhase === BookingPhase.PAYMENT) {
    return (
      <div className="min-h-screen bg-navy relative z-10 pb-20 lg:pb-8">
        <Suspense fallback={
          <div className="min-h-screen bg-navy flex items-center justify-center">
            <div className="text-white text-lg">Loading payment form...</div>
          </div>
        }>
          <PaymentForm
            customerData={customerData || {
              customerName: '',
              customerEmail: '',
              customerPhone: '',
              company: '',
              requirements: ''
            }}
            uploadedFiles={uploadedFiles}
            onBack={() => setBookingPhase(BookingPhase.CUSTOMER_INFO)}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy relative z-10 pb-20 lg:pb-8">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Desktop: Two-column layout | Mobile: Single column */}
        <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8">
          {/* LEFT COLUMN: Main content (campaigns, filters, etc.) */}
          <div className="lg:min-w-0">
            <CampaignHeader 
              totalItems={totalItems}
              isMobileFilterOpen={isMobileFilterOpen}
              setIsCartOpen={guarded('CampaignHeader.setIsCartOpen', setIsCartOpen)}
              setIsMobileFilterOpen={guarded('CampaignHeader.setIsMobileFilterOpen', setIsMobileFilterOpenSafe)}
            />


        {/* MOBILE-FIRST RESPONSIVE FILTER PANEL */}
        <section 
          id="mobile-filter-panel"
          className={`bg-slate-800 border border-slate-600 rounded-lg mb-6 shadow-sm transition-all duration-300
            ${isMobileFilterOpen ? 'block' : 'hidden sm:block'}
            // Mobile: Slide in animation | Desktop: Always visible
            transform ${isMobileFilterOpen ? 'translate-y-0 opacity-100' : 'sm:translate-y-0 sm:opacity-100 -translate-y-2 opacity-0 sm:block'}`}
          aria-labelledby="filter-heading"
          data-testid="filter-panel"
        >
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between w-full mb-4 sm:mb-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" aria-hidden="true" />
                <h2 id="filter-heading" className="text-white font-bold text-base sm:text-lg">Filter Campaigns</h2>
              </div>
              {/* Close button for mobile only */}
              <button
                onClick={() => setIsMobileFilterOpenSafe(false)}
                className="sm:hidden text-gray-400 hover:text-white transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center
                           focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-slate-800 rounded-md"
                aria-label="Close filter panel"
                data-testid="close-filter-button"
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>

            {/* Mobile-First Filter Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 sm:gap-4 items-end">
              {/* Date Range Fields */}
              <div className="flex flex-col">
                <DatePickerComponent
                  value={dateFrom}
                  onChange={guarded('DatePicker.setDateFrom', debugSetDateFrom)}
                  placeholder="dd / mm / yyyy"
                  label="Date Range"
                  className="w-full"
                />
              </div>

              <div className="flex flex-col">
                <DatePickerComponent
                  value={dateTo}
                  onChange={guarded('DatePicker.setDateTo', debugSetDateTo)}
                  placeholder="dd / mm / yyyy"
                  label=""
                  className="w-full"
                />
              </div>

              {/* Location Dropdown - Mobile-optimized */}
              <div className="flex flex-col">
                <label 
                  htmlFor="location-filter"
                  className="text-xs sm:text-xs font-semibold text-gray-300 mb-1"
                >
                  Campaign Location
                </label>
                <select
                  id="location-filter"
                  value={selectedLocation}
                  onChange={handleLocationChange}
                  className="w-full h-[48px] text-sm font-medium px-3 py-2 rounded-md border border-slate-600 bg-slate-700 text-white appearance-none
                             focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-slate-800 focus:outline-none transition-colors
                             // Mobile: Larger touch target
                             touch-manipulation"
                  aria-label="Filter campaigns by location"
                  data-testid="location-filter"
                >
                  <option value="">All Locations</option>
                  {locations.map((location: string) => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>

              {/* Availability Dropdown - Mobile-optimized */}
              <div className="flex flex-col">
                <label 
                  htmlFor="availability-filter"
                  className="text-xs sm:text-xs font-semibold text-gray-300 mb-1"
                >
                  Availability
                </label>
                <select
                  id="availability-filter"
                  value={selectedAvailability}
                  onChange={handleAvailabilityChange}
                  className="w-full h-[48px] text-sm font-medium px-3 py-2 rounded-md border border-slate-600 bg-slate-700 text-white appearance-none
                             focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-slate-800 focus:outline-none transition-colors
                             // Mobile: Larger touch target
                             touch-manipulation"
                  aria-label="Filter campaigns by availability status"
                  data-testid="availability-filter"
                >
                  <option value="All">All</option>
                  <option value="available">Available</option>
                  <option value="limited">Limited</option>
                  <option value="full">Full</option>
                </select>
              </div>

              {/* Clear All Filters - Mobile-optimized */}
              <div className="flex flex-col justify-end">
                <button
                  type="button"
                  className="w-full h-[48px] text-sm text-gray-400 hover:text-gray-300 hover:underline transition-colors
                             flex items-center justify-center bg-transparent focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-slate-800 rounded-md
                             // Mobile: Better touch target
                             touch-manipulation min-h-[48px]"
                  onClick={handleClearFilters}
                  aria-label="Clear all campaign filters"
                  data-testid="clear-filters-button"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Status Bar - FIXED: Now shows actual filtered count */}
        <div 
          className="py-2 flex items-center justify-between text-sm mb-6" 
          role="status"
          aria-live="polite"
          aria-atomic="true"
          data-testid="campaign-status-bar"
        >
          <span className="text-gray-300 font-medium" id="campaign-count">
            {filteredCampaigns.length} campaign{filteredCampaigns.length !== 1 ? 's' : ''} shown
            {filteredCampaigns.length !== campaigns.length && (
              <span className="text-gray-500"> (filtered from {campaigns.length} total)</span>
            )}
          </span>
          <div className="flex items-center gap-4" role="img" aria-label="Campaign availability legend">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-400" aria-hidden="true"></div>
              <span className="text-gray-300 text-sm">Available</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-400" aria-hidden="true"></div>
              <span className="text-gray-300 text-sm">Limited</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-400" aria-hidden="true"></div>
              <span className="text-gray-300 text-sm">Full</span>
            </div>
          </div>
        </div>

        {/* CAMPAIGN CARDS - Fixed Alignment, Original Horizontal Layout */}
        <section 
          className="space-y-2"
          role="list"
          aria-labelledby="campaign-count"
          aria-label={`${filteredCampaigns.length} campaign${filteredCampaigns.length !== 1 ? 's' : ''} available for booking`}
          data-testid="campaign-list"
        >
          {filteredCampaigns.map((campaign, index) => {
            return (
              <article
                key={`${campaign.campaign}-${index}`}
                className="rounded-lg bg-slate-700 border border-slate-600 shadow-md hover:bg-slate-600 transition-all duration-200 border-l-4 border-l-cyan-400
                           min-h-[72px] flex items-center p-4 sm:px-6 focus-within:ring-2 focus-within:ring-accent-blue focus-within:ring-offset-2 focus-within:ring-offset-navy"
                role="listitem"
                aria-labelledby={`campaign-title-${index}`}
                aria-describedby={`campaign-details-${index}`}
                data-testid={`campaign-card-${campaign.id}`}
              >
                {/* Perfect Horizontal Alignment - Both Rows */}
                <div className="flex items-start justify-between w-full">

                  {/* Left: Date and Time - Left aligned */}
                  <div className="flex-shrink-0 min-w-[90px]" aria-label={`Campaign date: ${campaign.date}, time: ${campaign.time || '08:00-19:00'}`}>
                    <div className="text-white font-bold text-xl leading-6 h-6 flex items-center">
                      <UKDateDisplay date={campaign.date} format="short" />
                    </div>
                    <div className="text-gray-400 text-sm leading-5 h-5 flex items-center">
                      {campaign.time || '08:00-19:00'}
                    </div>
                  </div>

                  {/* Center Left: Campaign Title and Availability - Left aligned */}
                  <div className="flex-1 px-6">
                    <h3 
                      id={`campaign-title-${index}`}
                      className="text-white font-bold text-xl leading-6 h-6 flex items-center truncate" 
                      title={campaign.campaign}
                    >
                      {campaign.campaign}
                    </h3>
                    <div 
                      className="text-accent-blue text-sm font-medium leading-5 h-5 flex items-center gap-1"
                      aria-label={`Availability status: ${getAvailabilityText(campaign.availability || "")}`}
                    >
                      <div 
                        className={`w-2 h-2 rounded-full ${getAvailabilityColor(campaign.availability || "")}`}
                        aria-hidden="true"
                      ></div>
                      <span>{getAvailabilityText(campaign.availability || "")}</span>
                    </div>
                  </div>

                  {/* Center Right: Ads per slot - Left aligned */}
                  <div 
                    className="flex-shrink-0 min-w-[100px]"
                    aria-label={`${Math.floor(Number(campaign.numberAdverts)).toLocaleString()} advertisements per slot`}
                  >
                    <div className="text-white font-bold text-xl leading-6 h-6 flex items-center">
                      {Math.floor(Number(campaign.numberAdverts)).toLocaleString()}
                    </div>
                    <div className="text-gray-400 text-sm leading-5 h-5 flex items-center">
                      Ads per slot
                    </div>
                  </div>

                  {/* Center Right: Price - Left aligned */}
                  <div 
                    className="flex-shrink-0 min-w-[100px] px-2"
                    aria-label={`Price: ${typeof campaign.price === 'string'
                      ? (campaign.price.startsWith('GBP') ? `£${campaign.price.replace('GBP', '').trim()}` : `£${campaign.price}`)
                      : `£${campaign.price}`
                    } per slot`}
                  >
                    <div className="text-white font-bold text-xl leading-6 h-6 flex items-center">
                      {typeof campaign.price === 'string'
                        ? (campaign.price.startsWith('GBP') ? `£${campaign.price.replace('GBP', '').trim()}` : `£${campaign.price}`)
                        : `£${campaign.price}`
                      }
                    </div>
                    <div className="text-gray-400 text-sm leading-5 h-5 flex items-center">
                      per slot
                    </div>
                  </div>

                  {/* Right: Book Now Button */}
                  <div className="flex-shrink-0">
                    {isInCart(campaign.id) ? (
                      <button
                        className="bg-green-600 text-white font-semibold
                                   px-6 py-3 h-[48px] rounded-lg
                                   flex items-center justify-center gap-2 w-[120px]
                                   cursor-default focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-slate-700"
                        disabled
                        aria-label={`${campaign.campaign} is already added to your cart`}
                        data-testid={`in-cart-button-${campaign.id}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm whitespace-nowrap">In Cart</span>
                      </button>
                    ) : (
                      <button
                        className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold
                                   px-6 py-3 h-[48px] rounded-lg transition-all duration-200
                                   flex items-center justify-center gap-2 w-[120px]
                                   transform hover:scale-105 active:scale-95
                                   focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-slate-700"
                        onClick={() => {
                          setSelectedCampaign(campaign);
                          setSelectedSlots(1);

                          // Announce action to screen readers
                          const announcement = document.createElement('div');
                          announcement.setAttribute('aria-live', 'polite');
                          announcement.className = 'sr-only';
                          announcement.textContent = `Selected ${campaign.campaign} campaign. Choose your slots to continue.`;
                          document.body.appendChild(announcement);
                          setTimeout(() => document.body.removeChild(announcement), 2000);
                        }}
                        aria-label={`Book ${campaign.campaign} campaign on ${campaign.date} for £${typeof campaign.price === 'string'
                          ? (campaign.price.startsWith('GBP') ? campaign.price.replace('GBP', '').trim() : campaign.price)
                          : campaign.price} per slot`}
                        data-testid={`book-button-${campaign.id}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="text-sm whitespace-nowrap">Book Now</span>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}

          {filteredCampaigns.length === 0 && (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-300 mb-2">No campaigns match your filters</div>
              {availableDateRange && (dateFrom || dateTo) && (
                <div className="text-sm text-gray-400">
                  💡 Available campaigns are from {availableDateRange.earliest} to {availableDateRange.latest}
                </div>
              )}
            </div>
          )}
        </section>

            {/* Mobile Cart Bottom Drawer - Only show when cart has items */}
            {totalItems > 0 && (
              <div className="block lg:hidden fixed bottom-0 left-0 w-full bg-[#1a1d26] border-t border-slate-600 p-4 shadow-lg z-50 safe-area-inset-bottom">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-blue-400" />
                    <span className="text-white font-medium text-sm sm:text-base">
                      {totalItems} slots • £{subtotal.toFixed(2)}
                    </span>
                  </div>
                  <Button
                    onClick={() => setIsCartOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors min-h-[44px]"
                  >
                    View Cart
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Cart sidebar - Only visible on desktop when cart has items */}
          {totalItems > 0 && (
            <div className="hidden lg:block">
              <div className="sticky top-8">
                <CartSidebar className="w-full" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slot Picker Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg border border-slate-600 max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                Select Number of Slots
              </h3>

              <div className="mb-4">
                <p className="text-gray-300 text-sm mb-2 truncate" title={selectedCampaign.campaign}>
                  {selectedCampaign.campaign}
                </p>
                <p className="text-gray-400 text-xs">
                  {selectedCampaign.date} • {selectedCampaign.time || '08:00-19:00'}
                </p>
              </div>

              {/* Slot Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Number of Slots (Available: {selectedCampaign.slotsAvailable})
                </label>
                <select
                  value={selectedSlots}
                  onChange={(e) => setSelectedSlots(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {Array.from({ length: Math.min(selectedCampaign.slotsAvailable || 1, 12) }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>
                      {num} slot{num > 1 ? 's' : ''} - £{(parseFloat(selectedCampaign.price.toString().replace('GBP', '').trim()) * num).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedCampaign(null)}
                  className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Add to cart with selected slots
                    const cartItem = {
                      campaignId: selectedCampaign.id,
                      campaignName: selectedCampaign.campaign,
                      date: selectedCampaign.date,
                      time: selectedCampaign.time || '08:00-19:00',
                      slotsRequired: selectedSlots,
                      pricePerSlot: parseFloat(selectedCampaign.price.toString().replace('GBP', '').trim()),
                      totalPrice: parseFloat(selectedCampaign.price.toString().replace('GBP', '').trim()) * selectedSlots,
                      advertsPerSlot: Number(selectedCampaign.numberAdverts) || 1000,
                      iconUrl: selectedCampaign.iconUrl
                    };
                    addToCart(cartItem);

                    // Close slot picker
                    setSelectedCampaign(null);

                    // Open cart and navigate to checkout
                    setIsCartOpen(true);
                    setLocation('/checkout');
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  Add to Cart & Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
