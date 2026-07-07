import {
  detectInvoiceImageMimeType,
  invoiceDocumentContentToBytes,
} from '@/lib/invoice-documents/bytes';

const PNG_BYTES = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
]);
const JPEG_BYTES = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);

describe('invoice document bytes', () => {
  it('decodes Neon bytea hex strings into real image bytes', () => {
    const bytes = invoiceDocumentContentToBytes('\\x89504e470d0a1a0a00');

    expect(Array.from(bytes)).toEqual(Array.from(PNG_BYTES));
    expect(detectInvoiceImageMimeType(bytes)).toBe('image/png');
  });

  it('detects jpeg image bytes', () => {
    expect(detectInvoiceImageMimeType(JPEG_BYTES)).toBe('image/jpeg');
  });

  it('rejects non-image bytes', () => {
    expect(detectInvoiceImageMimeType(Uint8Array.from([1, 2, 3]))).toBeNull();
  });
});
