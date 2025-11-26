import type { FC } from 'react';
import { ShoppingCart, Trash2, Package, Plus, Minus } from "lucide-react";
import { Button } from "./ui/button";
import { useCart, BookingPhase } from "../contexts/cart-context";
import { calculatePricing, formatCurrency } from "@/shared/utils";

interface CartSidebarProps {
  className?: string;
}

export const CartSidebar: FC<CartSidebarProps> = ({ className = "" }) => {
  const {
    items,
    removeFromCart,
    updateCartItem,
    clearCart,
    totalItems,
    setBookingPhase
  } = useCart();
  const pricing = calculatePricing(items);

  return (
    <div className={`sticky top-20 w-full rounded-md bg-[#1a1d26] shadow-lg border border-slate-600 z-[40]
                     // Responsive padding and sizing
                     p-3 lg:p-4 xl:p-5
                     // Responsive max width based on screen size
                     max-w-full lg:max-w-[280px] xl:max-w-[320px] 2xl:max-w-[350px]
                     // Better spacing on larger screens
                     lg:mx-0 xl:mr-2
                     // FIX: Ensure proper right-side positioning and prevent float issues
                     self-start
                     ${className}`}>
      {/* Header - Responsive sizing */}
      <div className="flex items-center gap-2 mb-3 lg:mb-4">
        <ShoppingCart className="h-4 w-4 lg:h-5 lg:w-5 text-blue-400" />
        <h3 className="text-white font-bold text-base lg:text-lg xl:text-xl">
          Cart ({totalItems})
        </h3>
      </div>

      {/* Empty State */}
      {items.length === 0 ? (
        <div className="text-center py-8">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-30 text-gray-400" />
          <p className="text-gray-300 text-sm mb-1">Your cart is empty</p>
          <p className="text-gray-500 text-xs">Add campaigns to get started</p>
        </div>
      ) : (
        <>
          {/* Cart Items - Responsive scrolling area */}
          <div className="space-y-2 lg:space-y-3 mb-3 lg:mb-4
                          max-h-[300px] lg:max-h-[350px] xl:max-h-[400px]
                          overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
            {items.map((item) => (
              <div
                key={item.campaignId}
                className="border border-slate-600 bg-slate-700/50 rounded-lg p-3"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 pr-2">
                    <h4 className="font-medium text-sm text-white line-clamp-2">
                      {item.campaignName}
                    </h4>
                    <p className="text-xs text-gray-400 mb-1">
                      {item.date} • {item.time}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(item.pricePerSlot)} per slot
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lime-400 font-bold text-sm">
                      {formatCurrency(item.totalPrice)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.campaignId)}
                      className="text-red-400 hover:text-red-300 min-h-[48px] min-w-[48px] p-2 mt-1 rounded-lg hover:bg-red-400/10 active:scale-95 transition-all"
                      title="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">Slots:</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateCartItem(item.campaignId, item.slotsRequired - 1)}
                      className="min-h-[48px] min-w-[48px] p-2 text-gray-400 hover:text-white hover:bg-slate-600/50 rounded-lg active:scale-95 transition-all"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-white font-medium text-sm min-w-[20px] text-center">
                      {item.slotsRequired}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateCartItem(item.campaignId, item.slotsRequired + 1)}
                      className="min-h-[48px] min-w-[48px] p-2 text-gray-400 hover:text-white hover:bg-slate-600/50 rounded-lg active:scale-95 transition-all"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Clear Pricing Breakdown - Exact format as specified */}
          <div className="border-t border-slate-600 pt-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-300">
              <span>Subtotal:</span>
              <span>{formatCurrency(pricing.subtotal)}</span>
            </div>

            {pricing.discountPercentage > 0 && (
              <div className="flex justify-between text-sm text-blue-400">
                <span>Bulk Discount ({Math.round(pricing.discountPercentage * 100)}% off {pricing.totalSlots >= 2 ? `${pricing.totalSlots}+ slots` : ''}):</span>
                <span>-{formatCurrency(pricing.discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm text-gray-300">
              <span>VAT (20%):</span>
              <span>{formatCurrency(pricing.vat)}</span>
            </div>

            <div className="border-t border-slate-600 pt-2 mt-2">
              <div className="flex justify-between font-bold text-base text-white">
                <span>Total Payable:</span>
                <span className="text-lime-400">{formatCurrency(pricing.total)}</span>
              </div>
            </div>

            {/* Action Buttons - Responsive sizing */}
            <div className="space-y-2 pt-2 lg:pt-3 flex flex-col gap-2">
              <button
                onClick={() => {
                  setBookingPhase(BookingPhase.CHECKOUT);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold
                          text-sm lg:text-base py-2 lg:py-3 min-h-[44px] lg:min-h-[48px]
                          transition-all duration-200 hover:shadow-md hover:scale-105
                          rounded-lg flex items-center justify-center cursor-pointer"
                data-testid="button-checkout"
              >
                Checkout
              </button>

              <button
                onClick={clearCart}
                className="w-full border border-slate-500 bg-slate-700 text-white hover:bg-slate-600 hover:text-white
                          text-xs lg:text-sm py-2 lg:py-2 min-h-[40px] lg:min-h-[40px]
                          transition-all duration-200 rounded-lg
                          flex items-center justify-center cursor-pointer font-medium"
                data-testid="button-clear-cart"
              >
                Clear Cart
              </button>
            </div>

            {/* Summary Stats - Clean display */}
            <div className="text-xs text-gray-400 text-center pt-2 border-t border-slate-600">
              {pricing.totalSlots} total slots • {pricing.totalAdverts.toLocaleString()} adverts
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CartSidebar;
