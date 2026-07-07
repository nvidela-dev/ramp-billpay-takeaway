import {
  cleanup,
  render,
  screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, vi } from 'vitest';

import { DraftBillForm } from '@/app/(dashboard)/bills/_components/draft-bill-form';
import type { CreateBillInput } from '@/lib/types/bill/inputs';
import type { BillFormOptions } from '@/lib/types/bill/views';

const VENDOR_ID = '11111111-1111-4111-8111-111111111111';
const CATEGORY_ID = '22222222-2222-4222-9222-222222222222';

const options: BillFormOptions = {
  vendors: [
    {
      id: VENDOR_ID,
      name: 'Acme',
      email: null,
      ownerId: null,
    },
  ],
  categories: [{ id: CATEGORY_ID, name: 'Software' }],
};

const importedBillInput: CreateBillInput = {
  vendorId: VENDOR_ID,
  invoiceNumber: 'INV-99',
  invoiceDate: '2026-07-01',
  dueDate: '2026-07-31',
  amount: '200.00',
  currency: 'USD',
  description: 'Imported services',
  lineItems: [
    { description: 'Subscription', amount: '200.00', categoryId: CATEGORY_ID },
  ],
};

afterEach(() => {
  cleanup();
});

describe('DraftBillForm invoice import', () => {
  it('calls import when a JPG or PNG is selected', async () => {
    const onImportInvoice = vi.fn();
    const file = new File(['image'], 'invoice.png', { type: 'image/png' });

    render(
      <DraftBillForm
        editingBill={null}
        formError={null}
        importedBillInput={null}
        importError={null}
        importWarnings={[]}
        isImporting={false}
        isPending={false}
        loadError={null}
        onCancelEdit={vi.fn()}
        onImportInvoice={onImportInvoice}
        onSubmit={vi.fn()}
        options={options}
      />,
    );

    await userEvent.upload(screen.getByLabelText(/import invoice image/i), file);

    expect(onImportInvoice).toHaveBeenCalledWith(file);
  });

  it('fills the draft form from imported CreateBillInput data', () => {
    const { rerender } = render(
      <DraftBillForm
        editingBill={null}
        formError={null}
        importedBillInput={null}
        importError={null}
        importWarnings={[]}
        isImporting={false}
        isPending={false}
        loadError={null}
        onCancelEdit={vi.fn()}
        onImportInvoice={vi.fn()}
        onSubmit={vi.fn()}
        options={options}
      />,
    );

    rerender(
      <DraftBillForm
        editingBill={null}
        formError={null}
        importedBillInput={importedBillInput}
        importError={null}
        importWarnings={['Review imported fields.']}
        isImporting={false}
        isPending={false}
        loadError={null}
        onCancelEdit={vi.fn()}
        onImportInvoice={vi.fn()}
        onSubmit={vi.fn()}
        options={options}
      />,
    );

    expect(screen.getByLabelText('Vendor')).toHaveValue(VENDOR_ID);
    expect(screen.getByLabelText('Invoice #')).toHaveValue('INV-99');
    expect(screen.getByLabelText('Amount')).toHaveValue('200.00');
    expect(screen.getByLabelText('Description')).toHaveValue('Imported services');
    expect(screen.getByText('Review imported fields.')).toBeInTheDocument();
  });
});
