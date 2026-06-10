"use client";

import { useCallback, useEffect, useState } from "react";
import { Edit3, Plus, RefreshCw, Save, Table2, Trash2, X } from "lucide-react";
import type { SavingsRateRow } from "@/services/savings-rates-service";
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  SkeletonTable,
  tableClasses,
  cx,
} from "@/components/admin/ui";

type RowForm = { sn: string; savingsType: string; interestRate: string; displayOrder: string };

function emptyForm(): RowForm {
  return { sn: "", savingsType: "", interestRate: "", displayOrder: "" };
}

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-[#0d837f] focus-visible:ring-2 focus-visible:ring-[#0d837f]/30";

export default function SavingsManagement() {
  const [rows, setRows] = useState<SavingsRateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RowForm>(emptyForm());
  const [showForm, setShowForm] = useState(false);

  const fetchRows = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/savings");
      if (!res.ok) throw new Error("Failed to fetch");
      setRows((await res.json()) as SavingsRateRow[]);
    } catch {
      setError("Failed to load savings rate rows");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchRows(); }, [fetchRows]);

  const handleEdit = (row: SavingsRateRow) => {
    setEditingId(row._id?.toString() ?? null);
    setForm({
      sn: String(row.sn),
      savingsType: row.savingsType,
      interestRate: row.interestRate,
      displayOrder: String(row.displayOrder),
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.savingsType.trim() || !form.interestRate.trim() || !form.sn.trim()) {
      setError("S.N, Savings Type, and Interest Rate are required");
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/savings?id=${editingId}` : "/api/admin/savings";
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sn: Number(form.sn),
          savingsType: form.savingsType.trim(),
          interestRate: form.interestRate.trim(),
          displayOrder: form.displayOrder.trim() ? Number(form.displayOrder) : Number(form.sn),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to save");
      setForm(emptyForm());
      setEditingId(null);
      setShowForm(false);
      setError("");
      await fetchRows();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save row");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this savings rate row?")) return;
    try {
      const res = await fetch(`/api/admin/savings?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      await fetchRows();
    } catch {
      setError("Failed to delete row");
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowForm(false);
    setError("");
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Table2 size={14} className="text-[#0d837f]" />
            Savings Rates Table
          </span>
        }
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => void fetchRows()}
              aria-label="Refresh"
              className="rounded text-slate-400 transition-colors hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d837f]/40"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            {!showForm && (
              <Button
                size="sm"
                onClick={() => { setForm(emptyForm()); setEditingId(null); setShowForm(true); }}
              >
                <Plus size={12} /> ADD ROW
              </Button>
            )}
          </div>
        }
      />

      {error && (
        <div className="px-6 pt-4">
          <ErrorState message={error} />
        </div>
      )}

      {showForm && (
        <div className="border-b border-slate-100 bg-slate-50 p-6">
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
            {editingId ? "Edit Row" : "Add New Row"}
          </p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">S.N</label>
              <input
                type="number"
                value={form.sn}
                onChange={(e) => setForm({ ...form, sn: e.target.value })}
                placeholder="1"
                className={inputCls}
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-700">SAVINGS TYPE</label>
              <input
                value={form.savingsType}
                onChange={(e) => setForm({ ...form, savingsType: e.target.value })}
                placeholder="Compulsory saving"
                className={inputCls}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">INTEREST RATE</label>
              <input
                value={form.interestRate}
                onChange={(e) => setForm({ ...form, interestRate: e.target.value })}
                placeholder="7.5%"
                className={inputCls}
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button onClick={() => void handleSave()} disabled={saving}>
              <Save size={14} />
              {editingId ? "UPDATE ROW" : "SAVE ROW"}
            </Button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 text-xs font-bold text-slate-400 transition-colors hover:text-slate-600"
            >
              <X size={12} /> CANCEL
            </button>
          </div>
        </div>
      )}

      <div className={tableClasses.wrap}>
        {loading ? (
          <SkeletonTable rows={4} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Table2 className="h-5 w-5" />}
            title="No rows yet"
            description="The public page will show the default built-in table. Add rows here to override it."
          />
        ) : (
          <table className={tableClasses.table}>
            <thead className={tableClasses.thead}>
              <tr>
                <th className={cx(tableClasses.th, "w-16")}>S.N</th>
                <th className={tableClasses.th}>Savings Type</th>
                <th className={tableClasses.th}>Interest Rate (%)</th>
                <th className={cx(tableClasses.thRight, "w-24")}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row._id?.toString()} className={cx(tableClasses.tr, "group")}>
                  <td className={cx(tableClasses.td, "font-medium text-[#123451]")}>{row.sn}</td>
                  <td className={tableClasses.td}>{row.savingsType}</td>
                  <td className={cx(tableClasses.td, "font-semibold text-[#0d837f]")}>{row.interestRate}</td>
                  <td className={tableClasses.tdRight}>
                    <div className="flex items-center justify-end gap-3 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => handleEdit(row)}
                        className="flex items-center gap-1 text-[10px] font-bold text-[#0d837f] hover:underline"
                      >
                        <Edit3 size={10} /> EDIT
                      </button>
                      <button
                        onClick={() => void handleDelete(row._id?.toString() ?? "")}
                        className="flex items-center gap-1 text-[10px] font-bold text-red-500 hover:underline"
                      >
                        <Trash2 size={10} /> DELETE
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
}
