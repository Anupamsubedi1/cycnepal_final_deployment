"use client";

import { useState } from "react";

const BASE = "/financial%20highlights/Quaterly%20report";

type QuarterlyReportCard = {
  title: string;
  fileUrl: string;
  fileType: string;
  fileName: string;
};

type QuarterlyYearGroup = {
  year: string;
  reports: QuarterlyReportCard[];
};

type Props = {
  years: QuarterlyYearGroup[];
  cardFormatLabel: string;
  downloadLabel: string;
};

function PdfIconBanner({ label, fileType, fileUrl }: { label: string; fileType: string; fileUrl: string }) {
  const url = fileType === "image" ? fileUrl : `${BASE}/pdf%20icon.jpeg`;

  return (
    <div className="w-full h-1/2 min-h-32 flex items-center justify-center bg-white">
      <img
        src={url}
        alt={`${label} ${fileType.toUpperCase()}`}
        className="h-[85%] w-auto max-h-28 object-contain select-none"
        draggable={false}
      />
    </div>
  );
}

export default function QuarterlyReportsView({ years, cardFormatLabel, downloadLabel }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  const currentYearData = years[activeIndex] || years[0];

  if (!currentYearData) {
    return null;
  }

  return (
    <div className="flex flex-col md:flex-row gap-8 items-start">
      <aside className="w-full md:w-36 shrink-0 flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
        {years.map((item, index) => (
          <button
            key={item.year}
            onClick={() => setActiveIndex(index)}
            className={`whitespace-nowrap px-4 py-3 text-sm font-medium text-left transition-colors duration-150 ${
              activeIndex === index
                ? "bg-[#0d837f] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {item.year}
          </button>
        ))}
      </aside>

      <div className="flex-1 grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
        {currentYearData.reports.map((report) => (
          <article
            key={report.fileName || report.title}
            className="flex flex-col bg-[#0d837f] shadow-md text-white overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:brightness-95"
          >
            <PdfIconBanner label={report.title} fileType={report.fileType} fileUrl={report.fileUrl} />

            <div className="flex flex-col flex-1 px-4 pt-4 pb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-white/70">
                {report.fileType === "pdf" ? cardFormatLabel : report.fileType.toUpperCase()}
              </p>
              <h3 className="mt-1 text-sm font-semibold text-white leading-snug">
                {report.title}
              </h3>

              <div className="mt-auto pt-4">
                <a
                  href={report.fileUrl}
                  download={report.fileName || report.title}
                  className="inline-flex items-center gap-2 bg-white px-3 py-1.5 text-xs font-semibold text-[#0d837f] transition hover:bg-gray-100"
                >
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 shrink-0"
                  >
                    <path
                      d="M8 2v8M5 7l3 3 3-3"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <line
                      x1="3"
                      y1="13"
                      x2="13"
                      y2="13"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                  {downloadLabel}
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}