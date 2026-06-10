"use client";

import { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";
import type { MarqueeSettings } from "@/services/marquee-service";
import { Button, Card, CardBody, CardHeader, SkeletonCard } from "@/components/admin/ui";

const defaultMarqueeText =
  " 📢 Welcome to CYC Nepal Laghubitta Bittiya Sanstha Ltd. • 124 Branch Offices Nationwide • Loan & Saving Services • Empowering Communities Through Microfinance • Visit Us at Sabhagriha Chowk, Pokhara • Call: 061-590894 ";

const inputCls =
  "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0d837f] focus-visible:ring-2 focus-visible:ring-[#0d837f]/30 transition-colors";

export default function MarqueeManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [textEn, setTextEn] = useState("");
  const [textNe, setTextNe] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/marquee");
      if (res.ok) {
        const data = (await res.json()) as MarqueeSettings;
        setTextEn(data.textEn ?? defaultMarqueeText);
        setTextNe(data.textNe ?? "");
      }
    } catch {
      setError("Failed to load marquee settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/marquee", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textEn, textNe }),
      });
      if (!res.ok) throw new Error(((await res.json()) as { error?: string }).error ?? "Failed to save");
      setSuccess("Marquee updated!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SkeletonCard className="h-64" />;

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Marquee / Ticker Text"
        action={
          <div className="flex items-center gap-3">
            {success && <span className="text-xs text-emerald-600 font-semibold">{success}</span>}
            {error && <span className="text-xs text-red-500 font-semibold">{error}</span>}
            <Button onClick={() => void handleSave()} disabled={saving} size="sm">
              <Save size={14} /> {saving ? "SAVING..." : "UPDATE"}
            </Button>
          </div>
        }
      />

      <CardBody className="space-y-5">
        <p className="text-xs text-slate-500 leading-relaxed">
          This text scrolls across the bottom of every page. Use &nbsp;<code className="bg-slate-100 px-1 rounded">•</code>&nbsp; to separate items.
          Leave Nepali blank to always show English.
        </p>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">Text (English)</label>
          <textarea
            value={textEn}
            onChange={(e) => setTextEn(e.target.value)}
            rows={3}
            className={inputCls}
            placeholder="📢 Welcome to CYC Nepal • Item two • Item three"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">Text (Nepali)</label>
          <textarea
            value={textNe}
            onChange={(e) => setTextNe(e.target.value)}
            rows={3}
            className={inputCls}
            placeholder="📢 CYC नेपाल मा स्वागत छ • आइटम दुई • आइटम तीन"
          />
        </div>

        {/* Live preview */}
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-700">Preview</p>
          <div className="bg-[#016f81] text-white text-sm font-medium px-4 py-2 rounded-lg overflow-hidden whitespace-nowrap text-ellipsis opacity-90">
            {textEn || <span className="opacity-40 italic">No text set</span>}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
