import { z } from 'zod';

import type { BillFormOptions } from '@/lib/types/bill/views';

import type { RawInvoiceExtraction } from './schema';
import { rawInvoiceExtractionSchema } from './schema';

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';

export interface ParseInvoiceWithOpenAiInput {
  imageUrl: string;
  options: BillFormOptions;
}

const invoiceExtractionJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['data', 'confidence', 'warnings', 'rawTextNotes'],
  properties: {
    data: {
      type: 'object',
      additionalProperties: false,
      required: [
        'vendorId',
        'invoiceNumber',
        'invoiceDate',
        'dueDate',
        'amount',
        'currency',
        'description',
        'invoiceUrl',
        'lineItems',
      ],
      properties: {
        vendorId: { type: ['string', 'null'] },
        invoiceNumber: { type: ['string', 'null'] },
        invoiceDate: { type: ['string', 'null'] },
        dueDate: { type: ['string', 'null'] },
        amount: { type: 'string' },
        currency: { type: ['string', 'null'] },
        description: { type: ['string', 'null'] },
        invoiceUrl: { type: ['string', 'null'] },
        lineItems: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['description', 'amount', 'categoryId'],
            properties: {
              description: { type: ['string', 'null'] },
              amount: { type: 'string' },
              categoryId: { type: ['string', 'null'] },
            },
          },
        },
      },
    },
    confidence: { type: ['number', 'null'], minimum: 0, maximum: 1 },
    warnings: {
      type: ['array', 'null'],
      items: { type: 'string' },
    },
    rawTextNotes: { type: ['string', 'null'] },
  },
};

const openAiOutputContentSchema = z.object({
  type: z.string(),
  text: z.string().optional(),
}).passthrough();

const openAiResponseSchema = z.object({
  output_text: z.string().optional(),
  output: z.array(z.object({
    type: z.string(),
    content: z.array(openAiOutputContentSchema).optional(),
  }).passthrough()).optional(),
}).passthrough();

function extractOutputText(payload: unknown): string | null {
  const response = openAiResponseSchema.parse(payload);
  if (response.output_text) return response.output_text;

  return response.output
    ?.flatMap((item) => item.content ?? [])
    .find((content) => content.type === 'output_text' && content.text)?.text
    ?? null;
}

function buildPrompt(options: BillFormOptions): string {
  return [
    'Extract this invoice into JSON for a bill draft.',
    'Return only values visible in the image. Use null when a field is missing.',
    'Money values must be decimal strings with two decimals. Dates must be YYYY-MM-DD.',
    'The data object must match the app bill creation payload.',
    'Choose vendorId only from this list:',
    JSON.stringify(options.vendors.map((vendor) => ({
      id: vendor.id,
      name: vendor.name,
    }))),
    'Choose categoryId for line items only from this list, or null:',
    JSON.stringify(options.categories.map((category) => ({
      id: category.id,
      name: category.name,
    }))),
    'If line items are not clearly listed, return one line item matching the total.',
    'Set invoiceUrl to null; the app stores the uploaded document separately.',
  ].join('\n');
}

export async function parseInvoiceWithOpenAi({
  imageUrl,
  options,
}: ParseInvoiceWithOpenAiInput): Promise<RawInvoiceExtraction> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  // eslint-disable-next-line n/no-unsupported-features/node-builtins
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_INVOICE_MODEL ?? 'gpt-5.5',
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: buildPrompt(options) },
            { type: 'input_image', image_url: imageUrl, detail: 'high' },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'invoice_bill_extraction',
          strict: true,
          schema: invoiceExtractionJsonSchema,
        },
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI invoice parsing failed: ${response.status} ${body}`);
  }

  const outputText = extractOutputText(await response.json());
  if (!outputText) {
    throw new Error('OpenAI invoice parsing returned no output text.');
  }

  return rawInvoiceExtractionSchema.parse(JSON.parse(outputText));
}
