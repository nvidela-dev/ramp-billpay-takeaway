import { z } from 'zod';

import { createBillSchema } from '@/lib/validators/bill.schemas';
import { uuidSchema } from '@/lib/validators/shared';
import type { CreateBillInput } from '@/lib/types/bill/inputs';
import type { LlmExtractionResult } from '@/lib/types/llm-extraction';

const nullableString = z.string().trim().nullable();

const rawLineItemSchema = z.object({
  description: nullableString,
  amount: z.string().trim(),
  categoryId: nullableString,
});

export const rawInvoiceExtractionSchema = z.object({
  data: z.object({
    vendorId: nullableString,
    invoiceNumber: nullableString,
    invoiceDate: nullableString,
    dueDate: nullableString,
    amount: z.string().trim(),
    currency: nullableString,
    description: nullableString,
    invoiceUrl: nullableString,
    lineItems: z.array(rawLineItemSchema).min(1),
  }),
  confidence: z.number().min(0).max(1).nullable(),
  warnings: z.array(z.string()).nullable(),
  rawTextNotes: nullableString,
});

export type RawInvoiceExtraction = z.infer<typeof rawInvoiceExtractionSchema>;

function optionalString(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

export function normalizeInvoiceExtraction(
  raw: RawInvoiceExtraction,
): LlmExtractionResult<CreateBillInput> {
  const data: CreateBillInput = {
    vendorId: optionalString(raw.data.vendorId) ?? '',
    amount: raw.data.amount,
    ...(optionalString(raw.data.invoiceNumber)
      ? { invoiceNumber: optionalString(raw.data.invoiceNumber) } : {}),
    ...(optionalString(raw.data.invoiceDate)
      ? { invoiceDate: optionalString(raw.data.invoiceDate) } : {}),
    ...(optionalString(raw.data.dueDate)
      ? { dueDate: optionalString(raw.data.dueDate) } : {}),
    ...(optionalString(raw.data.currency)
      ? { currency: optionalString(raw.data.currency)?.toUpperCase() } : {}),
    ...(optionalString(raw.data.description)
      ? { description: optionalString(raw.data.description) } : {}),
    ...(optionalString(raw.data.invoiceUrl)
      ? { invoiceUrl: optionalString(raw.data.invoiceUrl) } : {}),
    lineItems: raw.data.lineItems.map((lineItem) => ({
      amount: lineItem.amount,
      ...(optionalString(lineItem.description)
        ? { description: optionalString(lineItem.description) } : {}),
      ...(optionalString(lineItem.categoryId)
        ? { categoryId: optionalString(lineItem.categoryId) } : {}),
    })),
  };

  return {
    data,
    ...(raw.confidence === null ? {} : { confidence: raw.confidence }),
    ...(raw.warnings === null ? {} : { warnings: raw.warnings }),
    ...(optionalString(raw.rawTextNotes) ? { rawTextNotes: optionalString(raw.rawTextNotes) } : {}),
  };
}

export function validateInvoiceExtractionResult(
  result: LlmExtractionResult<CreateBillInput>,
): LlmExtractionResult<CreateBillInput> {
  return {
    ...result,
    data: createBillSchema.parse(result.data),
  };
}

export function isKnownId(value: string | undefined, ids: Set<string>): boolean {
  return value !== undefined && uuidSchema.safeParse(value).success && ids.has(value);
}
