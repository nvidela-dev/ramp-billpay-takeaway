// Category domain: classification labels attached to bill line items.
// Mirrors the `categories` table in the database schema.

export interface Category {
  id: string;
  name: string;
  createdAt: Date;
}
