import { useState } from "react";
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
import type { UploadedFile, FileUploadConfig } from "@/components/ui/file-upload";
import { FileUpload } from "@/components/ui/file-upload";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CreativeUploadProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: number;
  campaignName: string;
  onUploadSuccess: () => void;
}

export default function CreativeUpload({
  isOpen,
  onClose,
  bookingId,
  campaignName,
  onUploadSuccess,
}: CreativeUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const { toast } = useToast();

  // Configuration for creative file uploads
  const uploadConfig: FileUploadConfig = {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxFiles: 5, // Limit for creative uploads
    acceptedFileTypes: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"], 
      "image/gif": [".gif"],
      "video/mp4": [".mp4"],
      "video/mov": [".mov"],
      "application/pdf": [".pdf"],
      "application/zip": [".zip"],
      "application/x-zip-compressed": [".zip"],
    },
    uploadMode: 'api',
    apiEndpoint: `/api/customer/bookings/${bookingId}/files`,
    additionalData: {
      bookingId: bookingId.toString(),
      campaignName,
    },
  };

  const handleFilesChange = (updatedFiles: UploadedFile[]) => {
    setFiles(updatedFiles);
  };

  const submitFiles = async () => {
    const completedFiles = files.filter(
      (f) => f.status === "completed" || f.status === "uploaded"
    );

    if (completedFiles.length === 0) {
      toast({
        title: "No Files to Submit",
        description: "Please upload at least one file before submitting.",
        variant: "destructive",
      });
      return;
    }

    onUploadSuccess();
    toast({
      title: "Creative Assets Submitted",
      description: `${completedFiles.length} file(s) have been submitted for review.`,
    });

    setTimeout(() => {
      onClose();
      setFiles([]); // Clear files after submission
    }, 1000);
  };

  const canSubmit = files.some(f => f.status === "completed" || f.status === "uploaded");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Upload Creative Assets</span>
          </DialogTitle>
          <DialogDescription>
            Upload your creative materials for {campaignName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Zone */}
          <Card>
            <CardHeader>
              <CardTitle>File Upload</CardTitle>
              <CardDescription>
                Supported formats: Images (JPG, PNG, GIF), Videos (MP4, MOV),
                Documents (PDF), Archives (ZIP)
                <br />
                Maximum file size: 50MB per file, up to 5 files total
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload
                config={uploadConfig}
                onFilesChange={handleFilesChange}
                className="w-full"
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={submitFiles}
              disabled={!canSubmit}
              className="bg-accent-blue hover:bg-accent-blue/90"
            >
              Submit Files ({files.filter(f => f.status === "completed" || f.status === "uploaded").length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
