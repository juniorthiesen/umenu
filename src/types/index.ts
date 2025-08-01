// --- TIPOS E INTERFACES ---
export type PricingType = 'unidade' | 'cento' | 'kg';

export interface Product {
  id: number;
  name: string;
  price: number;
  pricingType: PricingType;
  image: string;
  description?: string;
  minQuantity?: number;
  step?: number;
  promotion?: {
    isActive: boolean;
    promotionalPrice: number;
    discountPercentage: number;
    validUntil?: string; // ISO date string
    label?: string; // "OFERTA", "PROMOÇÃO", "DESCONTO"
  };
}

export interface Category {
  id: string;
  name: string;
  products: Product[];
}

export interface CartItem extends Product {
  quantity: number;
}

export interface SearchContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredMenu: Category[];
  hasResults: boolean;
  isSearching: boolean;
}

export interface CartContextType {
  cart: CartItem[];
  updateQuantity: (productId: number, newQuantity: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  getItemQuantity: (productId: number) => number;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

// --- TIPOS PARA SAAS MULTI-TENANT ---
export interface TenantSettings {
  id?: string;
  tenant_id: string;
  business_phone?: string;
  business_address?: string;
  logo_url?: string;
  banner_url?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  business_hours?: Record<string, { start: number; end: number } | null>;
  delivery_fee?: number;
  minimum_order?: number;
  is_open?: boolean;
  hero_title?: string;
  hero_subtitle?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Tenant {
  id: string;
  subdomain: string;
  name: string;
  owner_id: string;
  plan?: string;
  status?: string;
  trial_ends_at?: string;
  created_at?: string;
  updated_at?: string;
}