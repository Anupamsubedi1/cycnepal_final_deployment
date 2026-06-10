import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="flex max-w-md flex-col items-center rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
          <svg
            className="h-10 w-10 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
        </div>
        <h1 className="mt-5 text-2xl font-bold text-gray-900">Access Restricted</h1>
        <p className="mt-3 text-sm text-gray-500">
          You do not have permission to view this page. Please contact your administrator
          if you believe this is a mistake.
        </p>
        <Link
          href="/admin"
          className="mt-7 inline-flex items-center rounded-lg bg-[#0F172B] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1e2d4a]"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
