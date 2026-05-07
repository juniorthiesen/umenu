import type { EstablishmentAnalytics, EstablishmentDetail, EstablishmentSummary, SessionUser, UploadedImage, Product } from "./types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const token = window.localStorage.getItem("umenu_token");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  if (!response.ok) {
    let message = `Erro ${response.status}`;
    try {
      const body = await response.json();
      message = body.error || message;
    } catch {
      // Keep the HTTP error fallback.
    }
    throw new ApiError(response.status, message);
  }

  return response.json() as Promise<T>;
};

const requestForm = async <T>(path: string, formData: FormData): Promise<T> => {
  const token = window.localStorage.getItem("umenu_token");
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: formData
  });

  if (!response.ok) {
    let message = `Erro ${response.status}`;
    try {
      const body = await response.json();
      message = body.error || message;
    } catch {
      // Keep the HTTP error fallback.
    }
    throw new ApiError(response.status, message);
  }

  return response.json() as Promise<T>;
};

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: SessionUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),
  me: () => request<{ user: SessionUser | null }>("/api/auth/me"),
  listEstablishments: () =>
    request<EstablishmentSummary[]>("/api/admin/establishments"),
  getEstablishment: (id: string) =>
    request<EstablishmentDetail>(`/api/admin/establishments/${id}`),
  getAnalytics: (id: string) =>
    request<EstablishmentAnalytics>(`/api/admin/establishments/${id}/analytics`),
  createEstablishment: (payload: unknown) =>
    request<{ establishment: EstablishmentSummary; publicUrl: string }>(
      "/api/admin/establishments",
      { method: "POST", body: JSON.stringify(payload) }
    ),
  updateEstablishment: (id: string, payload: unknown) =>
    request<EstablishmentDetail>(`/api/admin/establishments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),
  setAiCredits: (id: string, credits: number) =>
    request<{ id: string; aiImageCredits: number }>(`/api/admin/establishments/${id}/ai-credits`, {
      method: "POST",
      body: JSON.stringify({ credits })
    }),
  uploadImage: (establishmentId: string, file: File, scope: "product" | "logo" | "banner", nameHint?: string) => {
    const formData = new FormData();
    formData.append("image", file);
    const params = new URLSearchParams({ scope });
    if (nameHint?.trim()) params.set("nameHint", nameHint.trim());
    return requestForm<UploadedImage>(`/api/admin/establishments/${establishmentId}/images?${params.toString()}`, formData);
  },
  createCategory: (establishmentId: string, payload: unknown) =>
    request(`/api/admin/establishments/${establishmentId}/categories`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateCategory: (categoryId: string, payload: unknown) =>
    request(`/api/admin/categories/${categoryId}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),
  createProduct: (establishmentId: string, payload: unknown) =>
    request(`/api/admin/establishments/${establishmentId}/products`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateProduct: (productId: string, payload: unknown) =>
    request(`/api/admin/products/${productId}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),
  enhanceProductImage: (productId: string) =>
    request<{ product: Product; image: UploadedImage; aiImageCredits: number }>(`/api/admin/products/${productId}/image/enhance`, {
      method: "POST",
      body: JSON.stringify({})
    })
};
