"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface VacancyWise {
  vacancyId: string;
  titleEn: string;
  titleNp: string;
  totalPaidApplications: number;
  totalAmount: number;
  esewaCount: number;
  esewaAmount: number;
  khaltiCount: number;
  khaltiAmount: number;
}

interface AnalyticsData {
  paymentSummary: {
    totalPaidApplications: number;
    totalAmount: number;
    esewaAmount: number;
    esewaCount: number;
    khaltiAmount: number;
    khaltiCount: number;
    totalCount: number;
  };
  vacancyWise: VacancyWise[];
}

function Badge({ value, color }: { value: number | string; color: string }) {
  return (
    <span
      className="inline-flex min-w-[52px] items-center justify-center rounded-full px-3 py-0.5 text-xs font-bold text-white"
      style={{ backgroundColor: color }}
    >
      {value}
    </span>
  );
}

function MoneyBadge({ value, color }: { value: number; color: string }) {
  return (
    <span
      className="inline-flex min-w-[80px] items-center justify-center rounded-full px-3 py-0.5 text-xs font-bold text-white"
      style={{ backgroundColor: color }}
    >
      Rs: {value.toLocaleString()}
    </span>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-2.5 last:border-0">
      <span className="text-sm text-gray-700">{label}</span>
      {children}
    </div>
  );
}

function Card({
  title,
  children,
  viewLink,
}: {
  title: string;
  children: React.ReactNode;
  viewLink?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded shadow-sm flex flex-col">
      <div className="flex items-center justify-between border-b border-[#00adef] px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        <button className="text-gray-400 text-xs hover:text-gray-600">—</button>
      </div>
      <div className="flex-1 px-4 py-3">{children}</div>
      {viewLink && (
        <div className="border-t border-gray-100 px-4 py-2 text-right">
          <Link
            href={viewLink}
            className="text-xs text-blue-600 hover:underline"
          >
            View Transaction
          </Link>
        </div>
      )}
    </div>
  );
}

export default function AnalyticsDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedVacancyIdx, setSelectedVacancyIdx] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/admin/vacancies/analytics");
        if (!res.ok) {
          setError("Failed to load analytics data");
          return;
        }
        const json = (await res.json()) as AnalyticsData;
        setData(json);
      } catch {
        setError("An error occurred");
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse p-6">
        <div className="mb-4 h-8 w-72 rounded bg-gray-200" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-48 rounded border border-gray-200 bg-white" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-sm text-red-600">{error || "No data available"}</div>
    );
  }

  const { paymentSummary, vacancyWise } = data;

  const selectedVacancy: VacancyWise | null =
    vacancyWise.length > 0 ? (vacancyWise[selectedVacancyIdx] ?? null) : null;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <div className="border-b border-gray-200 bg-white px-6 py-3 flex items-center justify-between">
        <h1 className="text-base font-semibold text-gray-800">
          Recruitment Payment Summary Dashboard
        </h1>
        <button
          onClick={() => window.location.reload()}
          className="rounded bg-teal-600 px-3 py-1.5 text-xs text-white hover:bg-teal-700 transition"
        >
          Refresh
        </button>
      </div>

      <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* ── Row 1: Overall Payment Summary ── */}
        <Card title="Payment Summary" viewLink="/admin/vacancies/transactions">
          <Row label="No Of Total Paid Application :">
            <Badge value={paymentSummary.totalPaidApplications} color="#c0392b" />
          </Row>
          <Row label="Total Transaction Amount :">
            <MoneyBadge value={paymentSummary.totalAmount} color="#2ecc71" />
          </Row>
          <Row label="Esewa भुक्तानी:">
            <Badge value={paymentSummary.esewaAmount} color="#2ecc71" />
          </Row>
          <Row label="Khalti भुक्तानी:">
            <Badge value={paymentSummary.khaltiAmount} color="#c0392b" />
          </Row>
        </Card>

        <Card title="Payment Count Summary" viewLink="/admin/vacancies/transactions">
          <Row label="No Of Total Payment :">
            <Badge value={paymentSummary.totalCount} color="#c0392b" />
          </Row>
          <Row label="Esewa Payment Count:">
            <Badge value={paymentSummary.esewaCount} color="#2ecc71" />
          </Row>
          <Row label="Khalti Payment Count:">
            <Badge value={paymentSummary.khaltiCount} color="#c0392b" />
          </Row>
        </Card>

        {/* ── Row 2: Vacancy Lot Wise ── */}
        <Card title="Vacancy Lot Wise Payment Summary" viewLink="/admin/vacancies/transactions">
          {vacancyWise.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">No paid applications yet</p>
          ) : (
            <>
              <div className="mb-3">
                <select
                  value={selectedVacancyIdx}
                  onChange={(e) => setSelectedVacancyIdx(Number(e.target.value))}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  {vacancyWise.map((v, i) => (
                    <option key={v.vacancyId} value={i}>
                      {v.titleNp || v.titleEn}
                    </option>
                  ))}
                </select>
              </div>
              {selectedVacancy && (
                <>
                  <Row label="Vacancy Lot Wise No Of Paid Application :">
                    <Badge value={selectedVacancy.totalPaidApplications} color="#3498db" />
                  </Row>
                  <Row label="Vacancy Lot Wise Total Amount :">
                    <MoneyBadge value={selectedVacancy.totalAmount} color="#e91e8c" />
                  </Row>
                  <Row label="Esewa भुक्तानी:">
                    <Badge value={selectedVacancy.esewaAmount} color="#c0392b" />
                  </Row>
                  <Row label="Khalti भुक्तानी:">
                    <Badge value={selectedVacancy.khaltiAmount} color="#c0392b" />
                  </Row>
                </>
              )}
            </>
          )}
        </Card>

        <Card title="Vacancy Lot Wise Payment Count Summary" viewLink="/admin/vacancies/transactions">
          {!selectedVacancy ? (
            <p className="py-6 text-center text-sm text-gray-400">No paid applications yet</p>
          ) : (
            <>
              <Row label="Vacancy Lot Wise No Of Payment :">
                <Badge
                  value={selectedVacancy.esewaCount + selectedVacancy.khaltiCount}
                  color="#3498db"
                />
              </Row>
              <Row label="Esewa Payment Count:">
                <Badge value={selectedVacancy.esewaCount} color="#2ecc71" />
              </Row>
              <Row label="Khalti Payment Count:">
                <Badge value={selectedVacancy.khaltiCount} color="#c0392b" />
              </Row>
            </>
          )}
        </Card>

        {/* ── Row 3: Exam Center (placeholder — not implemented) ── */}
        <Card title="Exam Center Wise Payment Summary" viewLink="/admin/vacancies/transactions">
          <Row label="No Of Total Paid Application :">
            <Badge value={0} color="#c0392b" />
          </Row>
          <Row label="Total Transaction Amount :">
            <MoneyBadge value={0} color="#2ecc71" />
          </Row>
        </Card>

        <Card title="Exam Center with Vacancy Lot Wise Payment Summary" viewLink="/admin/vacancies/transactions">
          <Row label="Vacancy Lot Wise No Of Paid Application :">
            <Badge value={0} color="#3498db" />
          </Row>
          <Row label="Vacancy Lot Wise Total Amount :">
            <MoneyBadge value={0} color="#e91e8c" />
          </Row>
        </Card>

      </div>
    </div>
  );
}
