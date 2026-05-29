'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import {
  useFieldArray,
  useForm,
  useWatch,
} from 'react-hook-form';

import {
  draftBillFormSchema,
  type DraftBillFormInput,
  type DraftBillFormValues,
} from '@/lib/validators/bill.schemas';
import { sumMoneyStrings } from '@/lib/validators/shared';
import type {
  CreateBillInput,
  DraftBillListItem,
} from '@/types';

interface UseDraftBillFormOptions {
  editingBill: DraftBillListItem | null;
  onSubmit: (input: CreateBillInput) => void;
}

const emptyDraftBillLineItem: DraftBillFormInput['lineItems'][number] = {
  description: '',
  amount: '0.00',
  categoryId: '',
};

function createDefaultDraftBillFormValues(): DraftBillFormInput {
  return {
    vendorId: '',
    invoiceNumber: '',
    invoiceDate: '',
    dueDate: '',
    amount: '0.00',
    currency: 'USD',
    description: '',
    invoiceUrl: '',
    lineItems: [{ ...emptyDraftBillLineItem }],
  };
}

function draftBillToFormValues(bill: DraftBillListItem): DraftBillFormInput {
  const lineItems = bill.lineItems.length > 0
    ? bill.lineItems.map((lineItem) => ({
      description: lineItem.description ?? '',
      amount: lineItem.amount,
      categoryId: lineItem.categoryId ?? '',
    }))
    : [{ ...emptyDraftBillLineItem }];

  return {
    vendorId: bill.vendorId,
    invoiceNumber: bill.invoiceNumber ?? '',
    invoiceDate: bill.invoiceDate ?? '',
    dueDate: bill.dueDate ?? '',
    amount: bill.amount,
    currency: bill.currency,
    description: bill.description ?? '',
    invoiceUrl: bill.invoiceUrl ?? '',
    lineItems,
  };
}

export function useDraftBillForm({
  editingBill,
  onSubmit,
}: UseDraftBillFormOptions) {
  const form = useForm<DraftBillFormInput, unknown, DraftBillFormValues>({
    resolver: zodResolver(draftBillFormSchema),
    defaultValues: createDefaultDraftBillFormValues(),
  });
  const {
    control,
    handleSubmit,
    register,
    reset,
  } = form;
  const lineItems = useFieldArray({
    control,
    name: 'lineItems',
  });
  const {
    append,
    fields,
    remove,
  } = lineItems;
  const watchedLineItems = useWatch({
    control,
    name: 'lineItems',
  });
  const watchedAmount = useWatch({
    control,
    name: 'amount',
  });
  const currency = useWatch({
    control,
    name: 'currency',
  });

  const lineItemTotal = useMemo(
    () => sumMoneyStrings(watchedLineItems.map((lineItem) => lineItem.amount || '0')),
    [watchedLineItems],
  );
  const totalsMatch = lineItemTotal === Number(watchedAmount);

  useEffect(() => {
    reset(
      editingBill
        ? draftBillToFormValues(editingBill)
        : createDefaultDraftBillFormValues(),
    );
  }, [editingBill, reset]);

  const appendLineItem = useCallback(() => {
    append({ ...emptyDraftBillLineItem });
  }, [append]);

  const removeLineItem = useCallback((index: number) => {
    remove(index);
  }, [remove]);

  const submitDraftBill = useCallback((values: DraftBillFormValues) => {
    onSubmit(values);
  }, [onSubmit]);

  return {
    fields,
    handleSubmit,
    lineItemTotal,
    register,
    appendLineItem,
    removeLineItem,
    submitDraftBill,
    totalsMatch,
    currency,
  };
}
