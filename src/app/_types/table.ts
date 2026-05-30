// Table shell primitives: column descriptors, row actions, and the
// placeholder-table state used by surfaces that are not yet wired to live
// data. These are UI contracts only — repository row shapes live in
// @/lib/types.

import type { SurfaceTone } from './style';

export interface TableColumnDescriptor {
  id: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  isSortable?: boolean;
  isConfigurable?: boolean;
}

export interface RowActionDescriptor {
  id: string;
  label: string;
  tone?: SurfaceTone;
  isDestructive?: boolean;
}

export interface BulkActionDescriptor extends RowActionDescriptor {
  requiresSelection: true;
}

export interface PlaceholderTableState {
  title: string;
  description: string;
  columns: readonly TableColumnDescriptor[];
  emptyMessage: string;
  actions?: readonly RowActionDescriptor[];
  bulkActions?: readonly BulkActionDescriptor[];
}
