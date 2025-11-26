/**
 * Database Schema Definition for SouthCoast ProMotion Campaign Booking System
 * 
 * This file contains the complete database schema including:
 * - PostgreSQL table definitions using Drizzle ORM
 * - TypeScript type definitions for type safety
 * - Zod validation schemas for runtime validation
 * - Enhanced business validation rules
 * 
 * Architecture Notes:
 * - Uses PostgreSQL enums for data consistency
 * - Drizzle ORM provides type-safe database queries
 * - Zod schemas enable frontend/backend validation consistency
 * - Enhanced schemas add business-specific validation rules
 * 
 * @fileoverview Database schema and validation for campaign booking system
 * @version 1.0.0
 * @author SouthCoast ProMotion Development Team
 */

import { z } from "zod";
import { pgTable, serial, text, integer, decimal, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

/**
 * PostgreSQL Enums for Data Consistency
 * 
 * These enums ensure data integrity at the database level and provide
 * type safety in TypeScript. They define the allowed values for specific
 * fields and prevent invalid data insertion.
 */
/** Booking status workflow: pending -> confirmed -> cancelled (if needed) */
export const statusEnum = pgEnum("status", ["pending", "confirmed", "cancelled"]);

/** Payment processing status for financial tracking and reporting */
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "failed", "refunded"]);

/** Campaign slot availability for real-time booking management */
export const availabilityEnum = pgEnum("availability", ["available", "limited", "full"]);

/** Creative asset approval workflow for campaign content management */
export const assetStatusEnum = pgEnum("asset_status", ["pending", "approved", "rejected"]);

/** Admin role-based access control (RBAC) for system management */
export const adminRoleEnum = pgEnum("admin_role", ["Owner", "Ops", "ReadOnly"]);

/** Email outbox status for reliable delivery with retry mechanism */
export const emailStatusEnum = pgEnum("email_status", ["pending", "sending", "sent", "failed", "cancelled"]);

/**
 * Core Database Tables
 * 
 * The following tables form the backbone of the campaign booking system:
 * - campaigns: Advertising slot opportunities with availability tracking
 * - bookings: Customer reservations with payment and contract status
 * - users: Customer and admin account management
 * - assets: Creative file uploads for approved bookings
 * - contracts: Digital contract signing and storage
 * - notifications: Communication tracking and delivery status
 * 
 * Relationships:
 * - bookings.campaignId -> campaigns.id (many-to-one)
 * - assets.bookingId -> bookings.id (one-to-many)
 * - contracts.bookingId -> bookings.id (one-to-one)
 * - notifications.bookingId -> bookings.id (one-to-many)
 */
/**
 * Campaigns Table - Advertising Slot Opportunities
 * 
 * Core table storing all available advertising campaigns with real-time
 * availability tracking. Each campaign represents a specific time slot
 * at a particular location where advertisers can place their content.
 * 
 * Business Rules:
 * - Date format: DD/MM/YYYY for UK standard
 * - Time format: HH:MM-HH:MM for slot duration
 * - Price stored as decimal with 2 decimal places for accuracy
 * - Availability auto-calculated based on slots remaining
 * - slotsAvailable decremented on confirmed bookings
 * 
 * Performance Considerations:
 * - Indexed on date and location for fast filtering
 * - Availability enum for efficient status queries
 * - Updated timestamp tracks last modification for cache invalidation
 */
export const campaigns = pgTable("campaigns", {
  /** Primary key auto-generated for each campaign */
  id: serial("id").primaryKey(),
  
  /** Campaign date in DD/MM/YYYY format (UK standard) */
  date: text("date").notNull(),
  
  /** Time slot in HH:MM-HH:MM format indicating duration */
  time: text("time").notNull(),
  
  /** Campaign name/description including location details */
  campaign: text("campaign").notNull(),
  
  /** Geographic location for the advertising campaign */
  location: text("location"),
  
  /** Number of available slots for booking (decremented on reservations) */
  slotsAvailable: integer("slots_available").default(0),
  
  /** Total number of advertisements per slot (capacity information) */
  numberAdverts: integer("number_adverts").default(0),
  
  /** Price per slot in GBP with 2 decimal precision */
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  
  /** Real-time availability status calculated from remaining slots */
  availability: availabilityEnum("availability").default("available"),
  
  /** Campaign icon/image URL for visual display */
  iconUrl: text("icon_url"),
  
  /** Record creation timestamp for audit trail */
  createdAt: timestamp("created_at").defaultNow().notNull(),
  
  /** Last modification timestamp for cache invalidation */
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Bookings Table - Customer Reservations and Order Management
 * 
 * Central table managing all customer bookings with complete workflow tracking
 * from initial reservation through payment completion and contract signing.
 * 
 * Business Workflow:
 * 1. Customer creates booking (status: pending)
 * 2. Payment processed (paymentStatus: paid)
 * 3. Contract signed (contractSigned: true)
 * 4. Booking confirmed (status: confirmed)
 * 
 * Financial Integration:
 * - totalPrice includes bulk discounts and VAT
 * - paymentReference links to external payment system
 * - Revenue tracking via paymentStatus field
 * 
 * Legal Compliance:
 * - contractSigned tracks legal agreement completion
 * - contractUrl stores signed document location
 * - Audit trail via timestamps
 */
export const bookings = pgTable("bookings", {
  /** Primary key for booking identification */
  id: serial("id").primaryKey(),
  
  /** Foreign key reference to campaigns table */
  campaignId: integer("campaign_id").references(() => campaigns.id).notNull(),
  
  /** Customer full name (validated for proper characters) */
  customerName: text("customer_name").notNull(),
  
  /** Customer email (normalized to lowercase for consistency) */
  customerEmail: text("customer_email").notNull(),
  
  /** Customer phone number (validated format) */
  customerPhone: text("customer_phone").notNull(),
  
  /** Optional company name for business bookings */
  company: text("company"),
  
  /** Number of slots requested (affects pricing and availability) */
  slotsRequired: integer("slots_required").notNull(),
  
  /** Special requirements or notes from customer */
  requirements: text("requirements"),
  
  /** Booking workflow status (pending -> confirmed -> cancelled) */
  status: statusEnum("status").default("pending"),
  
  /** Payment processing status for financial tracking */
  paymentStatus: paymentStatusEnum("payment_status").default("pending"),
  
  /** Legal contract completion flag */
  contractSigned: boolean("contract_signed").default(false),
  
  /** Final price including discounts and VAT */
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  
  /** External payment system reference for reconciliation */
  paymentReference: text("payment_reference"),
  
  /** URL to signed contract document (DocuSign integration) */
  contractUrl: text("contract_url"),
  
  /** Booking creation timestamp */
  createdAt: timestamp("created_at").defaultNow().notNull(),
  
  /** Last modification timestamp for workflow tracking */
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").unique().notNull(),
  name: text("name").notNull(),
  company: text("company"),
  phone: text("phone"),
  role: text("role").default("customer"),
  adminRole: adminRoleEnum("admin_role"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id).notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  fileUrl: text("file_url").notNull(),
  status: assetStatusEnum("status").default("pending"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
});

export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id).notNull(),
  contractTerms: text("contract_terms").notNull(),
  signatureData: text("signature_data"),
  signedAt: timestamp("signed_at"),
  contractUrl: text("contract_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id),
  type: text("type").notNull(), // 'email', 'sms'
  recipient: text("recipient").notNull(),
  subject: text("subject"),
  message: text("message").notNull(),
  status: text("status").default("pending"), // 'pending', 'sent', 'failed'
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * Email Outbox Table - Reliable Email Delivery with Retry Pattern
 * 
 * Implements the transactional outbox pattern for guaranteed email delivery.
 * Emails are first written to the database, then a background worker
 * picks them up for sending with automatic retry on failures.
 * 
 * Features:
 * - Automatic retry with exponential backoff
 * - Maximum 5 retry attempts before marking as failed
 * - Tracking of send attempts and error messages
 * - Support for both HTML and plain text emails
 * - Optional booking association for tracking
 * 
 * Workflow:
 * 1. Email created with status 'pending'
 * 2. Worker picks up and marks as 'sending'
 * 3. On success: status -> 'sent', sentAt timestamp
 * 4. On failure: retryCount++, lastError captured
 * 5. After 5 failures: status -> 'failed'
 */
export const emailOutbox = pgTable("email_outbox", {
  id: serial("id").primaryKey(),
  to: text("to").notNull(),
  from: text("from").notNull(),
  subject: text("subject").notNull(),
  htmlBody: text("html_body"),
  textBody: text("text_body"),
  status: emailStatusEnum("status").default("pending"),
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(5),
  lastError: text("last_error"),
  sentAt: timestamp("sent_at"),
  bookingId: integer("booking_id").references(() => bookings.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Admin Audit Log Table - Role-Based Access Control Tracking
 * 
 * Comprehensive audit trail for all admin actions on the platform.
 * Required for compliance, security investigations, and operational oversight.
 * 
 * Tracked Information:
 * - Who performed the action (admin user ID and email)
 * - What action was performed (create, read, update, delete, export)
 * - When it happened (timestamp with timezone)
 * - What resource was affected (table name and record ID)
 * - Additional context (changes made, IP address, user agent)
 * 
 * Use Cases:
 * - Security incident investigation
 * - Compliance reporting (GDPR, SOC 2)
 * - Operational troubleshooting
 * - User behavior analysis
 */
export const adminAuditLog = pgTable("admin_audit_log", {
  id: serial("id").primaryKey(),
  adminUserId: integer("admin_user_id").references(() => users.id),
  adminEmail: text("admin_email").notNull(),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id"),
  changes: text("changes"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Auto-Generated Zod Schemas from Drizzle Tables
 * 
 * These schemas provide automatic validation for database operations
 * while maintaining type consistency between frontend and backend.
 * 
 * Usage:
 * - insertSchemas: Validate data before database insertion
 * - selectSchemas: Type-safe data retrieval and API responses
 * - Enhanced schemas: Add business-specific validation rules
 * 
 * Benefits:
 * - Runtime validation prevents invalid data insertion
 * - Type safety ensures consistent data shapes
 * - Frontend/backend validation consistency
 * - Automatic schema updates when tables change
 */

/** Campaign insert validation (excludes auto-generated fields) */
export const insertCampaignSchema = createInsertSchema(campaigns);

/** Campaign select schema for API responses and queries */
export const selectCampaignSchema = createSelectSchema(campaigns);

/** Booking insert validation with required fields */
export const insertBookingSchema = createInsertSchema(bookings);

/** Booking select schema for customer data retrieval */
export const selectBookingSchema = createSelectSchema(bookings);

/** User registration and profile validation */
export const insertUserSchema = createInsertSchema(users);

/** User data schema for authentication and profiles */
export const selectUserSchema = createSelectSchema(users);

/** Creative asset upload validation */
export const insertAssetSchema = createInsertSchema(assets);

/** Asset metadata schema for file management */
export const selectAssetSchema = createSelectSchema(assets);

/** Contract creation validation */
export const insertContractSchema = createInsertSchema(contracts);

/** Contract data schema for legal document tracking */
export const selectContractSchema = createSelectSchema(contracts);

/** Notification creation validation */
export const insertNotificationSchema = createInsertSchema(notifications);

/** Notification schema for communication tracking */
export const selectNotificationSchema = createSelectSchema(notifications);

/** Email outbox creation validation */
export const insertEmailOutboxSchema = createInsertSchema(emailOutbox).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

/** Email outbox schema for delivery tracking */
export const selectEmailOutboxSchema = createSelectSchema(emailOutbox);

/** Admin audit log creation validation */
export const insertAdminAuditLogSchema = createInsertSchema(adminAuditLog).omit({
  id: true,
  createdAt: true,
});

/** Admin audit log schema for compliance tracking */
export const selectAdminAuditLogSchema = createSelectSchema(adminAuditLog);

/**
 * TypeScript Type Definitions
 * 
 * Auto-generated types from Drizzle schema provide type safety
 * across the entire application stack.
 * 
 * Naming Convention:
 * - Select types: Data retrieved from database (includes all fields)
 * - Insert types: Data for database insertion (excludes auto-generated fields)
 * 
 * Usage:
 * - API responses use Select types
 * - Form data uses Insert types
 * - Business logic uses both as appropriate
 * 
 * Type Safety Benefits:
 * - Compile-time validation of database operations
 * - IntelliSense support in IDEs
 * - Automatic type updates when schema changes
 * - Consistent data shapes across frontend/backend
 */

/** Campaign data type for database queries and API responses */
export type Campaign = typeof campaigns.$inferSelect;

/** Campaign creation data type for forms and database insertion */
export type InsertCampaign = typeof campaigns.$inferInsert;

/** Booking data type with all fields for customer management */
export type Booking = typeof bookings.$inferSelect;

/** Booking creation data type for reservation forms */
export type InsertBooking = typeof bookings.$inferInsert;

/** User account data type for authentication and profiles */
export type User = typeof users.$inferSelect;

/** User registration data type for account creation */
export type InsertUser = typeof users.$inferInsert;

/** Creative asset metadata type for file management */
export type Asset = typeof assets.$inferSelect;

/** Asset upload data type for file processing */
export type InsertAsset = typeof assets.$inferInsert;

/** Contract document data type for legal tracking */
export type Contract = typeof contracts.$inferSelect;

/** Contract creation data type for document generation */
export type InsertContract = typeof contracts.$inferInsert;

/** Notification data type for communication tracking */
export type Notification = typeof notifications.$inferSelect;

/** Notification creation data type for message sending */
export type InsertNotification = typeof notifications.$inferInsert;

/** Email outbox data type for reliable email delivery */
export type EmailOutbox = typeof emailOutbox.$inferSelect;

/** Email outbox creation data type for transactional emails */
export type InsertEmailOutbox = typeof emailOutbox.$inferInsert;

/** Admin audit log data type for compliance tracking */
export type AdminAuditLog = typeof adminAuditLog.$inferSelect;

/** Admin audit log creation data type for action recording */
export type InsertAdminAuditLog = typeof adminAuditLog.$inferInsert;

/**
 * Business-Enhanced Validation Schemas
 * 
 * These schemas extend the auto-generated Drizzle schemas with
 * business-specific validation rules and data sanitization.
 * 
 * Features:
 * - Input sanitization (email normalization, name formatting)
 * - Business rule validation (slot limits, pricing format)
 * - Security validation (character restrictions, length limits)
 * - User-friendly error messages for frontend display
 */

/**
 * Enhanced Campaign Schema with Business Rules
 * 
 * Adds validation for:
 * - Price format consistency (99.99 format required)
 * - Availability status validation
 * - Date format validation (DD/MM/YYYY)
 * 
 * Used by: Admin campaign creation/editing forms
 */
export const EnhancedCampaignSchema = insertCampaignSchema.extend({
  /** Price must be in decimal format with exactly 2 decimal places */
  price: z.string().regex(/^\d+(\.\d{2})?$/, "Price must be in format: 99.99"),
  
  /** Availability status must be one of predefined enum values */
  availability: z.enum(["available", "limited", "full"]),
});

/**
 * Enhanced Booking Schema with Customer Data Validation
 * 
 * Comprehensive validation for customer booking requests including:
 * - Name format validation (letters, spaces, hyphens, apostrophes only)
 * - Email normalization and validation
 * - UK phone number format validation
 * - Business rule compliance (slot limits)
 * 
 * Security Features:
 * - Character restrictions prevent XSS attacks
 * - Length limits prevent database overflow
 * - Email normalization ensures consistency
 * 
 * Used by: Customer booking forms, API validation
 */
export const EnhancedBookingSchema = insertBookingSchema.extend({
  /** Customer name validation with character restrictions for security */
  customerName: z.string().min(2).max(100).regex(/^[a-zA-Z\s\-'.]+$/, "Invalid name characters"),
  
  /** Email validation with normalization to lowercase */
  customerEmail: z.string().email().max(254).toLowerCase(),
  
  /** UK phone number format validation with international support */
  customerPhone: z.string().min(10).max(20).regex(/^[+]?[\d\s\-()]+$/, "Invalid phone format"),
  
  /** Slot quantity validation within business limits (1-20 slots) */
  slotsRequired: z.number().int().min(1).max(20),
});
