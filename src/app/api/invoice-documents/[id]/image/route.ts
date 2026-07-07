import { NextResponse, type NextRequest } from 'next/server';

import { assertDatabaseConfigured } from '@/db';
import {
  detectInvoiceImageMimeType,
  invoiceDocumentContentToBytes,
} from '@/lib/invoice-documents/bytes';
import { getInvoiceDocument } from '@/lib/repositories/invoice-document.repo';
import { uuidSchema } from '@/lib/validators/shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface InvoiceDocumentImageRouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  { params }: InvoiceDocumentImageRouteProps,
): Promise<NextResponse> {
  assertDatabaseConfigured();
  const { id } = await params;
  const parsedId = uuidSchema.safeParse(id);

  if (!parsedId.success) {
    return NextResponse.json({ error: 'Invalid invoice document id.' }, { status: 400 });
  }

  const document = await getInvoiceDocument(parsedId.data);
  if (!document) {
    return NextResponse.json({ error: 'Invoice document not found.' }, { status: 404 });
  }

  const content = invoiceDocumentContentToBytes(document.content);
  const mimeType = detectInvoiceImageMimeType(content);
  if (!mimeType) {
    return NextResponse.json({ error: 'Stored invoice document is not a valid image.' }, {
      status: 422,
    });
  }

  const body = new ArrayBuffer(content.byteLength);
  new Uint8Array(body).set(content);

  return new NextResponse(body, {
    headers: {
      'Content-Type': mimeType,
      'Content-Length': String(content.byteLength),
      'Cache-Control': 'public, max-age=300',
    },
  });
}
