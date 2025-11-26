/**
 * File Upload Routes - S3 Presigned URL Generation
 * 
 * Secure file upload endpoints using AWS S3 presigned URLs.
 * Files are uploaded directly from client to S3, bypassing
 * the backend server for better performance and scalability.
 * 
 * Features:
 * - Presigned URL generation for client-side uploads
 * - MIME type and file size validation
 * - Private ACL for secure storage
 * - Upload confirmation and tracking
 * - Antivirus scan trigger (stub)
 * 
 * Workflow:
 * 1. Client requests presigned URL with file metadata
 * 2. Server validates file type and size
 * 3. Server generates presigned URL with 5-minute expiry
 * 4. Client uploads directly to S3 using presigned URL
 * 5. Client confirms upload completion
 * 6. Server triggers AV scan (stub) and updates database
 * 
 * @module server/routes/uploads
 */

import { Router } from 'express';
import { s3Service, validateFileUpload } from '../../services/s3.service';
import { logger } from '../logger';

const router = Router();

/**
 * POST /api/uploads/presigned-url
 * 
 * Generate presigned URL for file upload.
 * 
 * Request body:
 * - fileName: string (original filename)
 * - mimeType: string (MIME type)
 * - fileSize: number (file size in bytes)
 * - bookingId?: number (optional booking association)
 * 
 * Response:
 * - presignedUrl: string (URL for client-side upload)
 * - fileKey: string (S3 object key)
 * - expiresIn: number (URL expiration in seconds)
 */
router.post('/presigned-url', validateFileUpload, async (req, res) => {
  try {
    const { fileName, mimeType, fileSize, bookingId } = req.body;

    const result = await s3Service.generatePresignedUrl({
      fileName,
      mimeType,
      fileSize: parseInt(fileSize),
      bookingId: bookingId ? parseInt(bookingId) : undefined,
    });

    res.json({
      success: true,
      ...result,
    });

    logger.info('[UPLOADS] Presigned URL generated', {
      fileName,
      fileKey: result.fileKey,
      bookingId,
    });
  } catch (error) {
    logger.error('[UPLOADS] Failed to generate presigned URL', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate presigned URL',
    });
  }
});

/**
 * POST /api/uploads/confirm
 * 
 * Confirm successful upload to S3.
 * Triggers antivirus scan and updates database.
 * 
 * Request body:
 * - fileKey: string (S3 object key)
 * - bookingId?: number (booking association)
 * 
 * Response:
 * - success: boolean
 * - message: string
 */
router.post('/confirm', async (req, res) => {
  try {
    const { fileKey, bookingId } = req.body;

    if (!fileKey) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: fileKey',
      });
    }

    await s3Service.confirmUpload(
      fileKey,
      bookingId ? parseInt(bookingId) : undefined
    );

    res.json({
      success: true,
      message: 'Upload confirmed successfully',
    });

    logger.info('[UPLOADS] Upload confirmed', {
      fileKey,
      bookingId,
    });
  } catch (error) {
    logger.error('[UPLOADS] Failed to confirm upload', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to confirm upload',
    });
  }
});

/**
 * GET /api/uploads/limits
 * 
 * Get file upload limits and allowed types.
 * Public endpoint for client-side validation.
 * 
 * Response:
 * - maxFileSize: number (in bytes)
 * - allowedMimeTypes: string[] (allowed MIME types)
 */
router.get('/limits', (req, res) => {
  res.json({
    success: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFileSizeMB: 10,
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'video/mp4',
      'video/quicktime',
    ],
  });
});

export default router;
