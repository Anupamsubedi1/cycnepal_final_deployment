"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import NepaliDate from "nepali-date-converter";

interface DatePickerProps {
  value?: string; // YYYY-MM-DD (AD if calendar==='ad', BS if 'bs')
  onChange?: (isoDate: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  calendar?: "ad" | "bs";
  yearRange?: number; // number of years on either side of center to show
}

function formatISO(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export default function DatePicker({ value, onChange, placeholder, id, className, calendar = "ad", yearRange = 25 }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  // internal stores AD Date for highlighting in AD mode, and BS string in BS mode
  const [internal, setInternal] = useState<Date | string | null>(
    value ? (calendar === "ad" ? new Date(value) : String(value)) : null
  );
  // viewDate for AD mode; viewYear/viewMonth for BS mode
  const [viewDate, setViewDate] = useState<Date>(calendar === "ad" && internal instanceof Date ? internal : new Date());
  const [bsViewYear, setBsViewYear] = useState<number>(() => {
    try {
      const cur = NepaliDate.fromAD(new Date()).format("YYYY-MM-DD");
      return Number(cur.split("-")[0]);
    } catch {
      return 2080;
    }
  });
  const [bsViewMonth, setBsViewMonth] = useState<number>(() => {
    try {
      const cur = NepaliDate.fromAD(new Date()).format("YYYY-MM-DD");
      return Number(cur.split("-")[1]);
    } catch {
      return 1;
    }
  });
  const ref = useRef<HTMLDivElement | null>(null);
  const [yearMenuOpen, setYearMenuOpen] = useState(false);
  const [bsYearMenuOpen, setBsYearMenuOpen] = useState(false);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  useEffect(() => {
    if (value) {
      if (calendar === "ad") {
        setInternal(new Date(value));
        setViewDate(new Date(value));
      } else {
        setInternal(String(value));
        try {
          const parts = String(value).split("-");
          if (parts.length >= 2) {
            setBsViewYear(Number(parts[0]));
            setBsViewMonth(Number(parts[1]));
          }
        } catch {
          // ignore
        }
      }
    }
  }, [value, calendar]);

  const selectDate = (d: Date | { bsIso: string; adDate: Date }) => {
    if (calendar === "ad" && d instanceof Date) {
      setInternal(d);
      setOpen(false);
      onChange?.(formatISO(d));
      return;
    }
    if (calendar === "bs" && !(d instanceof Date)) {
      setInternal(d.bsIso);
      setOpen(false);
      onChange?.(d.bsIso);
      return;
    }
  };

  const buildCalendar = (date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const startDay = start.getDay();
    const days: (Date | null)[] = [];
    // pad previous month
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let d = 1; d <= end.getDate(); d++) days.push(new Date(date.getFullYear(), date.getMonth(), d));
    return days;
  };

  const days = calendar === "ad" ? buildCalendar(viewDate) : [];
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  // BS helpers
  const bsMonthNames = ["Baisakh","Jestha","Ashadh","Shrawan","Bhadra","Ashwin","Kartik","Mangsir","Poush","Magh","Falgun","Chaitra"];

  function getBsMonthDays(year: number, month: number) {
    // month: 1-12
    try {
      const startAd = new NepaliDate(`${String(year)}-${String(month).padStart(2, "0")}-01`).toJsDate();
      let nextYear = year;
      let nextMonth = month + 1;
      if (nextMonth > 12) {
        nextMonth = 1;
        nextYear += 1;
      }
      const nextAd = new NepaliDate(`${String(nextYear)}-${String(nextMonth).padStart(2, "0")}-01`).toJsDate();
      const diff = Math.round((nextAd.getTime() - startAd.getTime()) / (1000 * 60 * 60 * 24));
      return { startAd, days: diff };
    } catch {
      return { startAd: new Date(), days: 30 };
    }
  }

  const todayAd = new Date();
  let todayBsIso = "";
  try {
    todayBsIso = NepaliDate.fromAD(new Date()).format("YYYY-MM-DD");
  } catch {
    // ignore
  }

  const dayCell = "mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition";
  const monthPill = "rounded-lg py-1.5 text-xs font-medium transition";

  const goToday = () => {
    if (calendar === "ad") {
      selectDate(new Date());
    } else if (todayBsIso) {
      try {
        selectDate({ bsIso: todayBsIso, adDate: new NepaliDate(todayBsIso).toJsDate() });
      } catch {
        // ignore
      }
    }
  };

  return (
    <div ref={ref} className="relative w-full text-left">
      <button
        type="button"
        id={id}
        onClick={() => setOpen((v) => !v)}
        className={`${className || 'w-full text-left rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10'}`}
      >
        <span className="inline-block">{internal ? (calendar === "ad" && internal instanceof Date ? internal.toLocaleDateString("en-CA") : String(internal)) : (placeholder || "Select date")}</span>
        <CalendarIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-full min-w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] ring-1 ring-black/5">
          {calendar === "ad" ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between gap-2 rounded-t-2xl border-b border-slate-100 bg-linear-to-r from-[#005d59] to-[#0d837f] px-3 py-2.5 text-white">
                <button
                  type="button"
                  onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                  className="grid h-8 w-8 place-items-center rounded-lg text-white/80 transition hover:bg-white/15 hover:text-white"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setYearMenuOpen((s) => !s)}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm font-bold transition hover:bg-white/15"
                  >
                    {viewDate.toLocaleString(undefined, { month: "long" })} {viewDate.getFullYear()}
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {yearMenuOpen && (
                    <div className="absolute left-1/2 z-30 mt-2 max-h-52 w-28 -translate-x-1/2 overflow-auto rounded-xl border border-slate-200 bg-white py-1 text-slate-700 shadow-xl">
                      {(() => {
                        const center = viewDate.getFullYear();
                        const span = Number.isFinite(yearRange) ? yearRange : 6;
                        const total = span * 2 + 1;
                        const years = Array.from({ length: total }).map((_, i) => center - span + i);
                        return years.map((y) => (
                          <button
                            key={y}
                            onClick={() => {
                              setViewDate(new Date(y, viewDate.getMonth(), 1));
                              setYearMenuOpen(false);
                            }}
                            className={`block w-full px-3 py-2 text-center text-sm transition hover:bg-teal-50 ${y === viewDate.getFullYear() ? 'bg-teal-50 font-bold text-teal-800' : ''}`}
                            type="button"
                          >
                            {y}
                          </button>
                        ));
                      })()}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                  className="grid h-8 w-8 place-items-center rounded-lg text-white/80 transition hover:bg-white/15 hover:text-white"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="p-3">
                <div className="grid grid-cols-7 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d) => (
                    <div key={d} className="py-1.5">{d}</div>
                  ))}
                </div>

                <div className="mt-1 grid grid-cols-7 gap-y-1 text-sm">
                  {days.map((dt, idx) => {
                    const isSelected = dt && internal instanceof Date && internal.toDateString() === dt.toDateString();
                    const isToday = dt && dt.toDateString() === todayAd.toDateString();
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => dt && selectDate(dt)}
                        className={`${dayCell} ${
                          !dt
                            ? "cursor-default"
                            : isSelected
                            ? "bg-[#005d59] font-semibold text-white shadow-sm"
                            : isToday
                            ? "font-semibold text-teal-700 ring-1 ring-teal-300 hover:bg-teal-50"
                            : "text-slate-700 hover:bg-teal-50 hover:text-teal-800"
                        }`}
                        disabled={!dt}
                      >
                        {dt ? dt.getDate() : ''}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 grid grid-cols-6 gap-1.5 border-t border-slate-100 pt-3">
                  {months.map((m, i) => (
                    <button
                      key={m}
                      onClick={() => setViewDate(new Date(viewDate.getFullYear(), i, 1))}
                      className={`${monthPill} ${viewDate.getMonth() === i ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                      type="button"
                    >
                      {m}
                    </button>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                  <button type="button" onClick={goToday} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-teal-700 transition hover:bg-teal-50">
                    Today
                  </button>
                  <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100">
                    Close
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between gap-2 rounded-t-2xl border-b border-slate-100 bg-linear-to-r from-[#005d59] to-[#0d837f] px-3 py-2.5 text-white">
                <button
                  type="button"
                  onClick={() => {
                    let ny = bsViewYear;
                    let nm = bsViewMonth - 1;
                    if (nm < 1) {
                      nm = 12;
                      ny -= 1;
                    }
                    setBsViewYear(ny);
                    setBsViewMonth(nm);
                  }}
                  className="grid h-8 w-8 place-items-center rounded-lg text-white/80 transition hover:bg-white/15 hover:text-white"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setBsYearMenuOpen((s) => !s)}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm font-bold transition hover:bg-white/15"
                  >
                    {bsMonthNames[bsViewMonth - 1]} {bsViewYear}
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {bsYearMenuOpen && (
                    <div className="absolute left-1/2 z-30 mt-2 max-h-52 w-28 -translate-x-1/2 overflow-auto rounded-xl border border-slate-200 bg-white py-1 text-slate-700 shadow-xl">
                      {(() => {
                        const cur = NepaliDate.fromAD(new Date()).format("YYYY-MM-DD");
                        const center = bsViewYear || Number(cur.split("-")[0]);
                        const span = Number.isFinite(yearRange) ? yearRange : 6;
                        const total = span * 2 + 1;
                        const years = Array.from({ length: total }).map((_, i) => center - span + i);
                        return years.map((y) => (
                          <button
                            key={y}
                            onClick={() => {
                              setBsViewYear(y);
                              setBsYearMenuOpen(false);
                            }}
                            className={`block w-full px-3 py-2 text-center text-sm transition hover:bg-teal-50 ${y === bsViewYear ? 'bg-teal-50 font-bold text-teal-800' : ''}`}
                            type="button"
                          >
                            {y}
                          </button>
                        ));
                      })()}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    let ny = bsViewYear;
                    let nm = bsViewMonth + 1;
                    if (nm > 12) {
                      nm = 1;
                      ny += 1;
                    }
                    setBsViewYear(ny);
                    setBsViewMonth(nm);
                  }}
                  className="grid h-8 w-8 place-items-center rounded-lg text-white/80 transition hover:bg-white/15 hover:text-white"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="p-3">
                <div className="grid grid-cols-7 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d) => (
                    <div key={d} className="py-1.5">{d}</div>
                  ))}
                </div>

                <div className="mt-1 grid grid-cols-7 gap-y-1 text-sm">
                  {(() => {
                    const { startAd, days: total } = getBsMonthDays(bsViewYear, bsViewMonth);
                    const startDay = startAd.getDay();
                    const nodes: ReactElement[] = [];
                    for (let i = 0; i < startDay; i++) nodes.push(<div key={`pad-${i}`} />);
                    for (let d = 1; d <= total; d++) {
                      const bsIso = `${String(bsViewYear)}-${String(bsViewMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                      const adDate = new NepaliDate(bsIso).toJsDate();
                      const isSelected = internal && typeof internal === 'string' && internal === bsIso;
                      const isToday = bsIso === todayBsIso;
                      nodes.push(
                        <button
                          key={`bs-${d}`}
                          type="button"
                          onClick={() => selectDate({ bsIso, adDate })}
                          className={`${dayCell} ${
                            isSelected
                              ? "bg-[#005d59] font-semibold text-white shadow-sm"
                              : isToday
                              ? "font-semibold text-teal-700 ring-1 ring-teal-300 hover:bg-teal-50"
                              : "text-slate-700 hover:bg-teal-50 hover:text-teal-800"
                          }`}
                        >
                          {d}
                        </button>
                      );
                    }
                    return nodes;
                  })()}
                </div>

                <div className="mt-3 grid grid-cols-6 gap-1.5 border-t border-slate-100 pt-3">
                  {bsMonthNames.map((m, i) => (
                    <button
                      key={m}
                      onClick={() => setBsViewMonth(i + 1)}
                      className={`${monthPill} ${bsViewMonth === i + 1 ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                      type="button"
                    >
                      {m.slice(0, 3)}
                    </button>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                  <button type="button" onClick={goToday} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-teal-700 transition hover:bg-teal-50">
                    Today
                  </button>
                  <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100">
                    Close
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
