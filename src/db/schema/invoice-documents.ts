import { sql } from 'drizzle-orm';
import {
  customType,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { users } from './users';

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return 'bytea';
  },
});

export const invoiceDocuments = pgTable(
  'invoice_documents',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    uploadedBy: uuid('uploaded_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    originalFilename: text('original_filename').notNull(),
    mimeType: text('mime_type').notNull(),
    byteSize: integer('byte_size').notNull(),
    content: bytea('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('invoice_documents_uploaded_by_idx').on(table.uploadedBy),
    index('invoice_documents_created_at_idx').on(table.createdAt),
  ],
);
