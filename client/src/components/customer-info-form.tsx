/**
 * customer-info-form.tsx - Collects customer personal details
 * Refactored for production handover:
 * - Removed debugging output
 * - Replaced all 'any' with 'unknown' (follow-up typing needed)
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Label, Checkbox } from '@/components/ui/form-inputs';
import { ArrowLeft } from 'lucide-react';
import type { UploadedFile, FileUploadConfig } from '@/components/ui/file-upload';
import { FileUpload } from '@/components/ui/file-upload';
import { useCart } from '@/contexts/cart-context';
import { TermsAndConditions } from '@/components/terms-and-conditions';
import { FormField } from '@/components/ui/form-field';
import { calculatePricing, formatCurrency } from '@/shared/utils';

const customerInfoSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerEmail: z.string().email('Please enter a valid email address'),
  customerPhone: z.string().min(10, 'Please enter a valid phone number'),
  company: z.string().optional(),
  requirements: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions to proceed',
  }),
  acceptMarketing: z.boolean().optional(),
});

type CustomerInfoFormData = z.infer<typeof customerInfoSchema>;

interface CustomerInfoFormProps {
  onNext: (customerData: CustomerInfoFormData, files: UploadedFile[]) => void;
  onBack: () => void;
}

export default function CustomerInfoForm({ onNext, onBack }: CustomerInfoFormProps) {
  const { items } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CustomerInfoFormData>({
    resolver: zodResolver(customerInfoSchema),
    defaultValues: {
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      company: '',
      requirements: '',
      acceptTerms: false,
      acceptMarketing: false,
    },
  });

  // File upload configuration for booking form
  const fileUploadConfig: FileUploadConfig = {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxFiles: 10,
    uploadMode: 'simulate', // Just for form collection, not real upload
  };

  const handleFilesChange = (files: UploadedFile[]) => {
    setUploadedFiles(files);
  };

  const onSubmit = async (data: CustomerInfoFormData) => {
    setIsSubmitting(true);
    
    // Announce form submission to screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = 'Processing your information...';
    document.body.appendChild(announcement);
    
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Announce success
      announcement.textContent = 'Information processed successfully. Proceeding to payment...';
      setTimeout(() => document.body.removeChild(announcement), 2000);
      
      onNext(data, uploadedFiles);
    } catch (error) {
      console.error('Error in form submission:', error);
      
      // Announce error
      announcement.setAttribute('aria-live', 'assertive');
      announcement.textContent = 'Error processing information. Please check your details and try again.';
      setTimeout(() => document.body.removeChild(announcement), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Use centralized pricing calculation for consistency
  const pricing = calculatePricing(items);

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
      {/* Header */}
      <section className="flex items-center gap-4 mb-6" aria-labelledby="customer-info-heading">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2"
          aria-label="Go back to shopping cart"
          data-testid="back-to-cart-button"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Cart
        </Button>
        <h1 className="text-2xl font-bold text-white" id="customer-info-heading">Customer Information</h1>
      </section>

      {/* Two-column layout matching preferred design */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column - Order Summary */}
        <aside 
          className="bg-white/10 backdrop-blur-sm border border-accent-blue/20 rounded-lg p-4 sm:p-6 text-white order-2 lg:order-1"
          role="complementary"
          aria-labelledby="order-summary-heading"
          data-testid="order-summary"
        >
          <h2 id="order-summary-heading" className="text-2xl font-semibold mb-4">Order Summary</h2>

          {/* Campaign Items */}
          <div className="space-y-4 mb-6">
            {items.map((item) => (
              <div key={item.campaignId} className="border-b border-white/20 pb-3">
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium truncate" title={item.campaignName}>{item.campaignName}</h3>
                    <p className="text-sm text-gray-300">{item.date} • {item.time}</p>
                    <p className="text-sm text-gray-300">{item.slotsRequired} slot • {item.advertsPerSlot.toLocaleString()} adverts</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-lime-400">{formatCurrency(item.totalPrice)}</p>
                    <p className="text-xs text-gray-400">{formatCurrency(item.pricePerSlot)} per slot</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Breakdown */}
          <div className="space-y-2 border-t border-white/20 pt-4">
            <div className="flex justify-between text-sm">
              <span>Subtotal ({pricing.totalSlots} slots):</span>
              <span>{formatCurrency(pricing.subtotal)}</span>
            </div>
            {pricing.discountPercentage > 0 && (
              <div className="flex justify-between text-sm text-green-400">
                <span>Bulk Discount ({Math.round(pricing.discountPercentage * 100)}%):</span>
                <span>-{formatCurrency(pricing.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>After Discount:</span>
              <span>{formatCurrency(pricing.discountedSubtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>VAT (20%):</span>
              <span>{formatCurrency(pricing.vat)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t border-white/20 pt-2">
              <span>Total Amount</span>
              <span className="text-lime-400">{formatCurrency(pricing.total)}</span>
            </div>
            {pricing.discountPercentage > 0 && (
              <div className="text-xs text-green-400 text-center pt-1">
                You saved {formatCurrency(pricing.discountAmount)}!
                {pricing.totalSlots < 4 && " Add " + (4 - pricing.totalSlots) + " more slots for 15% off"}
                {pricing.totalSlots >= 4 && pricing.totalSlots < 6 && " Add " + (6 - pricing.totalSlots) + " more slots for 20% off"}
              </div>
            )}
          </div>
        </aside>

        {/* Right Column - Customer Information Form */}
        <main 
          className="bg-white/10 backdrop-blur-sm border border-accent-blue/20 rounded-lg p-4 sm:p-6 text-white order-1 lg:order-2"
          role="main"
          aria-labelledby="customer-info-heading"
          data-testid="customer-info-form-container"
        >
          <h2 className="text-2xl font-semibold mb-4">Customer Information</h2>

          <form 
            onSubmit={handleSubmit(onSubmit)} 
            className="space-y-4"
            noValidate
            aria-labelledby="customer-info-heading"
            data-testid="customer-info-form"
          >
            {/* Customer Info Form Fields */}
            {/* Debug form errors */}
            {Object.keys(errors).length > 0 && (
              <div className="bg-red-900/50 border border-red-600 rounded-lg p-3 mb-4">
                <p className="text-red-200 text-sm font-medium mb-2">Please fix the following errors:</p>
                {Object.entries(errors).map(([field, error]) => (
                  <p key={field} className="text-red-300 text-xs">• {field}: {error?.message}</p>
                ))}
              </div>
            )}
            <FormField
              id="customerEmail"
              label="Email Address"
              type="email"
              placeholder="your@email.com"
              required={true}
              error={errors.customerEmail}
              register={register}
            />

            <FormField
              id="customerName"
              label="Full Name"
              placeholder="John Smith"
              required={true}
              error={errors.customerName}
              register={register}
            />

            <FormField
              id="company"
              label="Company"
              placeholder="Your Company Ltd"
              error={errors.company}
              register={register}
            />

            <FormField
              id="customerPhone"
              label="Phone"
              type="tel"
              placeholder="01234 567890"
              required={true}
              error={errors.customerPhone}
              register={register}
            />

            <FormField
              id="requirements"
              label="Special Requirements"
              type="textarea"
              placeholder="Any special requirements for your campaign..."
              rows={3}
              error={errors.requirements}
              register={register}
            />

            {/* Creative Files Upload Section */}
            <div>
              <Label className="block text-sm font-medium mb-2">
                Creative Files (Optional)
              </Label>
              <FileUpload
                config={fileUploadConfig}
                onFilesChange={handleFilesChange}
                className="w-full"
              />
            </div>

            {/* Terms and Conditions Section */}
            <fieldset className="space-y-4 pt-4 border-t border-white/20">
              <legend className="sr-only">Terms and Conditions Agreement</legend>
              <TermsAndConditions 
                showTerms={showTerms}
                onToggle={setShowTerms}
              />

              {/* Expandable Terms Content */}
              {showTerms && (
                <div className="mt-4 pt-4 border-t border-blue-400/20">
                  <div className="bg-white/10 rounded-lg p-4 max-h-96 overflow-y-auto text-sm text-white space-y-4">
                    <div>
                      <h5 className="font-semibold text-blue-300 mb-2">1. Booking Confirmation</h5>
                      <p className="text-white/90 leading-relaxed">
                        All bookings are confirmed upon receipt of full payment. Campaign slots are subject to availability based on selected date and location rules.
                      </p>
                    </div>

                    <div>
                      <h5 className="font-semibold text-blue-300 mb-2">2. Artwork Submission</h5>
                      <p className="text-white/90 leading-relaxed mb-2">
                        Final artwork must be submitted at least 72 hours before the campaign start date. Accepted formats: JPG, PNG, MP4.
                      </p>
                      <p className="text-white/90 leading-relaxed mb-2">
                        For optimal display of your adverts ensure they are supplied as:
                      </p>
                      <ul className="list-disc list-inside text-white/80 ml-4 space-y-1">
                        <li>Image 1 (896x512 Px)</li>
                        <li>Image 2 (512x512 Px)</li>
                      </ul>
                      <p className="text-white/90 leading-relaxed mt-2">
                        We are not responsible for errors or low-quality outputs due to poor resolution or incorrect formatting.
                      </p>
                    </div>

                    <div>
                      <h5 className="font-semibold text-blue-300 mb-2">3. Campaign Changes or Cancellations</h5>
                      <ul className="list-disc list-inside text-white/90 space-y-1 ml-4">
                        <li>Changes allowed up to 5 days before campaign start</li>
                        <li>Cancellations &gt;7 days: 75% refund</li>
                        <li>Cancellations &lt;7 days: No refund</li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-semibold text-blue-300 mb-2">4. Location Availability</h5>
                      <ul className="list-disc list-inside text-white/90 space-y-1 ml-4">
                        <li>1st Week of the month – HASTINGS / BEXHILL</li>
                        <li>2nd Week – EASTBOURNE</li>
                        <li>3rd Week – TUNBRIDGE WELLS / TONBRIDGE</li>
                        <li>Last Week of the month – MAIDSTONE</li>
                        <li>Every Friday & Saturday Nights – BRIGHTON</li>
                      </ul>
                      <p className="text-white/90 leading-relaxed mt-2">
                        Invalid location/date combinations may be adjusted or cancelled.
                      </p>
                    </div>

                    <div>
                      <h5 className="font-semibold text-blue-300 mb-2">5. Operational Conditions</h5>
                      <p className="text-white/90 leading-relaxed">
                        Campaigns are subject to weather, traffic, and mechanical reliability. In case of disruption, a full credit or rebooking will be offered.
                      </p>
                    </div>

                    <div>
                      <h5 className="font-semibold text-blue-300 mb-2">6. Conduct & Content</h5>
                      <p className="text-white/90 leading-relaxed">
                        We reserve the right to reject discriminatory, explicit, political, or harmful content. Final approval lies with FYP Media Ltd.
                      </p>
                    </div>

                    <div>
                      <h5 className="font-semibold text-blue-300 mb-2">7. Liability</h5>
                      <p className="text-white/90 leading-relaxed">
                        FYP Media Ltd is not liable for indirect losses caused by delays or campaign performance.
                      </p>
                    </div>

                    <div>
                      <h5 className="font-semibold text-blue-300 mb-2">8. Acceptance</h5>
                      <p className="text-white/90 leading-relaxed">
                        By submitting this form, you confirm you agree to these terms.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Terms Acceptance Checkbox */}
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="acceptTerms"
                  checked={watch('acceptTerms')}
                  onCheckedChange={(checked) => setValue('acceptTerms', checked as boolean)}
                  className="mt-1 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  aria-invalid={errors.acceptTerms ? true : false}
                  aria-describedby={errors.acceptTerms ? 'accept-terms-error' : 'accept-terms-help'}
                  aria-required="true"
                  data-testid="accept-terms-checkbox"
                />
                <div className="flex-1">
                  <Label htmlFor="acceptTerms" className="text-sm font-medium cursor-pointer" data-testid="accept-terms-label">
                    I have read and accept the SouthCoast ProMotion Campaign Agreement terms above <span aria-label="required" className="text-red-400">*</span>
                  </Label>
                  <p id="accept-terms-help" className="text-xs text-white/60 mt-1">
                    Required: You must accept these terms to proceed with your booking
                  </p>
                  {errors.acceptTerms && (
                    <p 
                      id="accept-terms-error" 
                      className="text-red-400 text-xs mt-1 flex items-center gap-1" 
                      role="alert" 
                      aria-live="polite"
                      data-testid="accept-terms-error"
                    >
                      <span aria-hidden="true">⚠</span>
                      {errors.acceptTerms.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Marketing Communications Opt-in */}
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="acceptMarketing"
                  checked={watch('acceptMarketing')}
                  onCheckedChange={(checked) => setValue('acceptMarketing', checked as boolean)}
                  className="mt-1 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  aria-describedby="marketing-help"
                  data-testid="accept-marketing-checkbox"
                />
                <div className="flex-1">
                  <Label htmlFor="acceptMarketing" className="text-sm cursor-pointer" data-testid="accept-marketing-label">
                    I would like to receive marketing communications about special offers and new campaigns
                  </Label>
                  <p id="marketing-help" className="text-xs text-white/60 mt-1">
                    Optional: You can unsubscribe at any time. We respect your privacy.
                  </p>
                </div>
              </div>
            </fieldset>

            <div className="flex gap-4 pt-4" role="group" aria-label="Form navigation buttons">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="flex-1"
                aria-label="Go back to shopping cart review"
                data-testid="back-button"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={isSubmitting ? 'Processing your information, please wait' : 'Submit customer information and proceed to payment'}
                data-testid="continue-to-payment-button"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" aria-hidden="true"></div>
                    Processing...
                  </>
                ) : (
                  'Continue to Payment'
                )}
              </Button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
