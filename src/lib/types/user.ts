// User domain: the people who use the system. Mirrors the `users` table and
// the `user_role` enum in the database schema.

export type UserRole = 'admin' | 'owner' | 'ap_clerk' | 'approver' | 'employee';

export interface User {
  id: string;
  clerkId: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}
