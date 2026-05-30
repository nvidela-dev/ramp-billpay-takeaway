// Payment domain: payment records produced once a bill is approved and
// scheduled. Mirrors the `payments` table plus the `payment_method_type`
// and `payment_status` enums in the database schema.

import type { Bill } from './bill';
import type { User } from './user';
import type { Vendor } from './vendor';

export type PaymentMethodType = 'ach' | 'wire' | 'check' | 'card';

export type PaymentStatus = | 'pending'
  | 'scheduled'
  | 'initiated'
  | 'in_transit'
  | 'paid'
  | 'failed'
  | 'cancelled';

export interface Payment {
  id: string;
  billId: string;
  createdBy: string;
  amount: string;
  paymentMethod: PaymentMethodType;
  status: PaymentStatus;
  scheduledDate: string | null;
  initiatedDate: Date | null;
  arrivalDate: string | null;
  cancelledAt: Date | null;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ---- Composite (joined) views ----

export interface PaymentWithRelations extends Payment {
  bill: Bill & { vendor: Vendor };
  creator: User;
}

// ---- Server action inputs ----

export interface SchedulePaymentInput {
  billId: string;
  paymentMethod: PaymentMethodType;
  scheduledDate: string;
}

// ---- Filters (payments workspace) ----

export interface PaymentFilters {
  search?: string;
  vendorId?: string;
  status?: PaymentStatus[];
  amountMin?: number;
  amountMax?: number;
  paymentMethod?: PaymentMethodType;
  arrivalDateFrom?: string;
  arrivalDateTo?: string;
  paymentDateFrom?: string;
  paymentDateTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
}
