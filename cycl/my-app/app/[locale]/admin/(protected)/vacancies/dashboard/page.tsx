"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiBriefcase, FiCheckCircle, FiXCircle, FiUsers } from "react-icons/fi";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  ErrorState,
  PageHeader,
  SkeletonCard,
  StatCard,
  tableClasses,
} from "@/components/admin/ui";
import type { AdminTone } from "@/lib/design-tokens";

interface VacancySummary {
  _id: string;
  titleEn: string;
  titleNp: string;
  department: string;
  createdAt: string;
  applicationDeadline: string | null;
  isActive: boolean;
  appliedCount: number;
}

interface DashboardData {
  activeJobs: VacancySummary[];
  expiredJobs: VacancySummary[];
  summary: {
    totalOpenings: number;
    activeOpenings: number;
    closedOpenings: number;
  };
  applicationSummary: {
    totalCandidates: number;
    submitted: number;
    pendingApproval: number;
    selected: number;
    approved: number;
    rejected: number;
    paid: number;
    notPaid: number;
    total: number;
  };
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** A summary breakdown row: label on the left, a tone-coded count pill right. */
function SummaryRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: AdminTone;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2.5 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <Badge variant={tone}>{value}</Badge>
    </div>
  );
}

function JobsTable({
  title,
  jobs,
  emptyLabel,
  viewLabel,
}: {
  title: string;
  jobs: VacancySummary[];
  emptyLabel: string;
  viewLabel: string;
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader title={title} action={<Badge variant="neutral">{jobs.length}</Badge>} />
      <div className={tableClasses.wrap}>
        <table className={tableClasses.table}>
          <thead className={tableClasses.thead}>
            <tr>
              <th className={tableClasses.th}>Job Code</th>
              <th className={tableClasses.th}>Job Title</th>
              <th className={tableClasses.th}>Posted Date</th>
              <th className={tableClasses.th}>Expires On</th>
              <th className={tableClasses.thRight}>Applied</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState title={emptyLabel} icon={<FiBriefcase className="h-5 w-5" />} />
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr key={job._id} className={tableClasses.tr}>
                  <td className={tableClasses.td}>
                    <Link
                      href={`/admin/vacancies/${job._id}/applicants`}
                      className="font-medium text-[#0d837f] hover:underline"
                    >
                      {job._id.slice(-8).toUpperCase()}
                    </Link>
                  </td>
                  <td className={tableClasses.td}>
                    <Link
                      href={`/admin/vacancies/${job._id}/applicants`}
                      className="text-slate-700 hover:text-[#0d837f] hover:underline"
                    >
                      {job.titleNp || job.titleEn}
                    </Link>
                  </td>
                  <td className={tableClasses.td}>{formatDate(job.createdAt)}</td>
                  <td className={tableClasses.td}>{formatDate(job.applicationDeadline)}</td>
                  <td className={tableClasses.tdRight}>
                    <Badge variant="accent">{job.appliedCount}</Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-auto border-t border-slate-100 px-5 py-3 text-right">
        <Link href="/admin/vacancies" className="text-xs font-semibold text-[#0d837f] hover:underline">
          {viewLabel} ({jobs.length})
        </Link>
      </div>
    </Card>
  );
}

export default function VacancyDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/admin/vacancies/dashboard");
        if (!res.ok) {
          setError("Failed to load dashboard data");
          return;
        }
        const json = await res.json() as DashboardData;
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
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {[0, 1, 2, 3].map((n) => (
            <SkeletonCard key={n} className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {[0, 1].map((n) => (
            <SkeletonCard key={n} className="h-72" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error || "No data available"} />;
  }

  const { activeJobs, expiredJobs, summary, applicationSummary } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recruitment Admin Dashboard"
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
              Refresh Data
            </Button>
            <ButtonLink variant="primary" size="sm" href="/admin/vacancies">
              Manage Vacancies
            </ButtonLink>
          </>
        }
      />

      {/* Headline KPIs */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="Total Openings"
          value={summary.totalOpenings}
          tone="accent"
          icon={<FiBriefcase className="h-5 w-5" />}
        />
        <StatCard
          label="Active Openings"
          value={summary.activeOpenings}
          tone="success"
          icon={<FiCheckCircle className="h-5 w-5" />}
        />
        <StatCard
          label="Closed Openings"
          value={summary.closedOpenings}
          tone="danger"
          icon={<FiXCircle className="h-5 w-5" />}
        />
        <StatCard
          label="Total Candidates"
          value={applicationSummary.totalCandidates}
          tone="info"
          icon={<FiUsers className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <JobsTable
          title="Active Jobs"
          jobs={activeJobs}
          emptyLabel="No active jobs"
          viewLabel="View Active Jobs"
        />
        <JobsTable
          title="Expired Jobs"
          jobs={expiredJobs}
          emptyLabel="No expired jobs"
          viewLabel="View Expired Jobs"
        />

        {/* Job Opening Summary */}
        <Card className="flex flex-col">
          <CardHeader title="Job Opening Summary" />
          <CardBody className="py-2">
            <SummaryRow label="Total No Of Openings:" value={summary.totalOpenings} tone="info" />
            <SummaryRow label="Active No Of Openings:" value={summary.activeOpenings} tone="success" />
            <SummaryRow label="Closed No Of Openings:" value={summary.closedOpenings} tone="danger" />
            <SummaryRow label="Archived No Of Openings:" value={0} tone="neutral" />
            <SummaryRow label="Drafted No Of Openings:" value={0} tone="neutral" />
          </CardBody>
          <div className="mt-auto border-t border-slate-100 px-5 py-3 text-right">
            <Link href="/admin/vacancies" className="text-xs font-semibold text-[#0d837f] hover:underline">
              View Job Openings
            </Link>
          </div>
        </Card>

        {/* Job Application Summary */}
        <Card className="flex flex-col">
          <CardHeader title="Job Application Summary" />
          <CardBody className="py-2">
            <SummaryRow label="No Of Candidates:" value={applicationSummary.totalCandidates} tone="accent" />
            <SummaryRow label="No Of Submitted Applications:" value={applicationSummary.submitted} tone="info" />
            <SummaryRow label="No Of Pending for Approvals:" value={applicationSummary.pendingApproval} tone="warning" />
            <SummaryRow label="No Of Selected Applications:" value={applicationSummary.selected} tone="accent" />
            <SummaryRow label="No Of Rejected Applications:" value={applicationSummary.rejected} tone="danger" />
            <SummaryRow label="No Of Approved Applications:" value={applicationSummary.approved} tone="success" />
            <SummaryRow label="No Of Paid Applications:" value={applicationSummary.paid} tone="success" />
            <SummaryRow label="No Of Not Paid Applications:" value={applicationSummary.notPaid} tone="warning" />
          </CardBody>
          <div className="mt-auto border-t border-slate-100 px-5 py-3 text-right">
            <Link href="/admin/vacancies" className="text-xs font-semibold text-[#0d837f] hover:underline">
              View Applications
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
