// Bill domain: the central record that moves through the bill_status state
// machine (draft → awaiting_approval → approved → scheduled → initiated →
// paid, plus rejected / payment_failed / archived). Mirrors the `bills`,
// `bill_line_items`, and `bill_activity_log` tables in the database schema.

import type { Category } from './category';
import type { PaymentMethodType, Payment } from './payment';
import type { User } from './user';
import type { Vendor } from './vendor';

export type BillStatus = | 'draft'
  | 'awaiting_approval'
  | 'approved'
  | 'scheduled'
  | 'initiated'
  | 'paid'
  | 'archived'
  | 'rejected'
  | 'payment_failed';

export interface Bill {
  id: string;
  vendorId: string;
  createdBy: string;
  status: BillStatus;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  dueDate: string | null;
  amount: string;
  currency: string;
  description: string | null;
  invoiceUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillLineItem {
  id: string;
  billId: string;
  description: string | null;
  amount: string;
  categoryId: string | null;
  sortOrder: number;
}

export interface BillActivityLog {
  id: string;
  billId: string;
  actorId: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

// ---- Composite (joined) views ----

export interface BillWithRelations extends Bill {
  vendor: Vendor;
  creator: User;
  lineItems: BillLineItem[];
  payments: Payment[];
}

export interface DraftBillListItem extends Bill {
  vendor: Pick<Vendor, 'id' | 'name' | 'email' | 'ownerId'>;
  creator: Pick<User, 'id' | 'email' | 'fullName' | 'role'>;
  lineItems: (BillLineItem & { category: Category | null })[];
  lineItemCount: number;
}

export interface BillFormOptions {
  vendors: Pick<Vendor, 'id' | 'name' | 'email' | 'ownerId'>[];
  categories: Pick<Category, 'id' | 'name'>[];
}

// ---- Server action inputs ----

export interface CreateBillInput {
  vendorId: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  amount: string;
  currency?: string;
  description?: string;
  invoiceUrl?: string;
  lineItems: {
    description?: string;
    amount: string;
    categoryId?: string;
  }[];
}

export interface UpdateBillInput {
  id: string;
  expectedUpdatedAt?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  amount?: string;
  currency?: string;
  description?: string;
  invoiceUrl?: string;
  lineItems?: {
    id?: string;
    description?: string;
    amount: string;
    categoryId?: string;
  }[];
}

export interface BulkEditBillsInput {
  billIds: string[];
  dueDate?: string;
  invoiceDate?: string;
  amount?: string;
  description?: string;
  categoryId?: string;
}

export interface ApproveRejectInput {
  billId: string;
  note?: string;
}

// ---- Filters (bills workspace) ----

export interface BillFilters {
  search?: string;
  vendorId?: string;
  vendorOwnerId?: string;
  status?: BillStatus[];
  isUnscheduled?: boolean;
  amountMin?: number;
  amountMax?: number;
  paymentMethod?: PaymentMethodType;
  categoryId?: string;
  excludeCategoryId?: string;
  invoiceDateFrom?: string;
  invoiceDateTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
}

// ---- State machine ----

export type BillActionType = | 'submit_for_approval'
  | 'approve'
  | 'reject'
  | 'schedule_payment'
  | 'initiate_payment'
  | 'mark_as_paid'
  | 'cancel_payment'
  | 'retry_payment'
  | 'archive'
  | 'unschedule'
  | 'delete';
