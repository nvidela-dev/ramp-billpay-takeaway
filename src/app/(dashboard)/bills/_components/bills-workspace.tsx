'use client';

import { useRouter } from 'next/navigation';
import {
  Plus,
  X,
} from 'lucide-react';
import {
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';

import {
  PageHeader,
  SurfaceTabs,
} from '@/app/_components/shared';
import { Button } from '@/app/_components/ui/button';
import { createBill } from '@/lib/actions/bills/create-bill';
import { deleteBill } from '@/lib/actions/bills/delete-bill';
import { updateBill } from '@/lib/actions/bills/update-bill';
import { billTabs } from '@/app/_navigation';
import type { CreateBillInput } from '@/lib/types/bill/inputs';
import type {
  BillListResult,
  BillReferenceData,
  BillStatusAggregate,
} from '@/lib/types/bill/filters';
import type { BillFilterTab } from '@/lib/types/bill/tabs';
import type { BillListItem } from '@/lib/types/bill/views';

import { BillTransitionDialog } from './bill-transition-dialog';
import { BillsStatusOverview } from './bills-status-overview';
import { BillsTable } from './bills-table';
import { BillsTablePagination } from './bills-table-pagination';
import {
  approvalActionsColumn,
  billReadColumns,
  draftActionsColumn,
} from './bills-table-columns';
import { ColumnPicker } from './column-picker';
import { DraftBillForm } from './draft-bill-form';
import { BillFilterBar } from './filters/bill-filter-bar';
import { useBillFilters } from './hooks/use-bill-filters';
import { useBillTransitions } from './hooks/use-bill-transitions';
import { useColumnVisibility } from './hooks/use-column-visibility';
import { useDialogBehavior } from './hooks/use-dialog-behavior';

type BillTabValue = 'overview' | BillFilterTab;

interface BillsWorkspaceProps {
  activeTab: BillTabValue;
  activeBills: BillListResult<BillListItem>;
  aggregates: BillStatusAggregate[];
  loadError: string | null;
  referenceData: BillReferenceData;
}

const draftFormOptions = (referenceData: BillReferenceData) => ({
  vendors: referenceData.vendors,
  categories: referenceData.categories,
});

export function BillsWorkspace({
  activeTab,
  activeBills,
  aggregates,
  loadError,
  referenceData,
}: BillsWorkspaceProps) {
  const router = useRouter();
  const dialogTitleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);
  const [isMutating, startMutation] = useTransition();

  const transitions = useBillTransitions({
    startTransition: startMutation,
    router,
    onDirectError: setFormError,
  });

  const filtersController = useBillFilters();

  const editingBill = useMemo(
    () => (editingBillId && activeTab === 'drafts'
      ? activeBills.items.find((bill) => bill.id === editingBillId) ?? null
      : null),
    [activeBills.items, activeTab, editingBillId],
  );

  const isFormOpen = isCreating || (editingBillId !== null && editingBill !== null);

  const closeForm = useCallback(() => {
    setEditingBillId(null);
    setIsCreating(false);
    setFormError(null);
  }, []);

  const openCreateForm = useCallback(() => {
    setEditingBillId(null);
    setFormError(null);
    setIsCreating(true);
  }, []);

  const selectBillForEdit = useCallback((bill: BillListItem) => {
    setEditingBillId(bill.id);
    setIsCreating(false);
    setFormError(null);
  }, []);

  const cancelDelete = useCallback(() => {
    setDeleteCandidateId(null);
  }, []);

  const requestDelete = useCallback((id: string) => {
    setDeleteCandidateId(id);
  }, []);

  const onSubmit = useCallback((input: CreateBillInput) => {
    setFormError(null);
    startMutation(async () => {
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

      closeForm();
      router.refresh();
    });
  }, [closeForm, editingBill, router]);

  const onDelete = useCallback((id: string) => {
    startMutation(async () => {
      const result = await deleteBill(id);
      if (!result.ok) {
        setFormError(result.error.message);
        return;
      }

      if (editingBillId === id) {
        closeForm();
      }

      setDeleteCandidateId(null);
      router.refresh();
    });
  }, [closeForm, editingBillId, router]);

  useDialogBehavior({
    containerRef: dialogRef,
    onClose: closeForm,
    enabled: isFormOpen,
  });

  const draftColumns = [
    ...billReadColumns,
    draftActionsColumn({
      deleteCandidateId,
      onCancelDelete: cancelDelete,
      onDelete,
      onEdit: selectBillForEdit,
      onRequestDelete: requestDelete,
      onSubmit: transitions.submitForApproval,
    }),
  ];
  const approvalColumns = [
    ...billReadColumns,
    approvalActionsColumn({
      onApprove: transitions.requestApprove,
      onReject: transitions.requestReject,
    }),
  ];

  const draftVisibility = useColumnVisibility(draftColumns);
  const approvalVisibility = useColumnVisibility(approvalColumns);
  const paymentVisibility = useColumnVisibility(billReadColumns);

  const isTableLoading = isMutating || filtersController.isPending;

  const renderTabToolbar = (
    tab: BillFilterTab,
    columnControl: ReturnType<typeof useColumnVisibility>,
  ) => (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <BillFilterBar
        controller={filtersController}
        options={referenceData}
        tab={tab}
      />
      <ColumnPicker
        columns={columnControl.configurableColumns}
        hiddenIds={columnControl.hiddenIds}
        onToggle={columnControl.toggle}
      />
    </div>
  );

  const renderPagination = (total: number) => (
    <BillsTablePagination
      onPageChange={(page) => {
        void filtersController.setPage(page);
      }}
      onPageSizeChange={(pageSize) => {
        void filtersController.setPageSize(pageSize);
      }}
      page={filtersController.pagination.page}
      pageSize={filtersController.pagination.pageSize}
      pageSizeOptions={filtersController.pageSizeOptions}
      total={total}
    />
  );

  return (
    <main className="grid gap-6">
      <PageHeader
        actions={(
          <Button onClick={openCreateForm} type="button" variant="accent">
            <Plus aria-hidden className="size-4" />
            New bill
          </Button>
        )}
        eyebrow="Bill Pay"
        title="Bills"
      />
      <SurfaceTabs activeValue={activeTab} tabs={billTabs} />

      {isFormOpen ? (
        <div
          className={[
            'fixed inset-0 z-50 grid place-items-center bg-slate-950/50',
            'p-3 sm:p-6',
          ].join(' ')}
          role="dialog"
          aria-modal
          aria-labelledby={dialogTitleId}
          ref={dialogRef}
          tabIndex={-1}
        >
          <div className="w-full max-w-5xl rounded-md border border-slate-200 bg-white shadow-2xl">
            <div className="flex justify-end px-4 pt-4">
              <Button
                aria-label="Close bill form"
                onClick={closeForm}
                size="icon"
                type="button"
                variant="ghost"
              >
                <X aria-hidden className="size-4" />
              </Button>
            </div>
            <div className="max-h-[85dvh] overflow-y-auto px-4 pb-4 sm:px-5 sm:pb-5">
              <h2 className="sr-only" id={dialogTitleId}>
                {editingBill ? 'Edit bill' : 'New bill'}
              </h2>
              <DraftBillForm
                editingBill={editingBill}
                formError={formError}
                isPending={isMutating}
                loadError={loadError}
                onCancelEdit={closeForm}
                onSubmit={onSubmit}
                options={draftFormOptions(referenceData)}
              />
            </div>
          </div>
        </div>
      ) : null}

      {!isFormOpen && formError ? (
        <div
          className={[
            'rounded-md border border-rose-200 bg-rose-50 p-4',
            'text-sm text-rose-950',
          ].join(' ')}
          role="alert"
        >
          {formError}
        </div>
      ) : null}

      {activeTab === 'overview' ? (
        <BillsStatusOverview aggregates={aggregates} />
      ) : null}
      {activeTab === 'drafts' ? (
        <div className="grid gap-3">
          {renderTabToolbar('drafts', draftVisibility)}
          <BillsTable
            bills={activeBills.items}
            columns={draftVisibility.visibleColumns}
            emptyMessage="No draft bills match this view."
            isLoading={isTableLoading}
            loadingMessage="Loading draft bills…"
          />
          {renderPagination(activeBills.total)}
        </div>
      ) : null}
      {activeTab === 'approvals' ? (
        <div className="grid gap-3">
          {renderTabToolbar('approvals', approvalVisibility)}
          <BillsTable
            bills={activeBills.items}
            columns={approvalVisibility.visibleColumns}
            emptyMessage="No bills awaiting approval match this view."
            isLoading={isTableLoading}
            loadingMessage="Loading bills…"
          />
          {renderPagination(activeBills.total)}
        </div>
      ) : null}
      {activeTab === 'payment' ? (
        <div className="grid gap-3">
          {renderTabToolbar('payment', paymentVisibility)}
          <BillsTable
            bills={activeBills.items}
            columns={paymentVisibility.visibleColumns}
            emptyMessage="No bills ready for payment match this view."
            isLoading={isTableLoading}
            loadingMessage="Loading bills…"
          />
          {renderPagination(activeBills.total)}
        </div>
      ) : null}

      <BillTransitionDialog isPending={isMutating} transitions={transitions} />
    </main>
  );
}
