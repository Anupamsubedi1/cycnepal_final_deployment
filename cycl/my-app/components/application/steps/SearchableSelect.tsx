"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, Check } from "lucide-react";

interface SearchableSelectProps {
  name: string;
  value: string;
  options: string[];
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  valid?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

export default function SearchableSelect({
  name,
  value,
  options,
  label,
  placeholder = "Search...",
  disabled = false,
  required = false,
  error,
  valid = false,
  onChange,
  className = "",
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const filteredOptions = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) => option.toLowerCase().startsWith(query));
  }, [options, value]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const emitChange = (nextValue: string) => {
    onChange({
      target: { name, value: nextValue },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {label && (
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          name={name}
          value={value}
          disabled={disabled}
          required={required}
          onChange={(event) => {
            emitChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => !disabled && setOpen(true)}
          placeholder={placeholder}
          className={`w-full rounded-xl border bg-white py-3 pl-10 pr-10 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-100 ${
            error
              ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10"
              : valid
              ? "border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/10"
              : "border-slate-200 focus:border-teal-600 focus:ring-teal-600/10"
          }`}
          autoComplete="off"
        />
        {valid && !error ? (
          <Check className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
        ) : (
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        )}
      </div>

      {open && !disabled && filteredOptions.length > 0 && (
        <div className="absolute z-20 mt-2 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          {filteredOptions.slice(0, 20).map((option) => (
            <button
              key={option}
              type="button"
              className="block w-full border-b border-slate-100 px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-teal-50 hover:text-teal-900 last:border-b-0"
              onMouseDown={(event) => {
                event.preventDefault();
                emitChange(option);
                setOpen(false);
              }}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {open && !disabled && filteredOptions.length === 0 && value.trim() && (
        <div className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-lg">
          No matching result.
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
