export type UserRole = "PLATFORM_ADMIN" | "ESTABLISHMENT_ADMIN";
export type EstablishmentStatus = "ACTIVE" | "SUSPENDED" | "ARCHIVED";
export type PricingType = "UNIT" | "HUNDRED" | "KG";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  establishmentIds: string[];
}

export interface EstablishmentSummary {
  id: string;
  name: string;
  subdomain: string;
  status: EstablishmentStatus;
  whatsappPhone: string;
  createdAt: string;
}

export interface Product {
  id: string;
  establishmentId: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  pricingType: PricingType;
  minQuantity: number | null;
  stepQuantity: number;
  imageUrl: string | null;
  isActive: boolean;
  displayOrder: number;
}

export interface Category {
  id: string;
  establishmentId: string;
  name: string;
  slug: string;
  displayOrder: number;
  isActive: boolean;
  products: Product[];
}

export interface EstablishmentDetail extends EstablishmentSummary {
  address: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  primaryColor: string;
  deliveryFee: number;
  minimumOrder: number;
  categories: Category[];
}

export interface EstablishmentAnalytics {
  visitsToday: number;
  visits7d: number;
  ordersToday: number;
  orders7d: number;
  revenueToday: number;
  revenue7d: number;
  conversionToday: number;
  conversion7d: number;
  productCount: number;
  activeProductCount: number;
  categoryCount: number;
  funnel: Array<{ label: string; value: number }>;
}
