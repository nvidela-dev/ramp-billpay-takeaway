const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;

function isHexString(value: string): boolean {
  return value.length % 2 === 0 && /^[\da-f]+$/i.test(value);
}

export function invoiceDocumentContentToBytes(content: unknown): Uint8Array {
  if (content instanceof Uint8Array) {
    return content;
  }

  if (content instanceof ArrayBuffer) {
    return new Uint8Array(content);
  }

  if (typeof content === 'string') {
    const hex = content.startsWith('\\x') ? content.slice(2) : content;
    if (isHexString(hex)) {
      return new Uint8Array(Buffer.from(hex, 'hex'));
    }
    return new Uint8Array(Buffer.from(content, 'base64'));
  }

  throw new Error('Stored invoice document content is not readable.');
}

export function detectInvoiceImageMimeType(bytes: Uint8Array): 'image/jpeg' | 'image/png' | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }

  const isPng = PNG_SIGNATURE.every((byte, index) => bytes[index] === byte);
  return isPng ? 'image/png' : null;
}
