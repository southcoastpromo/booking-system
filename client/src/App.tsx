/**
 * App.tsx - Main application wrapper
 * Refactored for production handover:
 * - Removed debug logging
 * - Ensure clean entry point for routing/layout
 * - Keep minimal logic in top-level file
 */

import { useEffect, lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "@/lib/queryClient";
import { ErrorBoundary } from "@/components/error-boundary";
// Lazy load the main booking system for instant FCP
const BookingSystem = lazy(() => import("@/pages/booking-system"));
import { CartProvider } from "@/contexts/cart-context";
import { AppProvider } from "@/contexts/app-context";
import { Link, useLocation } from "wouter";
import { Calendar, Users, Bell } from "@/components/optimized-icons";
import SkipLinks from "@/components/skip-links";
import { useRouteAnnouncement } from "@/hooks/use-focus-management";

// Lazy load ALL components for critical performance
const CustomerDashboard = lazy(() => import("@/pages/customer-dashboard"));
const AdminPage = lazy(() => import("@/pages/admin-page"));

// Simple logging for development
const logger = {
  info: (message: string) => {
    if (import.meta.env.DEV) {
      
    }
  }
};

function Navigation() {
  const [location] = useLocation();
  const announceRoute = useRouteAnnouncement();

  // Announce route changes for screen readers
  useEffect(() => {
    const routeNames: Record<string, string> = {
      '/campaigns': 'Campaigns',
      '/': 'Campaigns',
      '/customer': 'Customer Dashboard',
      '/admin': 'Admin Panel'
    };

    const routeName = routeNames[location] || 'Page';
    announceRoute(routeName);
  }, [location, announceRoute]);

  return (
    <header
      id="main-navigation"
      className="fixed top-0 left-0 right-0 z-50 bg-navy/95 backdrop-blur-sm border-b border-accent-blue/10"
      role="banner"
      aria-label="Site header with main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold text-white">
              <Link href="/" aria-label="FYP Media Ltd - Home">
                FYP Media Ltd
              </Link>
            </h1>
            <div className="hidden md:flex items-center space-x-6" role="menubar">
              <Link
                href="/campaigns"
                role="menuitem"
                aria-current={location === "/campaigns" || location === "/" ? "page" : undefined}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-navy ${
                  location === "/campaigns" || location === "/"
                    ? "bg-accent-blue/20 text-accent-blue"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                }`}
              >
                <Calendar className="w-4 h-4" aria-hidden="true" />
                <span>Campaigns</span>
              </Link>
              <Link
                href="/customer"
                role="menuitem"
                aria-current={location === "/customer" ? "page" : undefined}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-navy ${
                  location === "/customer"
                    ? "bg-accent-blue/20 text-accent-blue"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                }`}
              >
                <Users className="w-4 h-4" aria-hidden="true" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/admin"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                  location === "/admin"
                    ? "bg-accent-blue/20 text-accent-blue"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                }`}
              >
                <Bell className="h-4 w-4" />
                <span>Admin</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function App() {
  useEffect(() => {
    // Initialize performance monitoring
    if (import.meta.env.DEV) {
      logger.info('[APP] Application initializing');
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <CartProvider>
            <div className="min-h-screen bg-navy">
              <SkipLinks />
              <Navigation />
              <main id="main-content" className="pt-16" role="main">
                <Switch>
                  <Route path="/checkout" component={() => (
                    <Suspense fallback={
                      <div className="min-h-screen bg-gradient-to-br from-navy via-navy/80 to-navy/60 flex items-center justify-center" role="status" aria-label="Loading booking system">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue" aria-hidden="true"></div>
                        <span className="sr-only">Loading booking system...</span>
                      </div>
                    }>
                      <BookingSystem />
                    </Suspense>
                  )} />
                  <Route path="/campaigns" component={() => (
                    <Suspense fallback={
                      <div className="min-h-screen bg-gradient-to-br from-navy via-navy/80 to-navy/60 flex items-center justify-center" role="status" aria-label="Loading booking system">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue" aria-hidden="true"></div>
                        <span className="sr-only">Loading booking system...</span>
                      </div>
                    }>
                      <BookingSystem />
                    </Suspense>
                  )} />
                  <Route path="/" component={() => (
                    <Suspense fallback={
                      <div className="min-h-screen bg-gradient-to-br from-navy via-navy/80 to-navy/60 flex items-center justify-center" role="status" aria-label="Loading booking system">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue" aria-hidden="true"></div>
                        <span className="sr-only">Loading booking system...</span>
                      </div>
                    }>
                      <BookingSystem />
                    </Suspense>
                  )} />
                  <Route path="/customer" component={() => (
                    <Suspense fallback={
                      <div className="min-h-screen bg-gradient-to-br from-navy via-navy/80 to-navy/60 flex items-center justify-center" role="status" aria-label="Loading customer dashboard">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue" aria-hidden="true"></div>
                        <span className="sr-only">Loading customer dashboard...</span>
                      </div>
                    }>
                      <CustomerDashboard />
                    </Suspense>
                  )} />
                  <Route path="/admin" component={() => (
                    <Suspense fallback={
                      <div className="min-h-screen bg-gradient-to-br from-navy via-navy/80 to-navy/60 flex items-center justify-center" role="status" aria-label="Loading admin panel">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue" aria-hidden="true"></div>
                        <span className="sr-only">Loading admin panel...</span>
                      </div>
                    }>
                      <AdminPage />
                    </Suspense>
                  )} />
                  <Route>
                    <div className="min-h-screen flex items-center justify-center" role="main" aria-labelledby="error-404-title">
                      <div className="text-center">
                        <h1 id="error-404-title" className="text-4xl font-bold text-white mb-4">404</h1>
                        <p className="text-gray-300 mb-8">The page you're looking for could not be found.</p>
                        <Link
                          href="/campaigns"
                          className="inline-block px-6 py-3 text-white rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-navy"
                          style={{ background: 'linear-gradient(90deg, #2bff3e 0%, #00e676 100%)' }}
                          aria-label="Return to campaigns page"
                        >
                          Go to Campaigns
                        </Link>
                      </div>
                    </div>
                  </Route>
                </Switch>
              </main>
              <footer id="footer" className="bg-navy/80 border-t border-accent-blue/10 py-8 mt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                  <p className="text-gray-300">© 2025 SouthCoast ProMotion. All rights reserved.</p>
                </div>
              </footer>
              <Toaster />
            </div>
          </CartProvider>
        </AppProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
