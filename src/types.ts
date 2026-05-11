export type UserRole = "PLATFORM_ADMIN" | "ESTABLISHMENT_ADMIN";
export type EstablishmentStatus = "ACTIVE" | "SUSPENDED" | "ARCHIVED";
export type Template = "SALGADERIA" | "DOCERIA" | "BOLARIA" | "PIZZARIA";
export type PricingType = "UNIT" | "HUNDRED" | "KG";
export type SelectionType = "SINGLE" | "MULTIPLE" | "QUANTITY";
export type PricingRule = "SUM" | "HIGHEST" | "AVERAGE" | "REPLACE";

export interface ProductOptionItem {
  id: string;
  groupId: string;
  name: string;
  priceDelta: number;
  displayOrder: number;
  isDefault: boolean;
}

export interface ProductOptionGroup {
  id: string;
  productId: string;
  name: string;
  selectionType: SelectionType;
  pricingRule: PricingRule;
  required: boolean;
  minSelections: number;
  maxSelections: number | null;
  displayOrder: number;
  items: ProductOptionItem[];
}

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
  aiImageCredits: number;
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
  allowsNotes: boolean;
  displayOrder: number;
  optionGroups: ProductOptionGroup[];
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
  template: Template;
  primaryColor: string;
  accentColor: string | null;
  surfaceColor: string | null;
  deliveryFee: number;
  minimumOrder: number;
  aiImageCredits: number;
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

export interface UploadedImage {
  url: string;
  path: string;
  width: number;
  height: number;
  size: number;
  format: "webp";
}

export interface EstablishmentAdmin {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}
