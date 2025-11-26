import { ShoppingCart, Filter } from "lucide-react";

interface CampaignHeaderProps {
  totalItems: number;
  isMobileFilterOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  setIsMobileFilterOpen: (isOpen: boolean) => void;
}

export const CampaignHeader = ({
  totalItems,
  isMobileFilterOpen,
  setIsCartOpen,
  setIsMobileFilterOpen
}: CampaignHeaderProps) => {
  return (
    <section className="mb-4 sm:mb-6" aria-labelledby="page-title">
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <div className="flex-1">
          <h1 
            className="text-lg sm:text-2xl lg:text-3xl font-bold text-white mb-1" 
            id="page-title"
            data-testid="page-title"
          >
            SouthCoast ProMotion
          </h1>
          <p className="text-xs sm:text-base text-gray-300 leading-relaxed" role="doc-subtitle">
            Professional mobile advertising campaigns across southern England
          </p>
        </div>

        {/* Mobile-optimized action buttons */}
        <div className="flex gap-2 ml-4" role="toolbar" aria-label="Page actions">
          <button
            onClick={() => setIsCartOpen(true)}
            className="text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg flex items-center justify-center gap-2 shadow-md transition-all
                       min-h-[44px] sm:min-h-[48px] min-w-[80px] sm:min-w-[120px] text-sm sm:text-base
                       focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-navy
                       hover:shadow-lg active:transform active:scale-98"
            style={{ background: 'linear-gradient(90deg, #1e40af 0%, #3b82f6 100%)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(90deg, #1d4ed8, #2563eb)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(90deg, #1e40af 0%, #3b82f6 100%)'}
            aria-label={`Open shopping cart with ${totalItems} ${totalItems === 1 ? 'item' : 'items'}`}
            data-testid="cart-button"
          >
            <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            <span className="hidden sm:inline">Cart</span>
            <span className="inline sm:hidden" aria-hidden="true">({totalItems})</span>
            <span className="hidden sm:inline" aria-hidden="true">({totalItems})</span>
            <span className="sr-only">{totalItems} {totalItems === 1 ? 'item' : 'items'} in cart</span>
          </button>
        </div>
      </div>

      {/* Mobile Filter Toggle - Full width button */}
      <button
        onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
        className="sm:hidden w-full text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 shadow-md transition-all min-h-[48px]
                   bg-slate-700 hover:bg-slate-600 border border-slate-600 active:bg-slate-800
                   focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-navy"
        aria-expanded={isMobileFilterOpen}
        aria-controls="mobile-filter-panel"
        aria-label={`${isMobileFilterOpen ? 'Hide' : 'Show'} campaign filters`}
        data-testid="mobile-filter-toggle"
      >
        <Filter className="h-5 w-5" aria-hidden="true" />
        <span>{isMobileFilterOpen ? 'Hide Filters' : 'Show Filters'}</span>
      </button>
    </section>
  );
};
