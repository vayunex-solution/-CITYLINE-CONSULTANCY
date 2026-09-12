/**
 * CITYLINE CONSULTANCY — Common Business Enums & Primitives
 * Foundational status definitions conforming to Phase 0 Scope Lock.
 */

export type EnquiryType = 'visa' | 'business_setup' | 'general_contact';

export type EnquiryStatus = 
  | 'new'
  | 'in_progress'
  | 'contacted'
  | 'completed'
  | 'archived';

export type JobStatus = 
  | 'draft'
  | 'active'
  | 'paused'
  | 'closed'
  | 'archived';

export type ApplicationStatus = 
  | 'new'
  | 'reviewed'
  | 'shortlisted'
  | 'rejected'
  | 'hired';

export type NotificationStatus = 
  | 'pending'
  | 'processing'
  | 'sent'
  | 'failed'
  | 'exhausted';

export type DocumentRetentionStatus = 
  | 'active'
  | 'archived'
  | 'purged';

export type AdminRole = 
  | 'super_admin'
  | 'admin_operator';
