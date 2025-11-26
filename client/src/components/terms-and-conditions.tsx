/**
 * Terms and Conditions Component
 * Extracted from customer-info-form for reusability and better organization
 */
import { ChevronDown, ChevronUp } from 'lucide-react';

interface TermsAndConditionsProps {
  showTerms: boolean;
  onToggle: (show: boolean) => void;
  className?: string;
}

export function TermsAndConditions({ showTerms, onToggle, className = "" }: TermsAndConditionsProps) {
  const contentId = "terms-content";
  const buttonId = "terms-toggle";
  
  return (
    <div className={`bg-blue-900/20 border border-blue-400/30 rounded-lg p-4 ${className}`} role="region" aria-labelledby={buttonId}>
      <button
        id={buttonId}
        type="button"
        onClick={() => onToggle(!showTerms)}
        className="flex items-center justify-between w-full text-left focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-blue-900 rounded-md p-2 -m-2 transition-all hover:bg-blue-800/30"
        aria-expanded={showTerms}
        aria-controls={contentId}
        aria-label={`${showTerms ? 'Collapse' : 'Expand'} terms and conditions`}
        data-testid="terms-toggle-button"
      >
        <div>
          <h4 className="text-sm font-semibold text-blue-300 mb-1">
            SouthCoast ProMotion Campaign Agreement
          </h4>
          <p className="text-xs text-blue-200/80" id="terms-description">
            Click to {showTerms ? 'hide' : 'view'} full terms and conditions
          </p>
        </div>
        <span aria-hidden="true">
          {showTerms ? (
            <ChevronUp className="h-5 w-5 text-blue-300" />
          ) : (
            <ChevronDown className="h-5 w-5 text-blue-300" />
          )}
        </span>
      </button>

      {/* Expandable Terms Content */}
      {showTerms && (
        <div 
          id={contentId}
          className="mt-4 pt-4 border-t border-blue-400/20"
          role="region" 
          aria-labelledby={buttonId}
          data-testid="terms-content"
        >
          <div className="bg-white/10 rounded-lg p-4 max-h-96 overflow-y-auto text-sm text-white space-y-4 focus:outline-none focus:ring-2 focus:ring-accent-blue" tabIndex={0} role="article" aria-label="Terms and conditions full text">
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
    </div>
  );
}
