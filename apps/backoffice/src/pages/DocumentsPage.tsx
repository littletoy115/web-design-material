import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import api from '../services/api';
import { useAuthStore } from '../store/auth.store';
import { MemoDocument, MemoRow, Product } from '@repo/types';

interface RowInput {
  productId: string;
  sku: string;
  name: string;
  stock: number;
  qty: string;
}

const DEPT_OPTIONS = [
  'BKK1', 'BKK2', 'BKK3', 'BKK4', 'BKK5',
  'UPC1', 'UPC2', 'UPC3', 'UPC4', 'UPC5',
];

function rowsFromProducts(products: Product[]): RowInput[] {
  return products.map((p) => ({
    productId: p.id,
    sku: p.sku,
    name: p.name,
    stock: p.stock,
    qty: '',
  }));
}

const emptyForm = {
  clinicName: '',
  deliveryAddress: '',
  fromName: '',
  fromPosition: '',
  fromDept: '',
  subject: '',
  notes: '',
};

const STATUS_OPTIONS: { value: MemoDocument['status']; label: string }[] = [
  { value: 'PENDING_AUDIT', label: 'Awaiting Audit' },
  { value: 'PENDING_MANAGER', label: 'Awaiting Manager' },
  { value: 'PENDING_LOGISTIC', label: 'Awaiting Logistics' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'REJECTED', label: 'Rejected' },
];

function statusLabel(status: MemoDocument['status']) {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;
}

function exportRowsExcel(docs: MemoDocument[]) {
  const data = docs.flatMap((d) =>
    d.rows.map((r) => ({
      'Document No.': d.docNo,
      'Subject': d.subject,
      'From': d.fromName,
      'Clinic': d.clinicName ?? '',
      'Date': new Date(d.createdAt).toLocaleDateString('en-GB'),
      'Status': statusLabel(d.status),
      'Product': r.name,
      'SKU': r.sku,
      'Quantity': r.qty,
    }))
  );
  const sheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Items');
  XLSX.writeFile(workbook, `memo-documents-${Date.now()}.xlsx`);
}

function exportOverviewExcel(docs: MemoDocument[]) {
  const summaryRows = docs.map((d) => ({
    'Document No.': d.docNo,
    'Subject': d.subject,
    'From': d.fromName,
    'Clinic': d.clinicName ?? '',
    'Date': new Date(d.createdAt).toLocaleDateString('en-GB'),
    'Status': statusLabel(d.status),
    'Line items': d.rows.length,
    'Total quantity requested': d.rows.reduce((sum, r) => sum + r.qty, 0),
  }));

  const statusCounts = STATUS_OPTIONS.map((s) => ({
    'Status': s.label,
    'Documents': docs.filter((d) => d.status === s.value).length,
  }));

  const productTotals = new Map<string, number>();
  for (const d of docs) {
    for (const r of d.rows) {
      productTotals.set(r.name, (productTotals.get(r.name) ?? 0) + r.qty);
    }
  }
  const productRows = Array.from(productTotals.entries()).map(([name, qty]) => ({
    'Product': name,
    'Total quantity requested': qty,
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summaryRows), 'All documents');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(statusCounts), 'By status');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(productRows), 'By product');
  XLSX.writeFile(workbook, `memo-overview-${Date.now()}.xlsx`);
}

function statusBadge(doc: MemoDocument) {
  if (doc.status === 'REJECTED') {
    return <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">Rejected</span>;
  }
  if (doc.status === 'DELIVERED') {
    return <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">Delivered</span>;
  }
  const pending = doc.approvals.find((a) => a.status === 'PENDING');
  return (
    <span className="px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-700">
      Awaiting {pending?.label ?? '-'}
    </span>
  );
}

export default function DocumentsPage() {
  const user = useAuthStore((s) => s.user);
  const [docs, setDocs] = useState<MemoDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [rows, setRows] = useState<RowInput[]>([]);
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState('');
  const [selected, setSelected] = useState<MemoDocument | null>(null);
  const [deciding, setDeciding] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const canCreate = user?.role === 'SALE' || user?.role === 'ADMIN';

  const filteredDocs = docs.filter((d) => {
    if (statusFilter && d.status !== statusFilter) return false;
    const created = d.createdAt.slice(0, 10);
    if (dateFrom && created < dateFrom) return false;
    if (dateTo && created > dateTo) return false;
    return true;
  });

  function loadDocs() {
    setLoading(true);
    api
      .get<{ success: boolean; data: MemoDocument[] }>('/api/documents')
      .then(({ data }) => setDocs(data.data ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadDocs(); }, []);

  function updateQty(index: number, value: string) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, qty: value } : r)));
  }

  function openNew() {
    setForm(emptyForm);
    setCreateError('');
    api
      .get<{ success: boolean; data: Product[] }>('/api/products')
      .then(({ data }) => setRows(rowsFromProducts(data.data ?? [])));
    setShowAdd(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError('');

    const requested = rows.filter((r) => Number(r.qty) > 0);
    if (requested.length === 0) {
      setCreateError('Enter a quantity for at least one product.');
      return;
    }
    const overStock = requested.find((r) => Number(r.qty) > r.stock);
    if (overStock) {
      setCreateError(`${overStock.name} has ${overStock.stock} in stock, so ${overStock.qty} can't be requested.`);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        rows: requested.map((r): MemoRow => ({
          productId: r.productId,
          sku: r.sku,
          name: r.name,
          qty: Number(r.qty),
        })),
      };
      await api.post('/api/documents', payload);
      setShowAdd(false);
      loadDocs();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setCreateError(msg || 'Could not create the document.');
    } finally {
      setSaving(false);
    }
  }

  async function decide(doc: MemoDocument, decision: 'APPROVED' | 'REJECTED', reason?: string) {
    setDeciding(true);
    try {
      const { data } = await api.post<{ success: boolean; data: MemoDocument }>(
        `/api/documents/${doc.id}/decision`,
        { decision, reason }
      );
      setSelected(data.data);
      setDocs((prev) => prev.map((d) => (d.id === doc.id ? data.data : d)));
      return true;
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      if (reason !== undefined) {
        setRejectError(msg || 'The action could not be completed.');
      } else {
        alert(msg || 'The action could not be completed.');
      }
      return false;
    } finally {
      setDeciding(false);
    }
  }

  function openRejectModal() {
    setRejectReason('');
    setRejectError('');
    setShowRejectModal(true);
  }

  async function confirmReject() {
    if (!selected) return;
    if (!rejectReason.trim()) {
      setRejectError('Enter a reason for rejecting.');
      return;
    }
    const ok = await decide(selected, 'REJECTED', rejectReason.trim());
    if (ok) setShowRejectModal(false);
  }

  const isFinalized = selected?.status === 'REJECTED' || selected?.status === 'DELIVERED';
  const currentPending = !isFinalized ? selected?.approvals.find((a) => a.status === 'PENDING') : undefined;
  const canDecide = !!currentPending && (currentPending.role === user?.role || user?.role === 'ADMIN');

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Documents (Memo)</h1>
        {canCreate && (
          <button
            onClick={openNew}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 self-start sm:self-auto"
          >
            + New document
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">From date</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">To date</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        {(statusFilter || dateFrom || dateTo) && (
          <button
            onClick={() => { setStatusFilter(''); setDateFrom(''); setDateTo(''); }}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2"
          >
            Clear filters
          </button>
        )}
        <div className="sm:ml-auto flex gap-2">
          <button
            onClick={() => exportRowsExcel(filteredDocs)}
            disabled={filteredDocs.length === 0}
            className="text-sm bg-green-100 text-green-700 px-3 py-2 rounded-lg hover:bg-green-200 disabled:opacity-50"
          >
            Export Excel (detailed)
          </button>
          <button
            onClick={() => exportOverviewExcel(filteredDocs)}
            disabled={filteredDocs.length === 0}
            className="text-sm bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 disabled:opacity-50"
          >
            Export Excel (summary)
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {/* Table view (md and up) */}
          <table className="w-full text-sm hidden md:table">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left">Document No.</th>
                <th className="px-6 py-3 text-left">Subject</th>
                <th className="px-6 py-3 text-left">From</th>
                <th className="px-6 py-3 text-left">Clinic</th>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDocs.map((d) => (
                <tr key={d.id}>
                  <td className="px-6 py-4 font-medium">{d.docNo}</td>
                  <td className="px-6 py-4">{d.subject}</td>
                  <td className="px-6 py-4 text-gray-500">{d.fromName}</td>
                  <td className="px-6 py-4 text-gray-500">{d.clinicName}</td>
                  <td className="px-6 py-4 text-gray-500">{new Date(d.createdAt).toLocaleDateString('en-GB')}</td>
                  <td className="px-6 py-4">{statusBadge(d)}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelected(d)}
                      className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                    >
                      View / Approve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Card view (below md) */}
          <div className="md:hidden divide-y divide-gray-100">
            {filteredDocs.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelected(d)}
                className="w-full text-left p-4 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{d.docNo}</p>
                    <p className="text-sm text-gray-700 truncate">{d.subject}</p>
                    <p className="text-xs text-gray-500 mt-1">{d.fromName} · {d.clinicName}</p>
                    <p className="text-xs text-gray-400">{new Date(d.createdAt).toLocaleDateString('en-GB')}</p>
                  </div>
                  <div className="shrink-0">{statusBadge(d)}</div>
                </div>
              </button>
            ))}
          </div>

          {filteredDocs.length === 0 && <p className="text-center text-gray-400 py-8">No documents found</p>}
        </div>
      )}

      {/* Create Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">New document: sample request</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="col-span-1 sm:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3 border rounded-lg p-3">
                  <p className="col-span-1 sm:col-span-3 text-xs font-semibold text-gray-500 uppercase">From</p>
                  <input required placeholder="Name" value={form.fromName} onChange={(e) => setForm({ ...form, fromName: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
                  <select
                    required
                    value={form.fromPosition}
                    onChange={(e) => {
                      const position = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        fromPosition: position,
                        fromDept: position === 'Marketing' ? 'Marketing' : '',
                      }));
                    }}
                    className="border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="" disabled>Position</option>
                    <option value="Sale">Sale</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                  <select
                    required
                    disabled={form.fromPosition === 'Marketing'}
                    value={form.fromDept}
                    onChange={(e) => setForm({ ...form, fromDept: e.target.value })}
                    className="border rounded-lg px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    <option value="" disabled>Department</option>
                    {form.fromPosition === 'Marketing' ? (
                      <option value="Marketing">Marketing</option>
                    ) : (
                      DEPT_OPTIONS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clinic name</label>
                <input
                  required
                  value={form.clinicName}
                  onChange={(e) => setForm({ ...form, clinicName: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Clinic name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={form.deliveryAddress}
                  onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
                  rows={2}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Delivery address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Sample request"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                  <thead>
                    <tr className="text-xs">
                      <th className="border px-2 py-2">No</th>
                      <th className="border px-2 py-2">Product</th>
                      <th className="border px-2 py-2">SKU</th>
                      <th className="border px-2 py-2">In stock</th>
                      <th className="border px-2 py-2">Requested</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const over = Number(r.qty) > r.stock;
                      return (
                        <tr key={r.productId}>
                          <td className="border px-2 py-1 text-center">{i + 1}</td>
                          <td className="border px-2 py-1">{r.name}</td>
                          <td className="border px-2 py-1">{r.sku}</td>
                          <td className="border px-2 py-1 text-center">{r.stock}</td>
                          <td className="border px-1 py-1">
                            <input
                              type="number"
                              min={0}
                              max={r.stock}
                              value={r.qty}
                              onChange={(e) => updateQty(i, e.target.value)}
                              className={`w-20 border rounded px-2 py-1 text-sm text-center ${over ? 'border-red-500 text-red-600' : ''}`}
                            />
                          </td>
                        </tr>
                      );
                    })}
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={5} className="border px-2 py-4 text-center text-gray-400">No products found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="More details, e.g. which doctor or clinic it is for"
                />
              </div>

              {createError && <p className="text-red-500 text-sm">{createError}</p>}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save and submit for approval'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail / Approval Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{selected.docNo}</h2>
              {statusBadge(selected)}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <p className="text-gray-400 text-xs uppercase">From</p>
                <p className="font-medium">{selected.fromName}</p>
                <p className="text-gray-500">{selected.fromPosition} · {selected.fromDept}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase">Clinic</p>
                <p className="font-medium">{selected.clinicName}</p>
              </div>
            </div>

            <p className="text-sm mb-4"><span className="text-gray-400">Subject: </span>{selected.subject}</p>

            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm border">
                <thead>
                  <tr className="text-xs">
                    <th className="border px-2 py-2">No</th>
                    <th className="border px-2 py-2">Product</th>
                    <th className="border px-2 py-2">SKU</th>
                    <th className="border px-2 py-2">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.rows.map((r, i) => (
                    <tr key={r.productId}>
                      <td className="border px-2 py-1 text-center">{i + 1}</td>
                      <td className="border px-2 py-1">{r.name}</td>
                      <td className="border px-2 py-1">{r.sku}</td>
                      <td className="border px-2 py-1 text-center">{r.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selected.notes && (
              <p className="text-sm text-gray-600 mb-4 whitespace-pre-line">{selected.notes}</p>
            )}

            {/* Approval stepper: Sale -> Audit -> Manager */}
            <div className="border-t pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Approval steps</p>
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                {selected.approvals.map((a, i) => {
                  const cancelled = selected.status === 'REJECTED' && a.status === 'PENDING';
                  return (
                    <div key={a.step} className="sm:flex-1 flex flex-col sm:flex-row items-center">
                      <div className={`w-full border rounded-lg p-3 text-center ${cancelled ? 'opacity-50' : ''}`}>
                        <div
                          className={`mx-auto mb-2 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                            a.status === 'APPROVED' ? 'bg-green-600' : a.status === 'REJECTED' ? 'bg-red-600' : 'bg-gray-300'
                          }`}
                        >
                          {a.status === 'APPROVED' ? '✓' : a.status === 'REJECTED' ? '✕' : cancelled ? '–' : i + 1}
                        </div>
                        <p className="text-xs font-medium">{a.label}</p>
                        <p className="text-xs text-gray-400 mt-1">{a.approvedByName || '—'}</p>
                        <p className="text-xs text-gray-400">
                          {a.decidedAt
                            ? new Date(a.decidedAt).toLocaleDateString('en-GB')
                            : cancelled
                              ? 'Cancelled'
                              : 'Pending'}
                        </p>
                        {a.status === 'REJECTED' && a.reason && (
                          <p className="text-xs text-red-600 mt-1 whitespace-pre-line">Reason: {a.reason}</p>
                        )}
                      </div>
                      {i < selected.approvals.length - 1 && (
                        <div className="w-px h-4 sm:w-4 sm:h-px bg-gray-300 my-1 sm:my-0 sm:mx-1" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t mt-4 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
              {canDecide ? (
                <>
                  <button
                    onClick={() => decide(selected, 'APPROVED')}
                    disabled={deciding}
                    className="text-sm bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {currentPending?.role === 'LOGISTIC' ? 'Ship' : 'Approve'}
                  </button>
                  <button
                    onClick={openRejectModal}
                    disabled={deciding}
                    className="text-sm bg-red-100 text-red-700 px-4 py-2 rounded hover:bg-red-200 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </>
              ) : (
                currentPending && (
                  <span className="text-xs text-gray-400 self-center">
                    Only {currentPending.label} can approve this step
                  </span>
                )
              )}
              <button
                onClick={() => setSelected(null)}
                className="text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {showRejectModal && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-1">Reject document</h2>
            <p className="text-sm text-gray-500 mb-4">{selected.docNo}</p>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason for rejecting</label>
            <textarea
              autoFocus
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Give a reason, e.g. missing details or over quota"
            />
            {rejectError && <p className="text-red-500 text-sm mt-2">{rejectError}</p>}
            <div className="flex gap-3 pt-4">
              <button
                onClick={confirmReject}
                disabled={deciding}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
              >
                {deciding ? 'Saving...' : 'Confirm rejection'}
              </button>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                disabled={deciding}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
