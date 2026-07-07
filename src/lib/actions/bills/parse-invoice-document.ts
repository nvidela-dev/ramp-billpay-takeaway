'use server';

import { headers } from 'next/headers';
import { z } from 'zod';

import { assertDatabaseConfigured } from '@/db';
import { getCurrentUser } from '@/lib/auth/current-user';
import { requireRole } from '@/lib/auth/require-role';
import { getBillReferenceData as getBillReferenceDataFromRepo } from '@/lib/repositories/bills';
import { createInvoiceDocument } from '@/lib/repositories/invoice-document.repo';
import {
  detectInvoiceImageMimeType,
  invoiceDocumentContentToBytes,
} from '@/lib/invoice-documents/bytes';
import {
  normalizeInvoiceExtraction,
  validateInvoiceExtractionResult,
} from '@/lib/invoice-parsing/schema';
import { parseInvoiceWithOpenAi } from '@/lib/invoice-parsing/openai';
import type { CreateBillInput } from '@/lib/types/bill/inputs';
import type { ActionResult } from '@/lib/types/common';
import type { LlmExtractionResult } from '@/lib/types/llm-extraction';

import { toBillActionError } from './errors';
import { BILL_EDITOR_ROLES } from './permissions';

const acceptedInvoiceMimeTypes = new Set(['image/jpeg', 'image/png']);
const invoiceFileSchema = z.instanceof(File);

function isLocalHost(host: string): boolean {
  return host.startsWith('localhost:')
    || host.startsWith('127.0.0.1:')
    || host.startsWith('[::1]:');
}

async function buildDocumentImageUrl(document: {
  id: string;
  mimeType: string;
  content: unknown;
}): Promise<string> {
  const requestHeaders = await headers();
  const host = requestHeaders.get('host') ?? '';

  if (!host || isLocalHost(host)) {
    const content = invoiceDocumentContentToBytes(document.content);
    const base64 = Buffer.from(content).toString('base64');
    return `data:${document.mimeType};base64,${base64}`;
  }

  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'https';
  return `${protocol}://${host}/api/invoice-documents/${document.id}/image`;
}

export async function parseInvoiceDocument(
  invoice: File,
): Promise<ActionResult<LlmExtractionResult<CreateBillInput>>> {
  try {
    assertDatabaseConfigured();
    const actor = await getCurrentUser();
    requireRole(actor, BILL_EDITOR_ROLES);

    const file = invoiceFileSchema.parse(invoice);
    const content = Buffer.from(await file.arrayBuffer());
    const mimeType = detectInvoiceImageMimeType(content);
    if (!mimeType || !acceptedInvoiceMimeTypes.has(mimeType)) {
      throw new z.ZodError([{
        code: z.ZodIssueCode.custom,
        message: 'Invoice upload must be a valid JPG or PNG image.',
        path: ['invoice'],
      }]);
    }

    const document = await createInvoiceDocument({
      originalFilename: file.name || 'invoice',
      mimeType,
      byteSize: content.byteLength,
      content,
    }, actor);
    const options = await getBillReferenceDataFromRepo();
    const raw = await parseInvoiceWithOpenAi({
      imageUrl: await buildDocumentImageUrl(document),
      options: {
        vendors: options.vendors,
        categories: options.categories,
      },
    });
    const result = normalizeInvoiceExtraction(raw);

    return {
      ok: true,
      data: validateInvoiceExtractionResult(result),
    };
  } catch (error) {
    return toBillActionError(error, 'parse invoice document');
  }
}
