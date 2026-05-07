import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { env } from "../env";
import { slugify } from "../utils/slug";

export type ImageScope = "product" | "logo" | "banner" | "ai";

export interface StoredImage {
  filePath: string;
  publicPath: string;
  width: number;
  height: number;
  size: number;
  format: "webp";
}

const scopeSizes: Record<ImageScope, { width: number; height: number; fit: keyof sharp.FitEnum; quality: number }> = {
  product: { width: 1200, height: 1200, fit: "cover", quality: 82 },
  logo: { width: 512, height: 512, fit: "cover", quality: 86 },
  banner: { width: 1920, height: 720, fit: "cover", quality: 82 },
  ai: { width: 1200, height: 1200, fit: "cover", quality: 84 }
};

export const maxUploadBytes = () => Math.round(env.MAX_UPLOAD_MB * 1024 * 1024);

export const storeOptimizedImage = async ({
  input,
  uploadRoot,
  establishmentId,
  scope,
  nameHint
}: {
  input: Buffer;
  uploadRoot: string;
  establishmentId: string;
  scope: ImageScope;
  nameHint?: string;
}): Promise<StoredImage> => {
  const options = scopeSizes[scope];
  const relativeDir = path.join("establishments", establishmentId, scope);
  const absoluteDir = path.join(uploadRoot, relativeDir);
  await fs.mkdir(absoluteDir, { recursive: true });

  const readableName = slugify(nameHint || scope) || scope;
  const fileName = `${readableName}-${Date.now()}-${crypto.randomUUID()}.webp`;
  const filePath = path.join(absoluteDir, fileName);

  const info = await sharp(input, {
    failOn: "warning",
    limitInputPixels: 24_000_000
  })
    .rotate()
    .resize(options.width, options.height, {
      fit: options.fit,
      withoutEnlargement: scope !== "ai"
    })
    .webp({ quality: options.quality, effort: 5 })
    .toFile(filePath);

  const relativePublicPath = path.posix.join(
    "/uploads",
    "establishments",
    establishmentId,
    scope,
    fileName
  );

  return {
    filePath,
    publicPath: relativePublicPath,
    width: info.width,
    height: info.height,
    size: info.size,
    format: "webp"
  };
};

export const buildPublicImageUrl = (publicPath: string, requestHost: string, protocol = "http") => {
  const baseUrl = env.PUBLIC_UPLOAD_BASE_URL || `${protocol}://${requestHost}`;
  return `${baseUrl.replace(/\/$/, "")}${publicPath}`;
};

export const assertSupportedImage = (mimeType: string | undefined) => {
  const supported = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
  if (!mimeType || !supported.has(mimeType)) {
    throw new Error("unsupported_image_type");
  }
};

export const fetchImageBuffer = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("image_fetch_failed");
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    throw new Error("image_fetch_invalid_type");
  }

  const length = Number(response.headers.get("content-length") || 0);
  if (length > maxUploadBytes()) {
    throw new Error("image_fetch_too_large");
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > maxUploadBytes()) {
    throw new Error("image_fetch_too_large");
  }

  return buffer;
};

export const improveFoodImageWithOpenAI = async ({
  image,
  productName,
  prompt
}: {
  image: Buffer;
  productName: string;
  prompt?: string;
}) => {
  if (!env.OPENAI_API_KEY) {
    throw new Error("openai_not_configured");
  }

  const form = new FormData();
  const pngInput = await sharp(image)
    .rotate()
    .resize(1536, 1536, { fit: "inside", withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toBuffer();

  form.append("model", env.OPENAI_IMAGE_MODEL);
  form.append(
    "prompt",
    prompt ||
      `Melhore esta foto de produto para um cardápio digital. Produto: ${productName}. Mantenha o alimento fiel ao original, sem adicionar ingredientes que não aparecem. Ajuste luz, nitidez, enquadramento e fundo para parecer uma foto profissional de delivery.`
  );
  form.append("size", "1024x1024");
  form.append("image", new Blob([pngInput], { type: "image/png" }), "product.png");

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: form
  });

  if (!response.ok) {
    throw new Error("openai_image_failed");
  }

  const body = await response.json() as { data?: Array<{ b64_json?: string; url?: string }> };
  const first = body.data?.[0];
  if (first?.b64_json) {
    return Buffer.from(first.b64_json, "base64");
  }

  if (first?.url) {
    return fetchImageBuffer(first.url);
  }

  throw new Error("openai_image_empty");
};
