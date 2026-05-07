import { Loader2, Upload } from "lucide-react";
import { useState } from "react";
import { api } from "../../api";

export function ImageUploadControl({
  label,
  establishmentId,
  scope,
  nameHint,
  onUploaded
}: {
  label: string;
  establishmentId: string;
  scope: "product" | "logo" | "banner";
  nameHint?: string;
  onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage("");
    try {
      const image = await api.uploadImage(establishmentId, file, scope, nameHint);
      onUploaded(image.url);
      setMessage(`WebP ${image.width}x${image.height}, ${Math.round(image.size / 1024)} KB.`);
    } catch {
      setMessage("Não foi possível enviar a imagem.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <div className="mt-1 flex items-center gap-2">
        <span className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Enviando" : "Escolher arquivo"}
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          onChange={handleFile}
          disabled={uploading}
          className="sr-only"
        />
      </div>
      {message && <p className="mt-1 text-xs text-slate-500">{message}</p>}
    </label>
  );
}
