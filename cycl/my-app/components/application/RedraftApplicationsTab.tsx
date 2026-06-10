"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import JobDetailsModal from "./JobDetailsModal";

interface RedraftApplication {
  _id: string;
  vacancyId: string;
  jobCode: string;
  jobTitle: string;
  publishedDate: string;
  expiryDate: string;
  savedAt: string;
}

export default function RedraftApplicationsTab() {
  const params = useParams();
  const [applications, setApplications] = useState<RedraftApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRedraftApplications = async () => {
      try {
        const res = await fetch("/api/user/applications/draft");
        if (res.ok) {
          const data = await res.json();
          setApplications(data.applications || []);
        }
      } catch (error) {
        console.error("Error fetching draft applications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRedraftApplications();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading redraft applications...</p>
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
                  Last Saved
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
                    No redraft applications found.
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
                    <td className="px-6 py-4 text-gray-700">
                      {new Date(app.savedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <Link
                        href={`/${params.locale}/vacancies/${app.vacancyId}/apply?draft=${app._id}`}
                        className="inline-flex items-center justify-center bg-[#0d837f] hover:bg-[#08716e] text-white px-4 py-2 rounded font-medium text-sm transition"
                      >
                        Continue
                      </Link>
                      <button
                        onClick={() => setSelectedJobId(app.vacancyId)}
                        className="inline-flex items-center justify-center bg-[#0a6b68] hover:bg-[#085856] text-white px-4 py-2 rounded font-medium text-sm transition"
                      >
                        View
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
