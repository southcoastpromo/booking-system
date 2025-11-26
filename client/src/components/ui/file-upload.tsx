/**
 * Reusable File Upload Component
 * Consolidates all file upload functionality with configurable options
 */
import { useState, useCallback, type FC, type DragEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, CheckCircle, AlertCircle, Image, Video, FileText, FileIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Shared interface for uploaded files
export interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  status: 'uploading' | 'uploaded' | 'completed' | 'error';
  progress: number;
}

// Configuration options for the file upload component
export interface FileUploadConfig {
  maxFileSize?: number; // in bytes, default 50MB
  maxFiles?: number; // default 10
  acceptedFileTypes?: Record<string, string[]>; // MIME types with extensions
  allowPreview?: boolean; // default true
  uploadMode?: 'simulate' | 'api'; // default 'simulate'
  apiEndpoint?: string; // required if uploadMode is 'api'
  additionalData?: Record<string, any>; // extra data to send with API upload
}

// Props for the FileUpload component
export interface FileUploadProps {
  config?: FileUploadConfig;
  onFilesChange: (files: UploadedFile[]) => void;
  className?: string;
  disabled?: boolean;
}

// Default configuration
const DEFAULT_CONFIG: Required<FileUploadConfig> = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxFiles: 10,
  acceptedFileTypes: {
    'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
    'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt'],
    'application/zip': ['.zip'],
    'application/x-rar-compressed': ['.rar'],
  },
  allowPreview: true,
  uploadMode: 'simulate',
  apiEndpoint: '',
  additionalData: {},
};

export const FileUpload: FC<FileUploadProps> = ({
  config = {},
  onFilesChange,
  className = '',
  disabled = false,
}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [_isUploading, setIsUploading] = useState(false);
  // Note: isUploading is used for future upload state management
  const { toast } = useToast();

  // Get appropriate icon for file type
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (fileType.startsWith('video/')) return <Video className="h-5 w-5" />;
    if (fileType === 'application/pdf') return <FileText className="h-5 w-5" />;
    return <FileIcon className="h-5 w-5" />;
  };

  // Validate file against configuration
  const validateFile = (file: File): string | null => {
    if (file.size > finalConfig.maxFileSize) {
      return `File size must be less than ${Math.round(finalConfig.maxFileSize / (1024 * 1024))}MB`;
    }

    const isValidType = Object.keys(finalConfig.acceptedFileTypes).some(type =>
      file.type.match(type.replace('*', '.*'))
    );

    if (!isValidType) {
      return 'File type not supported';
    }

    return null;
  };

  // Generate preview for image files
  const generatePreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (finalConfig.allowPreview && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  };

  // Simulate upload progress
  const simulateUpload = (fileId: string): Promise<void> => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setUploadedFiles(prev => {
            const updated = prev.map(f =>
              f.id === fileId ? { ...f, status: 'uploaded' as const, progress } : f
            );
            onFilesChange(updated);
            return updated;
          });
          resolve();
        } else {
          setUploadedFiles(prev => {
            const updated = prev.map(f =>
              f.id === fileId ? { ...f, progress } : f
            );
            return updated;
          });
        }
      }, 200);
    });
  };

  // Real API upload
  const apiUpload = async (fileToUpload: UploadedFile): Promise<void> => {
    if (!finalConfig.apiEndpoint) {
      throw new Error('API endpoint not configured');
    }

    const formData = new FormData();
    formData.append('file', fileToUpload.file);
    
    // Add additional data
    Object.entries(finalConfig.additionalData).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });

    try {
      setUploadedFiles(prev => 
        prev.map(f => 
          f.id === fileToUpload.id 
            ? { ...f, status: 'uploading', progress: 0 }
            : f
        )
      );

      const response = await fetch(finalConfig.apiEndpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      setUploadedFiles(prev => {
        const updated = prev.map(f =>
          f.id === fileToUpload.id
            ? { ...f, status: 'completed' as const, progress: 100 }
            : f
        );
        onFilesChange(updated);
        return updated;
      });
    } catch (error) {
      setUploadedFiles(prev => {
        const updated = prev.map(f =>
          f.id === fileToUpload.id
            ? { ...f, status: 'error' as const, progress: 0 }
            : f
        );
        onFilesChange(updated);
        return updated;
      });
      throw error;
    }
  };

  // Handle file selection
  const handleFileSelect = useCallback(async (files: FileList) => {
    if (uploadedFiles.length + files.length > finalConfig.maxFiles) {
      toast({
        title: 'Too many files',
        description: `Maximum ${finalConfig.maxFiles} files allowed`,
        variant: 'destructive',
      });
      return;
    }

    const newFiles: UploadedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validationError = validateFile(file);

      if (validationError) {
        toast({
          title: 'Invalid file',
          description: `${file.name}: ${validationError}`,
          variant: 'destructive',
        });
        continue;
      }

      const fileId = Math.random().toString(36).substring(7);
      const preview = await generatePreview(file);

      newFiles.push({
        id: fileId,
        file,
        preview,
        status: 'uploading',
        progress: 0,
      });
    }

    if (newFiles.length > 0) {
      setUploadedFiles(prev => {
        const updated = [...prev, ...newFiles];
        onFilesChange(updated);
        return updated;
      });

      // Start uploads
      setIsUploading(true);
      for (const newFile of newFiles) {
        try {
          if (finalConfig.uploadMode === 'api') {
            await apiUpload(newFile);
          } else {
            await simulateUpload(newFile.id);
          }
        } catch (error) {
          console.error('Upload failed:', error);
          toast({
            title: 'Upload failed',
            description: `Failed to upload ${newFile.file.name}`,
            variant: 'destructive',
          });
        }
      }
      setIsUploading(false);
    }
  }, [uploadedFiles, finalConfig, onFilesChange, toast]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (!disabled && e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [disabled, handleFileSelect]);

  // Remove file
  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      onFilesChange(updated);
      return updated;
    });
  }, [onFilesChange]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragOver
            ? 'border-blue-400 bg-blue-400/10'
            : 'border-white/30 hover:border-white/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => {
          if (!disabled) {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = Object.keys(finalConfig.acceptedFileTypes).join(',');
            input.onchange = (e) => {
              const files = (e.target as HTMLInputElement).files;
              if (files) handleFileSelect(files);
            };
            input.click();
          }
        }}
      >
        <Upload className="h-8 w-8 text-white/40 mx-auto mb-2" />
        <p className="text-white/60 mb-1">Drag & drop files here</p>
        <p className="text-xs text-white/40">or click to browse</p>
        {uploadedFiles.length > 0 && (
          <p className="text-xs text-green-400 mt-2">
            {uploadedFiles.length} file(s) selected
          </p>
        )}
      </div>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((file) => (
            <div key={file.id} className="flex items-center justify-between bg-white/10 rounded p-3 min-w-0">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="flex-shrink-0">
                  {getFileIcon(file.file.type)}
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-white text-sm truncate overflow-hidden" title={file.file.name}>
                    {file.file.name}
                  </p>
                  <p className="text-white/60 text-xs">
                    {(file.file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  {file.status === 'uploading' && (
                    <div className="w-full bg-white/20 rounded-full h-1 mt-1">
                      <div
                        className="bg-blue-400 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                {file.status === 'uploaded' || file.status === 'completed' ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : file.status === 'error' ? (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                ) : null}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  className="text-red-400 hover:text-red-300 p-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
