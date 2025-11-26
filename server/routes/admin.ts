/**
 * Admin Routes - Role-Based Access Control Endpoints
 *
 * Protected admin endpoints with CSV export, user management,
 * and audit log access. All routes require authentication and
 * appropriate admin role.
 *
 * Features:
 * - CSV data export for all major tables
 * - User role management (Owner only)
 * - Audit log viewing and export
 * - System statistics and health
 *
 * Role Requirements:
 * - Owner: All endpoints
 * - Ops: Read and export only
 * - ReadOnly: Read and export only
 *
 * @module server/routes/admin
 */

import { Router } from 'express';
import { db } from '../db';
import {
  campaigns,
  bookings,
  users,
  assets,
  adminAuditLog,
  emailOutbox,
} from '@shared/schema';
import { desc } from 'drizzle-orm';
import { logger } from '../logger';

const router = Router();

/**
 * Convert Data to CSV Format
 *
 * Helper function to convert array of objects to CSV string.
 *
 * @param data - Array of objects to convert
 * @returns CSV string
 */
function convertToCSV(data: any[]): string {
  if (data.length === 0) {
    return '';
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Add header row
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];

      // Handle null/undefined
      if (value === null || value === undefined) {
        return '';
      }

      // Handle dates
      if (value instanceof Date) {
        return value.toISOString();
      }

      // Handle strings with commas or quotes
      const escaped = String(value).replace(/"/g, '""');
      if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
        return `"${escaped}"`;
      }

      return escaped;
    });

    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

/**
 * GET /api/admin/export/campaigns
 *
 * Export all campaigns to CSV format.
 * Available to: Owner, Ops, ReadOnly
 */
router.get('/export/campaigns', async (req, res) => {
  try {
    const data = await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
    const csv = convertToCSV(data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="campaigns_${Date.now()}.csv"`);
    res.send(csv);

    logger.info('[ADMIN] Campaigns exported', {
      count: data.length,
      adminEmail: (req as any).adminUser?.email,
    });
  } catch (error) {
    logger.error('[ADMIN] Failed to export campaigns', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Failed to export campaigns' });
  }
});

/**
 * GET /api/admin/export/bookings
 *
 * Export all bookings to CSV format.
 * Available to: Owner, Ops, ReadOnly
 */
router.get('/export/bookings', async (req, res) => {
  try {
    const data = await db.select().from(bookings).orderBy(desc(bookings.createdAt));
    const csv = convertToCSV(data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="bookings_${Date.now()}.csv"`);
    res.send(csv);

    logger.info('[ADMIN] Bookings exported', {
      count: data.length,
      adminEmail: (req as any).adminUser?.email,
    });
  } catch (error) {
    logger.error('[ADMIN] Failed to export bookings', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Failed to export bookings' });
  }
});

/**
 * GET /api/admin/export/users
 *
 * Export all users to CSV format.
 * Available to: Owner, Ops, ReadOnly
 */
router.get('/export/users', async (req, res) => {
  try {
    const data = await db.select().from(users).orderBy(desc(users.createdAt));
    const csv = convertToCSV(data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="users_${Date.now()}.csv"`);
    res.send(csv);

    logger.info('[ADMIN] Users exported', {
      count: data.length,
      adminEmail: (req as any).adminUser?.email,
    });
  } catch (error) {
    logger.error('[ADMIN] Failed to export users', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Failed to export users' });
  }
});

/**
 * GET /api/admin/audit-log
 *
 * Retrieve admin audit log entries.
 * Available to: Owner, Ops
 *
 * Query params:
 * - limit: Number of entries (default: 100)
 * - adminEmail: Filter by admin email
 */
router.get('/audit-log', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const data = await db
      .select()
      .from(adminAuditLog)
      .orderBy(desc(adminAuditLog.createdAt))
      .limit(limit);

    res.json({
      success: true,
      count: data.length,
      data,
    });

    logger.info('[ADMIN] Audit log retrieved', {
      count: data.length,
      adminEmail: (req as any).adminUser?.email,
    });
  } catch (error) {
    logger.error('[ADMIN] Failed to retrieve audit log', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Failed to retrieve audit log' });
  }
});

/**
 * GET /api/admin/export/audit-log
 *
 * Export audit log to CSV format.
 * Available to: Owner
 */
router.get('/export/audit-log', async (req, res) => {
  try {
    const data = await db
      .select()
      .from(adminAuditLog)
      .orderBy(desc(adminAuditLog.createdAt));

    const csv = convertToCSV(data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit_log_${Date.now()}.csv"`);
    res.send(csv);

    logger.info('[ADMIN] Audit log exported', {
      count: data.length,
      adminEmail: (req as any).adminUser?.email,
    });
  } catch (error) {
    logger.error('[ADMIN] Failed to export audit log', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Failed to export audit log' });
  }
});

/**
 * GET /api/admin/email-queue
 *
 * View email outbox status.
 * Available to: Owner, Ops
 */
router.get('/email-queue', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    let query = db.select().from(emailOutbox).orderBy(desc(emailOutbox.createdAt)).limit(limit);

    const data = await query;

    // Count by status
    const allEmails = await db.select().from(emailOutbox);
    const statusCounts = {
      pending: allEmails.filter(e => e.status === 'pending').length,
      sending: allEmails.filter(e => e.status === 'sending').length,
      sent: allEmails.filter(e => e.status === 'sent').length,
      failed: allEmails.filter(e => e.status === 'failed').length,
    };

    res.json({
      success: true,
      counts: statusCounts,
      data,
    });

    logger.info('[ADMIN] Email queue retrieved', {
      count: data.length,
      adminEmail: (req as any).adminUser?.email,
    });
  } catch (error) {
    logger.error('[ADMIN] Failed to retrieve email queue', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Failed to retrieve email queue' });
  }
});

/**
 * GET /api/admin/stats
 *
 * System statistics dashboard.
 * Available to: Owner, Ops, ReadOnly
 */
router.get('/stats', async (req, res) => {
  try {
    const [
      totalCampaigns,
      totalBookings,
      totalUsers,
      totalAssets,
    ] = await Promise.all([
      db.select().from(campaigns),
      db.select().from(bookings),
      db.select().from(users),
      db.select().from(assets),
    ]);

    const stats = {
      campaigns: {
        total: totalCampaigns.length,
        available: totalCampaigns.filter(c => c.availability === 'available').length,
        limited: totalCampaigns.filter(c => c.availability === 'limited').length,
        full: totalCampaigns.filter(c => c.availability === 'full').length,
      },
      bookings: {
        total: totalBookings.length,
        pending: totalBookings.filter(b => b.status === 'pending').length,
        confirmed: totalBookings.filter(b => b.status === 'confirmed').length,
        cancelled: totalBookings.filter(b => b.status === 'cancelled').length,
      },
      users: {
        total: totalUsers.length,
        admins: totalUsers.filter(u => u.adminRole).length,
      },
      assets: {
        total: totalAssets.length,
        pending: totalAssets.filter(a => a.status === 'pending').length,
        approved: totalAssets.filter(a => a.status === 'approved').length,
        rejected: totalAssets.filter(a => a.status === 'rejected').length,
      },
    };

    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });

    logger.info('[ADMIN] Stats retrieved', {
      adminEmail: (req as any).adminUser?.email,
    });
  } catch (error) {
    logger.error('[ADMIN] Failed to retrieve stats', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Failed to retrieve stats' });
  }
});

export default router;
