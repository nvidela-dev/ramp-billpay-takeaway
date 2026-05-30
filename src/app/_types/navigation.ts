// Navigation primitives: shapes for the sidebar entries and the surface
// (tab-bar) navigation inside each workspace. The concrete tab values for
// the bills and payments workspaces live here so the router-aware tab
// helpers can use them as a union.

export interface NavigationItem {
  href: string;
  label: string;
  description: string;
  icon?: 'receipt' | 'credit-card';
}

export interface SurfaceTab {
  value: string;
  label: string;
  href: string;
  description: string;
}

export type BillTab = 'overview' | 'drafts' | 'approvals' | 'payment';

export type PaymentTab = 'overview' | 'needs_review' | 'pending' | 'history';
