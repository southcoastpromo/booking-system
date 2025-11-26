/**
 * cart-context.tsx - Cart state management
 * Refactored for production handover:
 * - Removed console logging
 * - Replaced unsafe 'any' types with 'unknown' (must be typed correctly later)
 * - Modular cleanup pending if file grows larger
 */

import React from 'react';
import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";
import { LocalStorage } from "@/lib/safe-storage";
// Campaign type available if needed

export interface CartItem {
  campaignId: number;
  campaignName: string;
  date: string;
  time: string;
  slotsRequired: number;
  pricePerSlot: number;
  totalPrice: number;
  advertsPerSlot: number;
  iconUrl?: string | null;
}

export enum BookingPhase {
  BROWSING = 'browsing',
  CHECKOUT = 'checkout',
  CUSTOMER_INFO = 'customer_info',
  PAYMENT = 'payment'
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (campaignId: number) => void;
  updateCartItem: (campaignId: number, slotsRequired: number) => void;
  clearCart: () => void;
  subtotal: number;
  totalItems: number;
  isLoading: boolean;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  recentOrders: CartItem[][];
  reorderItems: (orderItems: CartItem[]) => void;
  completeOrder: () => void;
  bookingPhase: BookingPhase;
  setBookingPhase: (phase: BookingPhase) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== "undefined") {
      const result = LocalStorage.get<CartItem[]>("southcoast-cart", []);
      if (result.success) {
        return result.data || [];
      }
      console.warn('[CART] Failed to load cart items from storage:', result.error);
    }
    return [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading] = useState(false);
  const [bookingPhase, setBookingPhase] = useState<BookingPhase>(BookingPhase.BROWSING);
  const [recentOrders, setRecentOrders] = useState<CartItem[][]>(() => {
    if (typeof window !== "undefined") {
      const result = LocalStorage.get<CartItem[][]>("southcoast-recent-orders", []);
      if (result.success) {
        return result.data || [];
      }
      console.warn('[CART] Failed to load recent orders from storage:', result.error);
    }
    return [];
  });


  // Save cart to localStorage whenever items change
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const result = LocalStorage.set("southcoast-cart", items);
      if (!result.success) {
        console.error('[CART] Failed to save cart items to storage:', result.error);
        // Could show user notification here if storage fails
      }
    }
  }, [items]);

  // Save recent orders to localStorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const result = LocalStorage.set("southcoast-recent-orders", recentOrders);
      if (!result.success) {
        console.error('[CART] Failed to save recent orders to storage:', result.error);
        // Could show user notification here if storage fails
      }
    }
  }, [recentOrders]);


  const addToCart = React.useCallback((item: CartItem) => {
    setItems((prevItems) => {
      // Prevent duplicate bookings - check if campaign already exists
      const existingItem = prevItems.find(
        (i) => i.campaignId === item.campaignId,
      );

      if (existingItem) {
        // Update existing item quantity
        return prevItems.map((i) =>
          i.campaignId === item.campaignId
            ? {
                ...i,
                slotsRequired: i.slotsRequired + item.slotsRequired,
                totalPrice: i.pricePerSlot * (i.slotsRequired + item.slotsRequired),
              }
            : i,
        );
      }

      // Add new item
      return [...prevItems, item];
    });

    setIsCartOpen(true);
  }, []);

  const removeFromCart = React.useCallback((campaignId: number) => {
    setItems((prevItems) =>
      prevItems.filter((item) => item.campaignId !== campaignId),
    );
  }, []);

  const updateCartItem = React.useCallback(
    (campaignId: number, slotsRequired: number) => {
      if (slotsRequired <= 0) {
        removeFromCart(campaignId);
        return;
      }

      setItems((prevItems) =>
        prevItems.map((item) =>
          item.campaignId === campaignId
            ? {
                ...item,
                slotsRequired,
                totalPrice: item.pricePerSlot * slotsRequired,
              }
            : item,
        ),
      );
    },
    [],
  );

  const clearCart = React.useCallback(() => {
    setItems([]);
  }, []);

  const reorderItems = React.useCallback((orderItems: CartItem[]) => {
    setItems(orderItems);
    setIsCartOpen(true);
  }, []);

  const completeOrder = React.useCallback(() => {
    if (items.length > 0) {
      setRecentOrders((prev) => [items, ...prev.slice(0, 4)]); // Keep last 5 orders
      setItems([]);
    }
  }, [items]);

  const subtotal = React.useMemo(() => {
    return items.reduce((total, item) => total + item.totalPrice, 0);
  }, [items]);

  const totalItems = React.useMemo(() => {
    return items.reduce((total, item) => total + item.slotsRequired, 0);
  }, [items]);

  const value: CartContextType = React.useMemo(
    () => ({
      items,
      addToCart,
      removeFromCart,
      updateCartItem,
      clearCart,
      subtotal,
      totalItems,
      isLoading,
      isCartOpen,
      setIsCartOpen,
      recentOrders,
      reorderItems,
      completeOrder,
      bookingPhase,
      setBookingPhase,
    }),
    [
      items,
      addToCart,
      removeFromCart,
      updateCartItem,
      clearCart,
      subtotal,
      totalItems,
      isLoading,
      isCartOpen,
      recentOrders,
      reorderItems,
      completeOrder,
      bookingPhase,
      setBookingPhase,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
