'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Edit2,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import {
  useFieldArray,
  useForm,
  useWatch,
} from 'react-hook-form';

import { StatusBadge } from '@/components/shared';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { createBill } from '@/lib/actions/bills/create-bill';
import { deleteBill } from '@/lib/actions/bills/delete-bill';
import { updateBill } from '@/lib/actions/bills/update-bill';
import { billStatusDisplay } from '@/lib/display';
import { formatDate, formatMoney } from '@/lib/utils';
import { createBillSchema } from '@/lib/validators/bill.schemas';
import { sumMoneyStrings } from '@/lib/validators/shared';
import type {
  BillFormOptions,
  CreateBillInput,
  DraftBillListItem,
} from '@/types';

type DraftBillFormValues = CreateBillInput;

interface DraftBillsViewProps {
  bills: DraftBillListItem[];
  loadError: string | null;
  options: BillFormOptions;
}

const emptyLineItem = {
  description: '',
  amount: '0.00',
  categoryId: '',
};

const defaultValues: DraftBillFormValues = {
  vendorId: '',
  invoiceNumber: '',
  invoiceDate: '',
  dueDate: '',
  amount: '0.00',
  currency: 'USD',
  description: '',
  invoiceUrl: '',
  lineItems: [{ ...emptyLineItem }],
};

function normalizeOptional(value?: string) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function normalizeFormValues(values: DraftBillFormValues): CreateBillInput {
  return {
    vendorId: values.vendorId,
    invoiceNumber: normalizeOptional(values.invoiceNumber),
    invoiceDate: normalizeOptional(values.invoiceDate),
    dueDate: normalizeOptional(values.dueDate),
    amount: values.amount,
    currency: values.currency || 'USD',
    description: normalizeOptional(values.description),
    invoiceUrl: normalizeOptional(values.invoiceUrl),
    lineItems: values.lineItems.map((lineItem) => ({
      description: normalizeOptional(lineItem.description),
      amount: lineItem.amount,
      categoryId: normalizeOptional(lineItem.categoryId),
    })),
  };
}

function toFormValues(bill: DraftBillListItem): DraftBillFormValues {
  return {
    vendorId: bill.vendorId,
    invoiceNumber: bill.invoiceNumber ?? '',
    invoiceDate: bill.invoiceDate ?? '',
    dueDate: bill.dueDate ?? '',
    amount: bill.amount,
    currency: bill.currency,
    description: bill.description ?? '',
    invoiceUrl: bill.invoiceUrl ?? '',
    lineItems: bill.lineItems.map((lineItem) => ({
      description: lineItem.description ?? '',
      amount: lineItem.amount,
      categoryId: lineItem.categoryId ?? '',
    })),
  };
}

export function DraftBillsView({ bills, loadError, options }: DraftBillsViewProps) {
  const router = useRouter();
  const [editingBill, setEditingBill] = useState<DraftBillListItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formDisabled = Boolean(loadError)
    || options.vendors.length === 0
    || options.categories.length === 0;

  const form = useForm<DraftBillFormValues>({
    resolver: zodResolver(createBillSchema),
    defaultValues,
  });
  const lineItems = useFieldArray({
    control: form.control,
    name: 'lineItems',
  });
  const watchedLineItems = useWatch({
    control: form.control,
    name: 'lineItems',
  });
  const watchedAmount = useWatch({
    control: form.control,
    name: 'amount',
  });
  const watchedCurrency = useWatch({
    control: form.control,
    name: 'currency',
  });

  const lineItemTotal = useMemo(
    () => sumMoneyStrings(watchedLineItems.map((lineItem) => lineItem.amount || '0')),
    [watchedLineItems],
  );
  const totalsMatch = lineItemTotal === Number(watchedAmount);

  function resetForm(nextBill: DraftBillListItem | null) {
    setEditingBill(nextBill);
    setFormError(null);
    form.reset(nextBill ? toFormValues(nextBill) : defaultValues);
  }

  function onSubmit(values: DraftBillFormValues) {
    setFormError(null);
    const input = normalizeFormValues(values);

    startTransition(async () => {
      const result = editingBill
        ? await updateBill({
          ...input,
          id: editingBill.id,
          expectedUpdatedAt: editingBill.updatedAt.toISOString(),
        })
        : await createBill(input);

      if (!result.ok) {
        setFormError(result.error.message);
        return;
      }

      resetForm(null);
      router.refresh();
    });
  }

  function onDelete(id: string) {
    startTransition(async () => {
      const result = await deleteBill(id);
      if (!result.ok) {
        setFormError(result.error.message);
        return;
      }
      if (editingBill?.id === id) {
        resetForm(null);
      }
      setDeleteCandidateId(null);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader>
          <CardTitle>{editingBill ? 'Edit draft bill' : 'Create draft bill'}</CardTitle>
          <CardDescription>
            Drafts stay editable until they are submitted for approval.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadError ? (
            <div
              className={[
                'rounded-md border border-rose-200 bg-rose-50 p-4',
                'text-sm text-rose-950',
              ].join(' ')}
            >
              {loadError}
            </div>
          ) : null}
          {!loadError && formDisabled ? (
            <div
              className={[
                'rounded-md border border-amber-200 bg-amber-50 p-4',
                'text-sm text-amber-950',
              ].join(' ')}
            >
              Seed vendors and categories before creating draft bills.
            </div>
          ) : null}
          {!loadError && !formDisabled ? (
            <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-3 md:grid-cols-3">
                <label
                  className="grid gap-1 text-sm font-medium text-slate-700"
                  htmlFor="bill-vendor"
                >
                  Vendor
                  <select
                    className="h-10 rounded-md border border-slate-300 px-3 text-sm"
                    id="bill-vendor"
                    {...form.register('vendorId')}
                  >
                    <option value="">Select vendor</option>
                    {options.vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label
                  className="grid gap-1 text-sm font-medium text-slate-700"
                  htmlFor="bill-invoice-number"
                >
                  Invoice #
                  <input
                    className="h-10 rounded-md border border-slate-300 px-3 text-sm"
                    id="bill-invoice-number"
                    {...form.register('invoiceNumber')}
                  />
                </label>
                <label
                  className="grid gap-1 text-sm font-medium text-slate-700"
                  htmlFor="bill-amount"
                >
                  Amount
                  <input
                    className="h-10 rounded-md border border-slate-300 px-3 text-sm"
                    id="bill-amount"
                    inputMode="decimal"
                    {...form.register('amount')}
                  />
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <label
                  className="grid gap-1 text-sm font-medium text-slate-700"
                  htmlFor="bill-currency"
                >
                  Currency
                  <input
                    className="h-10 rounded-md border border-slate-300 px-3 text-sm uppercase"
                    id="bill-currency"
                    maxLength={3}
                    {...form.register('currency')}
                  />
                </label>
                <label
                  className="grid gap-1 text-sm font-medium text-slate-700"
                  htmlFor="bill-invoice-date"
                >
                  Invoice date
                  <input
                    className="h-10 rounded-md border border-slate-300 px-3 text-sm"
                    id="bill-invoice-date"
                    type="date"
                    {...form.register('invoiceDate')}
                  />
                </label>
                <label
                  className="grid gap-1 text-sm font-medium text-slate-700"
                  htmlFor="bill-due-date"
                >
                  Due date
                  <input
                    className="h-10 rounded-md border border-slate-300 px-3 text-sm"
                    id="bill-due-date"
                    type="date"
                    {...form.register('dueDate')}
                  />
                </label>
                <label
                  className="grid gap-1 text-sm font-medium text-slate-700"
                  htmlFor="bill-invoice-url"
                >
                  Invoice URL
                  <input
                    className="h-10 rounded-md border border-slate-300 px-3 text-sm"
                    id="bill-invoice-url"
                    type="url"
                    {...form.register('invoiceUrl')}
                  />
                </label>
              </div>

              <label
                className="grid gap-1 text-sm font-medium text-slate-700"
                htmlFor="bill-description"
              >
                Description
                <textarea
                  className="min-h-20 rounded-md border border-slate-300 px-3 py-2 text-sm"
                  id="bill-description"
                  {...form.register('description')}
                />
              </label>

              <div className="grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-slate-950">Line items</h2>
                  <Button
                    onClick={() => lineItems.append({ ...emptyLineItem })}
                    size="sm"
                    type="button"
                    variant="secondary"
                  >
                    <Plus aria-hidden className="size-4" />
                    Add line
                  </Button>
                </div>

                {lineItems.fields.map((field, index) => (
                  <div
                    className="grid gap-2 rounded-md border border-slate-200 p-3"
                    key={field.id}
                  >
                    <div className="grid gap-2 md:grid-cols-[1fr_140px_180px_auto]">
                      <input
                        aria-label={`Line ${index + 1} description`}
                        className="h-10 rounded-md border border-slate-300 px-3 text-sm"
                        placeholder="Description"
                        {...form.register(`lineItems.${index}.description`)}
                      />
                      <input
                        aria-label={`Line ${index + 1} amount`}
                        className="h-10 rounded-md border border-slate-300 px-3 text-sm"
                        inputMode="decimal"
                        placeholder="0.00"
                        {...form.register(`lineItems.${index}.amount`)}
                      />
                      <select
                        aria-label={`Line ${index + 1} category`}
                        className="h-10 rounded-md border border-slate-300 px-3 text-sm"
                        {...form.register(`lineItems.${index}.categoryId`)}
                      >
                        <option value="">Category</option>
                        {options.categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      <Button
                        aria-label={`Remove line ${index + 1}`}
                        disabled={lineItems.fields.length === 1}
                        onClick={() => lineItems.remove(index)}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <Trash2 aria-hidden className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p
                  className={
                    totalsMatch ? 'text-sm text-emerald-700' : 'text-sm text-rose-700'
                  }
                >
                  Lines total
                  {' '}
                  {formatMoney(lineItemTotal.toFixed(2), watchedCurrency)}
                </p>
                <div className="flex gap-2">
                  {editingBill ? (
                    <Button onClick={() => resetForm(null)} type="button" variant="ghost">
                      <X aria-hidden className="size-4" />
                      Cancel
                    </Button>
                  ) : null}
                  <Button disabled={isPending || !totalsMatch} type="submit">
                    <Save aria-hidden className="size-4" />
                    {editingBill ? 'Save draft' : 'Create draft'}
                  </Button>
                </div>
              </div>

              {formError ? (
                <p className="text-sm text-rose-700">{formError}</p>
              ) : null}
            </form>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Drafts</CardTitle>
          <CardDescription>
            Bills currently being prepared before approval.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bills.length === 0 ? (
            <div
              className={[
                'rounded-md border border-dashed border-slate-300 p-6',
                'text-center text-sm text-slate-600',
              ].join(' ')}
            >
              No draft bills yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-3 pr-4">Vendor</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4 text-right">Amount</th>
                    <th className="py-3 pr-4">Due date</th>
                    <th className="py-3 pr-4">Invoice #</th>
                    <th className="py-3 pr-4">Lines</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bills.map((bill) => (
                    <tr key={bill.id}>
                      <td className="py-3 pr-4 font-medium text-slate-950">
                        {bill.vendor.name}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={billStatusDisplay[bill.status]} />
                      </td>
                      <td className="py-3 pr-4 text-right">
                        {formatMoney(bill.amount, bill.currency)}
                      </td>
                      <td className="py-3 pr-4">
                        {bill.dueDate ? formatDate(bill.dueDate) : '-'}
                      </td>
                      <td className="py-3 pr-4">{bill.invoiceNumber ?? '-'}</td>
                      <td className="py-3 pr-4">{bill.lineItemCount}</td>
                      <td className="py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            aria-label={`Edit ${bill.vendor.name} draft`}
                            onClick={() => resetForm(bill)}
                            size="icon"
                            type="button"
                            variant="ghost"
                          >
                            <Edit2 aria-hidden className="size-4" />
                          </Button>
                          {deleteCandidateId === bill.id ? (
                            <>
                              <Button
                                onClick={() => onDelete(bill.id)}
                                size="sm"
                                type="button"
                                variant="destructive"
                              >
                                Delete
                              </Button>
                              <Button
                                aria-label="Cancel delete"
                                onClick={() => setDeleteCandidateId(null)}
                                size="icon"
                                type="button"
                                variant="ghost"
                              >
                                <X aria-hidden className="size-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              aria-label={`Delete ${bill.vendor.name} draft`}
                              onClick={() => setDeleteCandidateId(bill.id)}
                              size="icon"
                              type="button"
                              variant="ghost"
                            >
                              <Trash2 aria-hidden className="size-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
