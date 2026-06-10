"use client";

import { useEffect, useState } from "react";

interface JobDetailsModalProps {
  jobId: string;
  onClose: () => void;
}

interface JobDetails {
  _id: string;
  title: string;
  position: string;
  department: string;
  location: string;
  description: string;
  salary?: string;
  experience?: string;
  qualification?: string;
  applicationDeadline?: string;
  numberOfPositions?: number;
}

export default function JobDetailsModal({
  jobId,
  onClose,
}: JobDetailsModalProps) {
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const res = await fetch(`/api/vacancies/${jobId}`);
        if (res.ok) {
          const data = await res.json();
          setJobDetails(data);
        }
      } catch (error) {
        console.error("Error fetching job details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-[#0d837f] text-white p-6 flex justify-between items-start">
          <div>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <>
                <h2 className="text-2xl font-bold">{jobDetails?.title}</h2>
                <p className="text-[#e0f2f1] mt-1">
                  {jobDetails?.department} • {jobDetails?.location}
                </p>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-2xl hover:text-[#e0f2f1] transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <p className="text-center text-gray-600">Loading job details...</p>
          ) : jobDetails ? (
            <>
              {/* Basic Information */}
              <section>
                <h3 className="text-lg font-bold text-[#123451] mb-4">
                  Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Job Position</p>
                    <p className="font-semibold text-gray-800">
                      {jobDetails.position}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Department</p>
                    <p className="font-semibold text-gray-800">
                      {jobDetails.department}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-semibold text-gray-800">
                      {jobDetails.location}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">No. of Positions</p>
                    <p className="font-semibold text-gray-800">
                      {jobDetails.numberOfPositions || "1"}
                    </p>
                  </div>
                </div>
              </section>

              {/* Key Details */}
              <section>
                <h3 className="text-lg font-bold text-[#123451] mb-4">
                  Key Details
                </h3>
                <div className="space-y-3">
                  {jobDetails.salary && (
                    <div className="flex justify-between border-b border-[#d6e6ed] pb-2">
                      <span className="text-gray-600">Salary:</span>
                      <span className="font-semibold text-gray-800">
                        {jobDetails.salary}
                      </span>
                    </div>
                  )}
                  {jobDetails.experience && (
                    <div className="flex justify-between border-b border-[#d6e6ed] pb-2">
                      <span className="text-gray-600">Experience:</span>
                      <span className="font-semibold text-gray-800">
                        {jobDetails.experience}
                      </span>
                    </div>
                  )}
                  {jobDetails.qualification && (
                    <div className="flex justify-between border-b border-[#d6e6ed] pb-2">
                      <span className="text-gray-600">Qualification:</span>
                      <span className="font-semibold text-gray-800">
                        {jobDetails.qualification}
                      </span>
                    </div>
                  )}
                  {jobDetails.applicationDeadline && (
                    <div className="flex justify-between border-b border-[#d6e6ed] pb-2">
                      <span className="text-gray-600">Application Deadline:</span>
                      <span className="font-semibold text-gray-800">
                        {new Date(
                          jobDetails.applicationDeadline
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </section>

              {/* Description */}
              <section>
                <h3 className="text-lg font-bold text-[#123451] mb-4">
                  Job Description
                </h3>
                <p className="text-gray-700 leading-relaxed line-clamp-5">
                  {jobDetails.description}
                </p>
              </section>
            </>
          ) : (
            <p className="text-center text-gray-600">
              Unable to load job details
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#f9fcfe] border-t border-[#d6e6ed] px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-[#0d837f] text-[#0d837f] rounded font-medium hover:bg-[#f0f8f7] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
