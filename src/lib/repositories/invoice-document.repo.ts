import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { invoiceDocuments } from '@/db/schema';
import { createUuid } from '@/lib/id';
import type { User } from '@/lib/types/user';

export interface CreateInvoiceDocumentRecord {
  originalFilename: string;
  mimeType: string;
  byteSize: number;
  content: Buffer;
}

export interface InvoiceDocumentRecord extends CreateInvoiceDocumentRecord {
  id: string;
  uploadedBy: string;
  createdAt: Date;
}

export async function createInvoiceDocument(
  input: CreateInvoiceDocumentRecord,
  actor: User,
): Promise<InvoiceDocumentRecord> {
  const [document] = await db
    .insert(invoiceDocuments)
    .values({
      id: createUuid(),
      uploadedBy: actor.id,
      originalFilename: input.originalFilename,
      mimeType: input.mimeType,
      byteSize: input.byteSize,
      content: input.content,
    })
    .returning();

  if (!document) {
    throw new Error('Invoice document could not be stored.');
  }

  return document;
}

export async function getInvoiceDocument(
  id: string,
): Promise<InvoiceDocumentRecord | null> {
  const [document] = await db
    .select()
    .from(invoiceDocuments)
    .where(eq(invoiceDocuments.id, id))
    .limit(1);

  return document ?? null;
}
