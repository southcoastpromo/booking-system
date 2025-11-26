/**
 * Optimized Campaign List Component
 * Enhanced with virtual scrolling and performance improvements
 */

import { useMemo, useState, useCallback, memo } from "react";
import { CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAvailabilityText, throttle } from "@/shared/utils";
import type { Campaign } from "@shared/schema";

const logger = {
  info: (message: string) => {
    if (import.meta.env.DEV) {
      console.log(`[INFO] ${message}`);
    }
  },
  debug: (message: string) => {
    if (import.meta.env.DEV) {
      console.log(`[DEBUG] ${message}`);
    }
  }
};

interface OptimizedCampaignListProps {
  campaigns: Campaign[];
  onBookNow: (campaign: Campaign) => void;
  isMobile?: boolean;
}

// Memoized Campaign Card Component
const CampaignCard = memo(({
  campaign,
  onBookNow,
  isFullyBooked
}: {
  campaign: Campaign;
  onBookNow: (campaign: Campaign) => void;
  isFullyBooked: boolean;
}) => {
  const handleBookNow = useCallback(() => {
    if (!isFullyBooked) {
      onBookNow(campaign);
    }
  }, [campaign, onBookNow, isFullyBooked]);

  return (
    <article className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-xl
                   p-6 hover:border-accent-blue/30 transition-all duration-300 hover:shadow-lg
                   mobile-card campaign-card">
      {/* Campaign Icon/Image */}
      {campaign.iconUrl && (
        <div className="mb-4 rounded-lg overflow-hidden h-32 bg-white/5">
          <img 
            src={campaign.iconUrl} 
            alt={campaign.campaign}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      {/* Header Section - Perfect alignment */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2 leading-tight truncate" title={campaign.campaign}>
          {campaign.campaign}
        </h3>
        <p className="text-accent-blue text-sm font-medium mb-2">
          {getAvailabilityText(campaign.availability || "")}
        </p>
        <p className="text-accent-blue text-sm font-medium">
          {campaign.date} • {campaign.time}
        </p>
      </div>

      {/* Information Grid - Perfect alignment */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-6 text-sm">
        <div className="flex flex-col">
          <span className="text-gray-300 mb-1">Price:</span>
          <span className="text-white font-semibold">£{campaign.price}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-300 mb-1">Slots Available:</span>
          <span className="text-accent-blue font-semibold">{campaign.slotsAvailable}</span>
        </div>
        <div className="flex flex-col col-span-2">
          <span className="text-gray-300 mb-1">Adverts per Slot:</span>
          <span className="text-gray-100 font-medium">{campaign.numberAdverts?.toLocaleString()}</span>
        </div>
      </div>

      {/* Action Button - Perfect alignment */}
      <Button
        onClick={handleBookNow}
        disabled={isFullyBooked}
        aria-describedby={`campaign-${campaign.id}-description`}
        aria-label={`${isFullyBooked ? 'Campaign fully booked' : 'Book campaign'}: ${campaign.campaign} on ${campaign.date}`}
        className={`w-full font-semibold py-3 px-6 rounded-lg transition-all duration-300 
                   focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-transparent ${
          isFullyBooked
            ? "bg-gray-600 text-gray-300 cursor-not-allowed"
            : "bg-accent-blue hover:bg-accent-blue/90 text-white hover:shadow-lg transform hover:scale-105"
        }`}
      >
        <CalendarPlus className="mr-2 h-4 w-4" aria-hidden="true" />
        {isFullyBooked ? "Fully Booked" : "Book Now"}
      </Button>
      <div id={`campaign-${campaign.id}-description`} className="sr-only">
        {isFullyBooked
          ? `This campaign is fully booked. No slots available.`
          : `Book this advertising campaign for £${campaign.price}. ${campaign.slotsAvailable} slots currently available on ${campaign.date} at ${campaign.time}.`
        }
      </div>
    </article>
  );
});

CampaignCard.displayName = 'CampaignCard';

// Virtual Scrolling Implementation
export const OptimizedCampaignList = memo(({
  campaigns,
  onBookNow,
  isMobile = false
}: OptimizedCampaignListProps) => {
  const [visibleItems, setVisibleItems] = useState(20); // Start with 20 items

  const visibleCampaigns = useMemo(() =>
    campaigns.slice(0, visibleItems),
    [campaigns, visibleItems]
  );

  const loadMore = useCallback(
    throttle(() => {
      if (visibleItems < campaigns.length) {
        setVisibleItems(prev => Math.min(prev + 10, campaigns.length));
        logger.debug(`[PERFORMANCE] Loaded ${Math.min(visibleItems + 10, campaigns.length)} of ${campaigns.length} campaigns`);
      }
    }, 300),
    [campaigns.length, visibleItems]
  );

  // Mobile-specific rendering
  if (isMobile) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const currentCampaign = campaigns[currentIndex];
    const isFullyBooked = currentCampaign?.slotsAvailable === 0;

    const nextCampaign = useCallback(() => {
      setCurrentIndex(prev => (prev + 1) % campaigns.length);
    }, [campaigns.length]);

    const prevCampaign = useCallback(() => {
      setCurrentIndex(prev => (prev - 1 + campaigns.length) % campaigns.length);
    }, [campaigns.length]);

    if (!currentCampaign) return null;

    return (
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevCampaign}
            aria-label="Previous campaign"
            className="p-3 text-accent-blue hover:bg-accent-blue/10 rounded-lg
                       min-h-[48px] min-w-[48px] flex items-center justify-center
                       transition-all duration-200 active:scale-95 touch-button
                       focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-transparent"
          >
            <ChevronLeft className="w-6 h-6" aria-hidden="true" />
          </button>
          <span className="text-white font-medium" aria-live="polite" aria-label={`Campaign ${currentIndex + 1} of ${campaigns.length}`}>
            {currentIndex + 1} of {campaigns.length}
          </span>
          <button
            onClick={nextCampaign}
            aria-label="Next campaign"
            className="p-3 text-accent-blue hover:bg-accent-blue/10 rounded-lg
                       min-h-[48px] min-w-[48px] flex items-center justify-center
                       transition-all duration-200 active:scale-95 touch-button
                       focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-transparent"
          >
            <ChevronRight className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        <CampaignCard
          campaign={currentCampaign}
          onBookNow={onBookNow}
          isFullyBooked={isFullyBooked}
        />

        <div className="flex justify-center mt-4 space-x-2">
          {campaigns.slice(0, 5).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-colors min-h-[44px] min-w-[44px] p-2 flex items-center justify-center ${
                index === currentIndex ? "bg-accent-blue" : "bg-gray-600"
              } hover:scale-125 active:scale-95 touch-button`}
            />
          ))}
        </div>
      </div>
    );
  }

  // Desktop grid rendering with virtual scrolling
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {visibleCampaigns.map((campaign) => {
          const isFullyBooked = campaign.slotsAvailable === 0;
          return (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onBookNow={onBookNow}
              isFullyBooked={isFullyBooked}
            />
          );
        })}
      </div>

      {/* Load More / Virtual Scrolling Indicator */}
      {visibleItems < campaigns.length && (
        <div className="text-center py-6">
          <button
            onClick={loadMore}
            className="px-6 py-3 bg-accent-blue/20 hover:bg-accent-blue/30 text-accent-blue rounded-lg border border-accent-blue/30 transition-colors"
          >
            Load More ({visibleItems} of {campaigns.length})
          </button>
        </div>
      )}

      {/* Loading indicator for virtual scrolling */}
      {visibleItems < campaigns.length && (
        <div className="text-center py-4 text-gray-400">
          <div className="inline-flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent-blue mr-2"></div>
            Showing {visibleItems} of {campaigns.length} campaigns
          </div>
        </div>
      )}
    </div>
  );
});

OptimizedCampaignList.displayName = 'OptimizedCampaignList';

export default OptimizedCampaignList;
