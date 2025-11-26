
// Timeout cleanup utilities available if needed

import { useState, useRef, type MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input, Label } from "@/components/ui/form-inputs";
import { FileText, PenTool, CheckCircle, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ContractSignatureProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: number;
  campaignDetails: {
    campaign: string;
    date: string;
    time: string;
    slots: number;
    price: number;
  };
  customerInfo: {
    name: string;
    email: string;
    company?: string;
  };
  onContractSigned: () => void;
}

export default function ContractSignature({
  isOpen,
  onClose,
  bookingId,
  campaignDetails,
  customerInfo,
  onContractSigned,
}: ContractSignatureProps) {
  const [signatureStep, setSignatureStep] = useState<
    "review" | "sign" | "complete"
  >("review");
  const [isProcessing, setIsProcessing] = useState(false);
  const [signatureData, setSignatureData] = useState("");
  const [signerName, setSignerName] = useState(customerInfo.name);
  const [signerDate, setSignerDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const { toast } = useToast();

  const contractTerms = `
ADVERTISING CAMPAIGN AGREEMENT

This agreement is entered into between SouthCoast ProMotion ("Company") and ${customerInfo.name} ("Client").

CAMPAIGN DETAILS:
- Campaign: ${campaignDetails.campaign}
- Date: ${campaignDetails.date}
- Time: ${campaignDetails.time}
- Slots Booked: ${campaignDetails.slots}
- Total Price: GBP${campaignDetails.price}

TERMS AND CONDITIONS:

1. PAYMENT TERMS
   - Payment is due within 30 days of invoice date
   - Late payments may incur a 1.5% monthly service charge
   - All prices are exclusive of VAT where applicable

2. CAMPAIGN DELIVERY
   - Campaign will run on the specified date and time
   - Client must provide creative materials 48 hours before campaign start
   - Materials must meet technical specifications provided separately

3. CANCELLATION POLICY
   - Cancellations made 7+ days before campaign: Full refund
   - Cancellations made 3-6 days before: 50% refund
   - Cancellations made less than 3 days: No refund

4. LIABILITY
   - Company liability limited to campaign cost
   - Client responsible for content compliance with ASA guidelines
   - Force majeure events may delay campaign without penalty

5. INTELLECTUAL PROPERTY
   - Client retains rights to provided creative materials
   - Company retains rights to campaign performance data
   - Neither party may use the other's trademarks without permission

By signing below, both parties agree to these terms and conditions.
`;

  const startDrawing = (e: MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataURL = canvas.toDataURL();
    setSignatureData(dataURL);
  };

  const submitContract = async () => {
    if (!signatureData) {
      toast({
        title: "Signature Required",
        description: "Please provide your signature before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Submit contract signature
      const response = await fetch(
        `/api/customer/bookings/${bookingId}/contract`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contractSigned: true,
            signatureData,
            signerName,
            signerDate,
            contractData: {
              terms: contractTerms,
              campaignDetails,
              customerInfo,
              signedAt: new Date().toISOString(),
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Contract submission failed");
      }

      setSignatureStep("complete");
      toast({
        title: "Contract Signed Successfully",
        description: "Your digital contract has been recorded securely.",
      });

      setTimeout(() => {
        onContractSigned();
        onClose();
      }, 3000);
    } catch {
      setIsProcessing(false);
      toast({
        title: "Signature Failed",
        description:
          "There was an error submitting your contract. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSignClick = () => {
    saveSignature();
    setSignatureStep("sign");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Digital Contract Signature</span>
          </DialogTitle>
          <DialogDescription>
            Please review and sign your advertising campaign agreement
          </DialogDescription>
        </DialogHeader>

        {signatureStep === "review" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Campaign:</strong> {campaignDetails.campaign}
                  </div>
                  <div>
                    <strong>Date:</strong> {campaignDetails.date}
                  </div>
                  <div>
                    <strong>Time:</strong> {campaignDetails.time}
                  </div>
                  <div>
                    <strong>Slots:</strong> {campaignDetails.slots}
                  </div>
                  <div>
                    <strong>Total Price:</strong> GBP{campaignDetails.price}
                  </div>
                  <div>
                    <strong>Client:</strong> {customerInfo.name}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contract Terms</CardTitle>
                <CardDescription>
                  Please review all terms carefully
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {contractTerms}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSignClick} className="flex-1">
                <PenTool className="h-4 w-4 mr-2" />
                Proceed to Sign
              </Button>
            </div>
          </div>
        )}

        {signatureStep === "sign" && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="signerName">Full Name</Label>
                  <Input
                    id="signerName"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signerDate">Date</Label>
                  <Input
                    id="signerDate"
                    type="date"
                    value={signerDate}
                    onChange={(e) => setSignerDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Digital Signature</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={200}
                    className="w-full h-32 border bg-white cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-gray-600">
                      Sign above using your mouse or touchscreen
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearSignature}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/10 p-4 rounded-lg">
              <p className="text-sm text-blue-400">
                By providing your digital signature, you acknowledge that you
                have read, understood, and agree to be bound by the terms and
                conditions of this contract.
              </p>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setSignatureStep("review")}
                className="flex-1"
              >
                Back to Review
              </Button>
              <Button
                onClick={submitContract}
                disabled={isProcessing || !signerName}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Sign Contract
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {signatureStep === "complete" && (
          <div className="py-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-blue-600 mb-2">
              Contract Signed Successfully!
            </h3>
            <p className="text-gray-600 mb-4">
              Your digital contract has been securely recorded and will be
              processed shortly.
            </p>
            <div className="flex justify-center space-x-2">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download Copy
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
