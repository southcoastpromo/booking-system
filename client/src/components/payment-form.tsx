/**
 * payment-form.tsx - Captures and submits payment information
 * Refactored for production readiness:
 * - Removed console logging
 * - Replaced unsafe 'any' types with 'unknown'
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CreditCard, Check, Loader2 } from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import { formatCurrency } from '@/shared/utils';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { API_ENDPOINTS } from '@/lib/config';
import { BookingPhase } from '@/contexts/cart-context';

interface PaymentFormProps {
  customerData: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    company?: string;
    requirements?: string;
  };
  uploadedFiles: File[];
  onBack: () => void;
}

export default function PaymentForm({ customerData, uploadedFiles, onBack }: PaymentFormProps) {
  const { items, clearCart, setBookingPhase } = useCart();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank' | 'invoice'>('card');

  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

  const handlePayment = async () => {
    if (items.length === 0) {
      toast({
        title: "No items in cart",
        description: "Please add campaigns to your cart before proceeding.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Prepare booking data for each campaign
      const bookings = items.map(item => ({
        campaignId: item.campaignId,
        customerName: customerData.customerName,
        customerEmail: customerData.customerEmail,
        customerPhone: customerData.customerPhone,
        company: customerData.company || '',
        slotsRequired: item.slotsRequired,
        requirements: customerData.requirements || `Campaign: ${item.campaignName}, Date: ${item.date}, Time: ${item.time}`,
        totalPrice: item.totalPrice.toString(),
        paymentStatus: "pending" as const,
        contractSigned: false
      }));

      // Payment submission in progress

      // Submit each booking individually (since each campaign needs its own booking record)
      const results = [];
      for (const booking of bookings) {
        const response = await apiRequest('POST', API_ENDPOINTS.BOOKINGS, booking);
        const result = await response.json();
        results.push(result);
      }

      // Bookings processed successfully

      // Show success message
      toast({
        title: "Booking Confirmed!",
        description: `${results.length} booking(s) confirmed successfully. Total: ${formatCurrency(totalAmount)}`,
        variant: "default",
      });

      // Clear cart and return to browsing
      clearCart();
      setBookingPhase(BookingPhase.BROWSING);

    } catch (error) {
      // Payment processing error handled
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "An error occurred while processing your booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Customer Info
        </Button>
        <h1 className="text-2xl font-bold text-white">Payment & Confirmation</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Methods */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Payment Method Selection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      paymentMethod === 'card'
                        ? 'border-blue-500 bg-blue-50/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <CreditCard className="h-6 w-6 mx-auto mb-2 text-blue-400" />
                    <div className="text-white font-medium">Credit Card</div>
                    <div className="text-gray-400 text-xs">Visa, MasterCard, Amex</div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('bank')}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      paymentMethod === 'bank'
                        ? 'border-blue-500 bg-blue-50/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="h-6 w-6 mx-auto mb-2 bg-blue-400 rounded"></div>
                    <div className="text-white font-medium">Bank Transfer</div>
                    <div className="text-gray-400 text-xs">Direct bank payment</div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('invoice')}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      paymentMethod === 'invoice'
                        ? 'border-blue-500 bg-blue-50/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="h-6 w-6 mx-auto mb-2 bg-green-400 rounded"></div>
                    <div className="text-white font-medium">Invoice</div>
                    <div className="text-gray-400 text-xs">30-day payment terms</div>
                  </button>
                </div>

                {/* Payment Details */}
                <div className="mt-6">
                  {paymentMethod === 'card' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50/10 rounded-lg border border-blue-500/30">
                        <h4 className="text-blue-400 font-medium mb-2">Secure Card Payment</h4>
                        <p className="text-gray-300 text-sm">
                          Your payment will be processed securely through our payment partner.
                          Card details are encrypted and never stored on our servers.
                        </p>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'bank' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50/10 rounded-lg border border-blue-500/30">
                        <h4 className="text-blue-400 font-medium mb-2">Bank Transfer Details</h4>
                        <div className="text-gray-300 text-sm space-y-1">
                          <div><strong>Account Name:</strong> SouthCoast ProMotion Ltd</div>
                          <div><strong>Sort Code:</strong> 12-34-56</div>
                          <div><strong>Account Number:</strong> 12345678</div>
                          <div><strong>Reference:</strong> Please use your booking reference</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'invoice' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50/10 rounded-lg border border-green-500/30">
                        <h4 className="text-green-400 font-medium mb-2">Invoice Payment</h4>
                        <p className="text-gray-300 text-sm">
                          An invoice will be sent to your email address with 30-day payment terms.
                          Your campaign will be scheduled upon confirmation of this booking.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Button */}
                <div className="mt-8">
                  <Button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg font-medium"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Processing Booking...
                      </>
                    ) : (
                      <>
                        <Check className="h-5 w-5 mr-2" />
                        Confirm Booking - {formatCurrency(totalAmount)}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="bg-gray-800 border-gray-700 sticky top-6">
            <CardHeader>
              <CardTitle className="text-white">Final Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Customer Info */}
                <div className="text-sm">
                  <h4 className="text-white font-medium mb-2">Customer Details</h4>
                  <div className="text-gray-300 space-y-1">
                    <div className="truncate" title={customerData.customerName}>{customerData.customerName}</div>
                    <div className="truncate" title={customerData.customerEmail}>{customerData.customerEmail}</div>
                    <div className="truncate" title={customerData.customerPhone}>{customerData.customerPhone}</div>
                    {customerData.company && <div className="truncate" title={customerData.company}>{customerData.company}</div>}
                  </div>
                </div>

                <hr className="border-gray-600" />

                {/* Campaigns */}
                <div className="space-y-3">
                  <h4 className="text-white font-medium">Campaigns ({items.length})</h4>
                  {items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <div className="text-gray-300 min-w-0 flex-1">
                        <div className="font-medium truncate" title={item.campaignName}>{item.campaignName}</div>
                        <div className="text-xs text-gray-500">
                          {item.date} • {item.slotsRequired} slot{item.slotsRequired > 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="text-white font-medium">
                        {formatCurrency(item.totalPrice)}
                      </div>
                    </div>
                  ))}
                </div>

                <hr className="border-gray-600" />

                {/* Files */}
                {uploadedFiles.length > 0 && (
                  <>
                    <div className="text-sm">
                      <h4 className="text-white font-medium mb-2">
                        Uploaded Files ({uploadedFiles.length})
                      </h4>
                      <div className="text-gray-300 text-xs space-y-1">
                        {uploadedFiles.slice(0, 3).map((file, index) => (
                          <div key={index} className="truncate" title={file.name}>{file.name}</div>
                        ))}
                        {uploadedFiles.length > 3 && (
                          <div>...and {uploadedFiles.length - 3} more</div>
                        )}
                      </div>
                    </div>
                    <hr className="border-gray-600" />
                  </>
                )}

                {/* Total */}
                <div className="flex justify-between font-bold text-white text-lg">
                  <span>Total Amount</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
