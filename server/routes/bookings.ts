/**
 * Booking Routes
 * Extracted from bloated routes.ts for better organization
 */

import type { Request, Response } from 'express';
import { Router } from 'express';
import { BookingService } from '../../services/bookingService';
import { storage } from '../storage';
import { logger } from '../logger';
import { monitoring } from '../monitoring';
import { insertBookingSchema } from '../../shared/schema';
import { validateData } from '../../shared/validation';
import { requireApiKey } from '../middleware/auth';
import { AuthService } from '../../services/authService';

const router = Router();

import { sendErrorResponse } from '../utils/response-helpers';

// Broadcast function for real-time updates
const broadcastCampaignUpdate = (_type: "booking" | "availability", _data: {
  campaignId: number;
  bookingId?: number;
  slotsBooked?: number;
}) => {
  // WebSocket broadcast logic would go here
  // For now, just log the update
  // WebSocket broadcast logged via monitoring system
};

/**
 * Create New Booking
 */
router.post("/", requireApiKey, async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    // Enhanced input validation with proper error handling
    if (!req.body || typeof req.body !== 'object') {
      monitoring.trackRequest(req.method, req.path, 400, Date.now() - startTime);
      return sendErrorResponse(res, 400, 'Invalid request body');
    }

    // Validate required fields before schema validation
    const requiredFields = ['customerName', 'customerEmail', 'customerPhone', 'campaignId', 'slotsRequired'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      monitoring.trackRequest(req.method, req.path, 422, Date.now() - startTime);
      return sendErrorResponse(res, 422, `Missing required fields: ${missingFields.join(', ')}`);
    }

    // Enhanced schema validation with detailed error messages
    let validationResult;
    try {
      validationResult = validateData(insertBookingSchema, req.body);
    } catch (validationError) {
      monitoring.trackRequest(req.method, req.path, 422, Date.now() - startTime);
      monitoring.trackBookingFailure('validation_error', {
        error: validationError instanceof Error ? validationError.message : 'Unknown validation error',
        body: req.body
      });

      await logger.warn('Booking validation failed', {
        error: validationError instanceof Error ? validationError.message : 'Unknown validation error',
        body: req.body,
        ip: req.ip
      });

      return sendErrorResponse(res, 422, `Validation failed: ${validationError instanceof Error ? validationError.message : 'Invalid data'}`);
    }

    const booking = await BookingService.createBooking({
      campaignId: validationResult.campaignId,
      name: req.body.customerName,
      email: req.body.customerEmail,
      phone: req.body.customerPhone,
      company: validationResult.company || undefined,
      slotsRequired: validationResult.slotsRequired,
      requirements: validationResult.requirements || undefined,
    });

    // Broadcast real-time update
    broadcastCampaignUpdate("booking", {
      campaignId: booking.campaignId,
      bookingId: booking.id,
      slotsBooked: booking.slotsRequired,
    });

    // Track analytics
    await storage.trackAnalyticsEvent('booking_created', {
      bookingId: booking.id,
      campaignId: booking.campaignId,
      slotsRequired: booking.slotsRequired,
    });

    const responseTime = Date.now() - startTime;
    monitoring.trackRequest(req.method, req.path, 201, responseTime);
    monitoring.trackBookingCreated(booking.id, booking.campaignId);

    await logger.info('Booking created successfully', {
      bookingId: booking.id,
      campaignId: booking.campaignId,
      email: booking.customerEmail,
    });

    res.status(201).json({
      success: true,
      booking,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;

    await logger.error('Failed to create booking', {
      error: error instanceof Error ? error.message : 'Unknown error',
      body: req.body
    });

    monitoring.trackRequest(req.method, req.path, 500, responseTime);
    monitoring.trackBookingFailure('server_error', { error: error instanceof Error ? error.message : 'Unknown error' });

    return sendErrorResponse(res, 500, 'Failed to create booking');
  }
});

/**
 * Get Customer Bookings by Email
 */
router.get("/customer/:email", async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const { email } = req.params;

    if (!email || !email.includes('@')) {
      monitoring.trackRequest(req.method, req.path, 400, Date.now() - startTime);
      return sendErrorResponse(res, 400, 'Valid email address required');
    }

    // Development mode: Use demo service
    if (process.env.NODE_ENV === 'development' && !req.query.real) {
      const { DemoAnalyticsService } = await import('../../services/demoAnalyticsService');
      const demoBookings = DemoAnalyticsService.generateDemoBookings(email);

      const responseTime = Date.now() - startTime;
      monitoring.trackRequest(req.method, req.path, 200, responseTime);

      return res.json({
        bookings: demoBookings,
        count: demoBookings.length,
        timestamp: new Date().toISOString(),
        mode: 'development_demo'
      });
    }

    // Production mode: Use real data
    const bookings = await BookingService.getBookingsByCustomerEmail(email);

    const responseTime = Date.now() - startTime;
    monitoring.trackRequest(req.method, req.path, 200, responseTime);

    res.json({
      bookings,
      count: bookings.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;

    await logger.error('Failed to get customer bookings', {
      email: req.params.email,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    monitoring.trackRequest(req.method, req.path, 500, responseTime);

    return sendErrorResponse(res, 500, 'Failed to retrieve bookings');
  }
});

/**
 * Update Booking Payment Status
 */
router.post("/:id/payment", AuthService.requireAuth, AuthService.validateCSRF, async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const bookingId = parseInt(req.params.id, 10);
    const { paymentStatus, paymentReference } = req.body;

    if (isNaN(bookingId)) {
      monitoring.trackRequest(req.method, req.path, 400, Date.now() - startTime);
      return sendErrorResponse(res, 400, 'Invalid booking ID');
    }

    await BookingService.updateBookingPayment(bookingId, paymentStatus, paymentReference);

    const responseTime = Date.now() - startTime;
    monitoring.trackRequest(req.method, req.path, 200, responseTime);

    res.json({
      success: true,
      bookingId,
      paymentStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;

    await logger.error('Failed to update booking payment', {
      bookingId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    monitoring.trackRequest(req.method, req.path, 500, responseTime);
    monitoring.trackPaymentFailure(parseInt(req.params.id) || 0, error instanceof Error ? error.message : 'Unknown error');

    return sendErrorResponse(res, 500, 'Failed to update payment status');
  }
});

/**
 * Update Booking Contract Status
 */
router.post("/:id/contract", AuthService.requireAuth, AuthService.validateCSRF, async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const bookingId = parseInt(req.params.id, 10);
    const { contractSigned, signatureData } = req.body;

    if (isNaN(bookingId)) {
      monitoring.trackRequest(req.method, req.path, 400, Date.now() - startTime);
      return sendErrorResponse(res, 400, 'Invalid booking ID');
    }

    await BookingService.updateBookingContract(bookingId, contractSigned, signatureData);

    const responseTime = Date.now() - startTime;
    monitoring.trackRequest(req.method, req.path, 200, responseTime);

    res.json({
      success: true,
      bookingId,
      contractSigned,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;

    await logger.error('Failed to update booking contract', {
      bookingId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    monitoring.trackRequest(req.method, req.path, 500, responseTime);

    return sendErrorResponse(res, 500, 'Failed to update contract status');
  }
});

export default router;
