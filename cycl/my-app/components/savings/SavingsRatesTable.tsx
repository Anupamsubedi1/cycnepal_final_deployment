"use client";

import { useTranslations } from "next-intl";

type Row = { sn: number | string; type: string; rate: string };

interface Props {
  dbRows?: Row[];
}

export function SavingsRatesTable({ dbRows }: Props) {
  const t = useTranslations("savings.table");
  const rows: Row[] = dbRows && dbRows.length > 0
    ? dbRows
    : (t.raw("data") as Array<{ sn: string | number; type: string; rate: string }>).map((r) => ({
        sn: r.sn,
        type: r.type,
        rate: r.rate,
      }));

  return (
    <div className="overflow-x-auto bg-off-white">
      <table className="min-w-full text-bold bg-white">
        <thead className="bg-[#0d837f] text-left text-white">
          <tr>
            <th className="px-3 py-2.5 font-semibold sm:px-5 sm:py-3 text-base sm:text-xl">{t("columns.sn")}</th>
            <th className="px-3 py-2.5 font-semibold sm:px-5 sm:py-3 text-base sm:text-xl">{t("columns.type")}</th>
            <th className="px-3 py-2.5 font-semibold sm:px-5 sm:py-3 text-base sm:text-xl">{t("columns.rate")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={`${row.sn}-${index}`}
              className="border-t border-[#e3edf3] text-slate-700 odd:bg-white even:bg-[#f9fcfe] text-sm sm:text-[16px]"
            >
              <td className="px-3 py-2.5 font-medium text-[#123451] sm:px-5 sm:py-3">{row.sn}</td>
              <td className="px-3 py-2.5 sm:px-5 sm:py-3">{row.type}</td>
              <td className="px-3 py-2.5 font-semibold text-[#0d837f] sm:px-5 sm:py-3">{row.rate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
