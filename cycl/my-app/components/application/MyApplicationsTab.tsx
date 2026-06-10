"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import JobDetailsModal from "./JobDetailsModal";

interface Application {
  _id: string;
  vacancyId: string;
  jobCode: string;
  jobTitle: string;
  publishedDate: string;
  expiryDate: string;
  status: "submitted" | "reviewed" | "selected" | "rejected";
}

export default function MyApplicationsTab() {
  const params = useParams();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await fetch("/api/user/applications");
        if (res.ok) {
          const data = await res.json();
          setApplications(data.applications || []);
        }
      } catch (error) {
        console.error("Error fetching applications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const statusStyles: Record<string, { bg: string; text: string }> = {
    submitted: { bg: "bg-blue-100", text: "text-blue-800" },
    reviewed: { bg: "bg-yellow-100", text: "text-yellow-800" },
    selected: { bg: "bg-green-100", text: "text-green-800" },
    rejected: { bg: "bg-red-100", text: "text-red-800" },
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading applications...</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f9fcfe] border-b border-[#d6e6ed]">
                <th className="px-6 py-4 text-left font-semibold text-gray-700">
                  Job Code
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">
                  Job Title
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">
                  Published Date
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">
                  Expiry Date
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No applications found. Start applying for jobs now!
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr
                    key={app._id}
                    className="border-b border-[#eef4f7] hover:bg-[#f9fcfe] transition"
                  >
                    <td className="px-6 py-4 text-gray-700">{app.jobCode}</td>
                    <td className="px-6 py-4 font-medium text-[#123451]">
                      {app.jobTitle}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {new Date(app.publishedDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {new Date(app.expiryDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          statusStyles[app.status]?.bg
                        } ${statusStyles[app.status]?.text}`}
                      >
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedJobId(app.vacancyId)}
                        className="inline-flex items-center justify-center bg-[#0d837f] hover:bg-[#08716e] text-white px-4 py-2 rounded font-medium text-sm transition"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedJobId && (
        <JobDetailsModal
          jobId={selectedJobId}
          onClose={() => setSelectedJobId(null)}
        />
      )}
    </>
  );
}
