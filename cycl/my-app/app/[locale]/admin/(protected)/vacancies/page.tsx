"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Vacancy } from "@/services/vacancy-service";
import { 
  Briefcase, 
  MapPin, 
  Users, 
  Trash2, 
  Edit3, 
  Plus,
  Building2,
  ArrowUpRight,
  Search,
  SlidersHorizontal,
  CheckCircle2,
  XCircle
} from "lucide-react";

export default function AdminVacanciesPage(): React.JSX.Element {
  const params = useParams();
  const locale = typeof params.locale === "string" ? params.locale : "ne";
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchVacancies = async () => {
      try {
        const response = await fetch("/api/admin/vacancies");
        if (!response.ok) {
          setError("Failed to load vacancies");
          return;
        }
        const data = await response.json();
        setVacancies(data);
      } catch (err) {
        console.error(err);
        setError("An error occurred");
      } finally {
        setLoading(false);
      }
    };

    void fetchVacancies();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vacancy? All applications will be deleted.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/vacancies/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        alert("Failed to delete vacancy");
        return;
      }

      setVacancies(vacancies.filter((v) => v._id?.toString() !== id));
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    }
  };

  const filteredVacancies = vacancies.filter(v => {
    const title = locale === "en" ? v.titleEn : v.titleNp;
    return title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
           v.department?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const activeCount = vacancies.filter(v => v.isActive).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50/60 px-6 py-12 lg:px-12">
        <div className="mx-auto max-w-7xl space-y-8 animate-pulse">
          <div className="h-12 w-48 bg-zinc-200" />
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-32 bg-white border border-zinc-200/60 rounded-none" />
              ))}
            </div>
            <div className="h-64 bg-white border border-zinc-200/60 rounded-none" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/60 text-zinc-900 antialiased selection:bg-teal-500/10 Selection:text-teal-700 px-6 py-12 lg:px-12">
      <div className="mx-auto max-w-7xl">
        
        {/* Modern Command Header */}
        <div className="mb-12 flex flex-col justify-between gap-6 sm:flex-row sm:items-end border-b border-zinc-200 pb-8">
          <div>
            <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">
              <Building2 size={14} className="text-teal-600" /> Executive Console
            </div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl font-sans">
              {locale === "en" ? "Vacancies" : "रिक्त पदहरू"}
            </h1>
          </div>
          
          <Link
            href="/admin/vacancies/create"
            className="group inline-flex items-center justify-center gap-2 rounded-none bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-zinc-900/10 transition-all duration-200 hover:bg-zinc-800 hover:shadow-lg active:scale-[0.98]"
          >
            Create Position 
            <Plus size={16} className="transition-transform duration-200 group-hover:rotate-90" strokeWidth={2.5} />
          </Link>
        </div>

        {error && (
          <div className="mb-8 rounded-none border border-red-200 bg-red-50/50 p-4 text-sm font-medium text-red-800 backdrop-blur-sm">
            {error}
          </div>
        )}

        {/* Dynamic Workspace Split */}
        <div className="grid gap-8 lg:grid-cols-3 items-start">
          
          {/* Main Controls & Listing Pipeline (Left Columns) */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Real-time Inline Filter Utility Bar */}
            <div className="flex items-center gap-3 bg-white p-2 rounded-none border border-zinc-200/80 shadow-sm">
              <div className="flex flex-1 items-center gap-2.5 px-3 py-1.5 text-zinc-400">
                <Search size={18} strokeWidth={2} />
                <input 
                  type="text"
                  placeholder="Filter by role or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm text-zinc-800 placeholder-zinc-400 outline-none"
                />
              </div>
              <button className="p-2 text-zinc-400 hover:text-zinc-600 rounded-none hover:bg-zinc-50 transition-colors">
                <SlidersHorizontal size={16} />
              </button>
            </div>

            {/* Structural Listing Render */}
            {filteredVacancies.length === 0 ? (
              <div className="rounded-none border border-dashed border-zinc-200 bg-white/50 py-20 text-center backdrop-blur-sm">
                <Briefcase className="mx-auto h-8 w-8 text-zinc-300" strokeWidth={1.5} />
                <p className="mt-3 text-sm font-medium text-zinc-400">No postings match your layout</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredVacancies.map((vacancy) => (
                  <div
                    key={vacancy._id?.toString()}
                    className="group relative overflow-hidden rounded-none border border-zinc-200/70 bg-white p-6 shadow-sm transition-all duration-300 hover:border-zinc-300 hover:shadow-md hover:shadow-zinc-200/40"
                  >
                    {/* Minimalist Accented Left Border Hook */}
                    <div className={`absolute left-0 top-0 bottom-0 w-[4px] transition-colors ${vacancy.isActive ? 'bg-teal-500' : 'bg-zinc-300'}`} />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-extrabold tracking-wide uppercase text-zinc-500">
                            {vacancy.department}
                          </span>
                          <span className="text-zinc-300 text-sm">•</span>
                          <span className="inline-flex items-center gap-1 text-sm font-semibold text-zinc-600">
                            <MapPin size={13} className="text-zinc-500" />
                            {vacancy.location}
                          </span>
                        </div>
                        
                        <h2 className="text-xl font-black text-zinc-900 group-hover:text-teal-600 transition-colors duration-200 line-clamp-1">
                          {locale === "en" ? vacancy.titleEn : vacancy.titleNp}
                        </h2>
                        
                        <p className="text-sm leading-relaxed text-zinc-500 font-medium line-clamp-1 max-w-xl">
                          {locale === "en" ? vacancy.descriptionEn : vacancy.descriptionNp}
                        </p>
                      </div>

                      {/* Explicit Interactive Portal Action */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-100">
                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">
                          <Link
                            href={`/admin/vacancies/${vacancy._id?.toString()}/edit`}
                            className="p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 rounded-none transition-all"
                            title="Edit"
                          >
                            <Edit3 size={16} />
                          </Link>
                          <button
                            onClick={() => void handleDelete(vacancy._id?.toString() || "")}
                            className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50/50 rounded-none transition-all"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <Link 
                          href={`/admin/vacancies/${vacancy._id?.toString()}/applicants`}
                          className="inline-flex items-center gap-2 rounded-none bg-zinc-50 group-hover:bg-teal-50 px-4 py-2.5 text-sm font-extrabold text-zinc-700 group-hover:text-teal-700 transition-all duration-200"
                        >
                          <Users size={15} /> 
                          <span>Applicants</span>
                          <ArrowUpRight size={15} className="text-zinc-500 group-hover:text-teal-500 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Micro Analytical Sidebar Widget (Right Column) */}
          <div className="space-y-4 lg:sticky lg:top-8">
            <div className="rounded-none border border-zinc-200/80 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-500 mb-4">Pipeline Diagnostics</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-50 p-4 rounded-none border border-zinc-100">
                  <div className="flex items-center justify-between text-emerald-600 mb-1">
                    <CheckCircle2 size={18} />
                    <span className="text-xs font-extrabold uppercase text-zinc-400">Live</span>
                  </div>
                  <div className="text-3xl font-black tracking-tight text-zinc-900">{activeCount}</div>
                  <div className="text-xs font-semibold text-zinc-600 mt-0.5">Active Listing{activeCount !== 1 && 's'}</div>
                </div>

                <div className="bg-zinc-50 p-4 rounded-none border border-zinc-100">
                  <div className="flex items-center justify-between text-zinc-400 mb-1">
                    <XCircle size={18} />
                    <span className="text-xs font-extrabold uppercase text-zinc-400">Draft</span>
                  </div>
                  <div className="text-3xl font-black tracking-tight text-zinc-900">{vacancies.length - activeCount}</div>
                  <div className="text-xs font-semibold text-zinc-600 mt-0.5">Offline Roles</div>
                </div>
              </div>

              <div className="mt-5 border-t border-zinc-100 pt-4">
                <div className="flex items-center justify-between text-sm font-semibold text-zinc-600">
                  <span>Total Managed Roles</span>
                  <span className="font-black text-base text-zinc-900 bg-zinc-100 px-2.5 py-0.5 rounded-none">{vacancies.length}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}