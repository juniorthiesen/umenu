export function Input({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  step,
  min,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  step?: string;
  min?: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        className="mt-1 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        required={required}
        step={step ?? (type === "number" ? "0.01" : undefined)}
        min={min}
        placeholder={placeholder}
      />
    </label>
  );
}
