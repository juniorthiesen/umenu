import React, { type ReactNode } from "react";

export function SummaryStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 text-orange-500">
        {React.cloneElement(icon as React.ReactElement, { className: "h-5 w-5" })}
      </div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 break-words font-semibold">{value}</p>
    </div>
  );
}
