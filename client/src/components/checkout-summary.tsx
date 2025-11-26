import type { FC } from 'react';
import { Button } from "@/components/ui/button";
import { formatCurrency, calculatePricing } from "@/shared/utils";
import { useCart, BookingPhase } from "@/contexts/cart-context";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check } from "lucide-react";

export const CheckoutSummary: FC = () => {
  const { items, setBookingPhase } = useCart();
  const { toast } = useToast();
  const pricing = calculatePricing(items);

  const handleBackClick = () => {
    setBookingPhase(BookingPhase.BROWSING);
  };

  const handleProceedToPayment = () => {
    if (items.length === 0) {
      toast({
        title: "No items in cart",
        description: "Please add campaigns to your cart before proceeding.",
        variant: "destructive",
      });
      return;
    }

    // Move to customer information collection phase
    setBookingPhase(BookingPhase.CUSTOMER_INFO);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 pb-4 border-b">
        <Button
          variant="outline"
          onClick={handleBackClick}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cart
        </Button>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Checkout Summary
        </h2>
      </div>

      {/* Selected Campaigns */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Selected Campaigns ({items.length})
        </h3>
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.campaignId}
              className="flex justify-between items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              {/* Campaign Image */}
              {item.iconUrl && (
                <div className="flex-shrink-0">
                  <img 
                    src={item.iconUrl} 
                    alt={`${item.campaignName} campaign`}
                    className="w-20 h-20 object-cover rounded-md border-2 border-gray-300 dark:border-gray-600"
                    data-testid={`checkout-image-${item.campaignId}`}
                  />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 dark:text-white truncate" title={item.campaignName}>
                  {item.campaignName}
                </h4>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <span>{item.date} • {item.time}</span>
                  <span className="ml-4">
                    {item.slotsRequired} slot{item.slotsRequired > 1 ? 's' : ''}
                  </span>
                  <span className="ml-4">
                    {(item.advertsPerSlot * item.slotsRequired).toLocaleString()} adverts
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(item.totalPrice)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {formatCurrency(item.pricePerSlot)} per slot
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Breakdown */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Pricing Breakdown
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between text-gray-700 dark:text-gray-300">
            <span>Subtotal ({pricing.totalSlots} slots):</span>
            <span>{formatCurrency(pricing.subtotal)}</span>
          </div>

          {pricing.discountPercentage > 0 && (
            <div className="flex justify-between text-blue-600 dark:text-blue-400">
              <span>
                Bulk Discount ({Math.round(pricing.discountPercentage * 100)}% off):
              </span>
              <span>-{formatCurrency(pricing.discountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between text-gray-700 dark:text-gray-300">
            <span>VAT (20%):</span>
            <span>{formatCurrency(pricing.vat)}</span>
          </div>

          <div className="border-t pt-3 mt-3">
            <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white">
              <span>Total Payable:</span>
              <span className="text-green-600 dark:text-green-400">
                {formatCurrency(pricing.total)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {pricing.totalSlots}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Slots
          </div>
        </div>
        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {pricing.totalAdverts.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Adverts
          </div>
        </div>
        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {items.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Campaigns
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        <button
          onClick={handleBackClick}
          className="px-6 py-3 border border-gray-400 bg-gray-200 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors flex items-center gap-2 cursor-pointer"
        >
          Back to Cart
        </button>
        <button
          onClick={handleProceedToPayment}
          disabled={items.length === 0}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 transition-colors cursor-pointer"
        >
          <Check className="h-4 w-4" />
          Continue to Customer Details
        </button>
      </div>
    </div>
  );
};
