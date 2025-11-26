import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { createAPIEndpoints } from "@shared/config/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/form-inputs";
import {
  Calendar,
  MapPin,
  CreditCard,
  FileText,
  Upload,
  Download,
} from "lucide-react";
import { formatDate } from "@/shared/utils";
import type { Booking, Campaign } from "@shared/schema";

interface BookingWithCampaign extends Booking {
  campaign?: Campaign;
}

export default function CustomerDashboard() {
  const API_ENDPOINTS = createAPIEndpoints();
  const [customerEmail, setCustomerEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Fetch customer bookings
  const {
    data: bookings = [],
    isLoading,
    error,
  } = useQuery<BookingWithCampaign[]>({
    queryKey: [API_ENDPOINTS.CUSTOMER_BOOKINGS, customerEmail],
    queryFn: async () => {
      const response = await fetch(
        `${API_ENDPOINTS.CUSTOMER_BOOKINGS}/${encodeURIComponent(customerEmail)}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch bookings");
      }
      return response.json();
    },
    enabled: isSubmitted && !!customerEmail,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (customerEmail.trim()) {
      setIsSubmitted(true);
    }
  };

  const getStatusColor = (status: string, paymentStatus?: string) => {
    if (paymentStatus === "paid") return "bg-green-500";
    if (status === "cancelled") return "bg-red-500";
    if (status === "confirmed") return "bg-blue-500";
    return "bg-yellow-500";
  };

  const getStatusText = (status: string, paymentStatus?: string) => {
    if (paymentStatus === "paid") return "Paid & Active";
    if (status === "cancelled") return "Cancelled";
    if (status === "confirmed") return "Confirmed";
    return "Pending";
  };

  if (!isSubmitted) {
    return (
      <div className="min-h-screen bg-navy p-4 sm:p-6 lg:p-8">
        <div className="max-w-md mx-auto pt-16 sm:pt-20">
          <Card className="bg-slate-700/80 backdrop-blur-sm border border-slate-600">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white">
                Customer Dashboard
              </CardTitle>
              <CardDescription className="text-gray-300">
                Enter your email to view your booking history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="bg-slate-700/50 border border-slate-600 text-white placeholder:text-gray-400"
                  required
                />
                <Button
                  type="submit"
                  className="w-full text-white transition-all"
                  style={{ background: 'linear-gradient(90deg, #1e40af 0%, #3b82f6 100%)' }}
                >
                  Access Dashboard
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto pt-6 sm:pt-8">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading your bookings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-navy p-4">
        <div className="max-w-6xl mx-auto pt-8">
          <Card className="bg-red-500/10 border border-red-500/20">
            <CardContent className="pt-6 text-center">
              <p className="text-red-400">
                Error loading bookings. Please try again.
              </p>
              <Button
                onClick={() => setIsSubmitted(false)}
                variant="outline"
                className="mt-4 border-slate-600 text-white hover:bg-slate-700/50"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy p-4">
      <div className="max-w-6xl mx-auto pt-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Customer Dashboard
              </h1>
              <p className="text-white/80">Welcome back, {customerEmail}</p>
            </div>
            <Button
              onClick={() => setIsSubmitted(false)}
              variant="outline"
              className="bg-white/10 border border-accent-blue/30 text-white hover:bg-white/20"
            >
              Change Account
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white/10 backdrop-blur-sm border border-accent-blue/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {bookings.length}
                  </div>
                  <div className="text-gray-300 text-sm">Total Bookings</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm border border-accent-blue/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent-blue">
                    {bookings.filter((b) => b.paymentStatus === "paid").length}
                  </div>
                  <div className="text-gray-300 text-sm">Paid Campaigns</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm border border-accent-blue/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-dark-green">
                    {bookings.filter((b) => b.status === "pending").length}
                  </div>
                  <div className="text-gray-300 text-sm">Pending</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm border border-accent-blue/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent-blue/80">
                    {bookings.filter((b) => b.contractSigned).length}
                  </div>
                  <div className="text-gray-300 text-sm">Contracts Signed</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white mb-4">
            Your Bookings
          </h2>

          {bookings.length === 0 ? (
            <Card className="bg-white/10 backdrop-blur-sm border border-accent-blue/20">
              <CardContent className="pt-6 text-center">
                <p className="text-gray-300">
                  No bookings found for this email address.
                </p>
              </CardContent>
            </Card>
          ) : (
            bookings.map((booking: BookingWithCampaign) => (
              <Card
                key={booking.id}
                className="bg-white/10 backdrop-blur-sm border border-accent-blue/20"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white">
                        Booking #{booking.id}
                      </CardTitle>
                      <CardDescription className="text-white/70 truncate" title={booking.campaign?.campaign || "Campaign Details Loading..."}>
                        {booking.campaign
                          ? booking.campaign.campaign
                          : "Campaign Details Loading..."}
                      </CardDescription>
                    </div>
                    <Badge
                      className={`${getStatusColor(booking.status as string || 'pending', booking.paymentStatus as string || 'pending')} text-white`}
                    >
                      {getStatusText(
                        booking.status as string || 'pending',
                        booking.paymentStatus as string || 'pending',
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center space-x-2 text-white/80">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">
                        {formatDate(booking.createdAt?.toISOString() || "")}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-white/80">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">
                        {booking.slotsRequired} slots
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-white/80">
                      <CreditCard className="h-4 w-4" />
                      <span className="text-sm">
                        {booking.totalPrice
                          ? `GBP ${booking.totalPrice}`
                          : "Price TBD"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-white/80">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">
                        {booking.contractSigned
                          ? "Contract Signed"
                          : "Contract Pending"}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {booking.paymentStatus === "pending" && (
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay Now
                      </Button>
                    )}
                    {!booking.contractSigned &&
                      booking.paymentStatus === "paid" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-accent-blue text-accent-blue hover:bg-accent-blue/10"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Sign Contract
                        </Button>
                      )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Creative
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Invoice
                    </Button>
                  </div>

                  {booking.requirements && (
                    <div className="mt-4 p-3 bg-white/5 rounded-lg">
                      <p className="text-sm text-white/80">
                        <strong>Requirements:</strong> {booking.requirements}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
