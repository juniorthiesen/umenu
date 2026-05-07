import { Loader2 } from "lucide-react";

export function FullScreenLoading({ label }: { label: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
      <div className="flex items-center gap-3 text-sm text-slate-300">
        <Loader2 className="h-5 w-5 animate-spin text-orange-400" />
        {label}
      </div>
    </main>
  );
}
