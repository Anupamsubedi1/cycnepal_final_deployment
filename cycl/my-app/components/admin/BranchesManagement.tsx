"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Edit3, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import type { BranchOffice } from "@/services/branches-service";
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  SkeletonTable,
  cx,
} from "@/components/admin/ui";

interface Props {
  provinceId: string;
  provinceLabel: string;
}

type BranchForm = {
  branchName: string;
  manager: string;
  address: string;
  phone: string;
  email: string;
  displayOrder: string;
};

function emptyForm(): BranchForm {
  return { branchName: "", manager: "", address: "", phone: "", email: "", displayOrder: "" };
}

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-[#0d837f] focus-visible:ring-2 focus-visible:ring-[#0d837f]/30";

export default function BranchesManagement({ provinceId, provinceLabel }: Props) {
  const [branches, setBranches] = useState<BranchOffice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BranchForm>(emptyForm());
  const [showForm, setShowForm] = useState(false);

  const fetchBranches = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/branches?province=${provinceId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      setBranches((await res.json()) as BranchOffice[]);
    } catch {
      setError("Failed to load branches");
    } finally {
      setLoading(false);
    }
  }, [provinceId]);

  useEffect(() => { void fetchBranches(); }, [fetchBranches]);

  const handleEdit = (branch: BranchOffice) => {
    setEditingId(branch._id?.toString() ?? null);
    setForm({
      branchName: branch.branchName,
      manager: branch.manager,
      address: branch.address,
      phone: branch.phone,
      email: branch.email,
      displayOrder: String(branch.displayOrder),
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.branchName.trim()) {
      setError("Branch name is required");
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/branches?id=${editingId}` : "/api/admin/branches";
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provinceId,
          branchName: form.branchName.trim(),
          manager: form.manager.trim(),
          address: form.address.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          displayOrder: form.displayOrder.trim() ? Number(form.displayOrder) : 0,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to save");
      setForm(emptyForm());
      setEditingId(null);
      setShowForm(false);
      setError("");
      await fetchBranches();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save branch");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this branch office?")) return;
    try {
      const res = await fetch(`/api/admin/branches?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      await fetchBranches();
    } catch {
      setError("Failed to delete branch");
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
            <Building2 size={14} className="text-[#0d837f]" />
            Branch Offices — {provinceLabel}
          </span>
        }
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => void fetchBranches()}
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
                <Plus size={12} /> ADD BRANCH
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
            {editingId ? "Edit Branch" : "Add New Branch Office"}
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">BRANCH NAME <span className="text-red-400">*</span></label>
              <input
                value={form.branchName}
                onChange={(e) => setForm({ ...form, branchName: e.target.value })}
                placeholder="Katahari Branch"
                className={inputCls}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">BRANCH MANAGER</label>
              <input
                value={form.manager}
                onChange={(e) => setForm({ ...form, manager: e.target.value })}
                placeholder="Manager Name"
                className={inputCls}
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-700">ADDRESS</label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Municipality Ward, District"
                className={inputCls}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">PHONE</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="9857646263"
                className={inputCls}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">EMAIL</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="branch.cycnlbsl@gmail.com"
                className={inputCls}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">DISPLAY ORDER</label>
              <input
                type="number"
                value={form.displayOrder}
                onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
                placeholder="0"
                className={inputCls}
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button onClick={() => void handleSave()} disabled={saving}>
              <Save size={14} />
              {editingId ? "UPDATE BRANCH" : "SAVE BRANCH"}
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

      <div className="divide-y divide-slate-50">
        {loading ? (
          <SkeletonTable rows={3} />
        ) : branches.length === 0 ? (
          <EmptyState
            icon={<Building2 className="h-5 w-5" />}
            title="No custom branches added yet"
            description="The public page shows the built-in static branch list. Add branches here to replace the static data for this province."
          />
        ) : (
          branches.map((branch) => (
            <div key={branch._id?.toString()} className="group p-4 transition-colors hover:bg-slate-50">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-slate-700">{branch.branchName}</h4>
                  <p className="text-xs italic text-slate-500">{branch.manager}</p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-400">
                    {branch.address && <span>{branch.address}</span>}
                    {branch.phone && <span>📞 {branch.phone}</span>}
                    {branch.email && <span>✉ {branch.email}</span>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-3 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => handleEdit(branch)}
                    className="flex items-center gap-1 text-[10px] font-bold text-[#0d837f] hover:underline"
                  >
                    <Edit3 size={10} /> EDIT
                  </button>
                  <button
                    onClick={() => void handleDelete(branch._id?.toString() ?? "")}
                    className={cx("flex items-center gap-1 text-[10px] font-bold text-red-400 hover:underline")}
                  >
                    <Trash2 size={10} /> DELETE
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
