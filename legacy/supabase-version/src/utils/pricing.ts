import { CartItem, Product } from '../types';

// Singleton para formatação de moeda
class CurrencyFormatter {
  private static instance: CurrencyFormatter;
  private formatter: Intl.NumberFormat;

  private constructor() {
    this.formatter = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  public static getInstance(): CurrencyFormatter {
    if (!CurrencyFormatter.instance) {
      CurrencyFormatter.instance = new CurrencyFormatter();
    }
    return CurrencyFormatter.instance;
  }

  public format(value: number): string {
    return this.formatter.format(value);
  }
}

export const formatCurrency = (value: number): string => {
  return CurrencyFormatter.getInstance().format(value);
};

// Função para obter o preço efetivo (promocional ou normal)
export const getEffectivePrice = (item: Product | CartItem): number => {
  if (item.promotion?.isActive) {
    // Verificar se a promoção ainda é válida
    if (item.promotion.validUntil) {
      const now = new Date();
      const validUntil = new Date(item.promotion.validUntil);
      if (now > validUntil) {
        return item.price; // Promoção expirada, usar preço normal
      }
    }
    return item.promotion.promotionalPrice;
  }
  return item.price;
};

// Função para verificar se um produto está em promoção válida
export const isPromotionActive = (product: Product): boolean => {
  if (!product.promotion?.isActive) return false;
  
  if (product.promotion.validUntil) {
    const now = new Date();
    const validUntil = new Date(product.promotion.validUntil);
    return now <= validUntil;
  }
  
  return true;
};

// Função para calcular o desconto em valor absoluto
export const getDiscountAmount = (product: Product): number => {
  if (!isPromotionActive(product)) return 0;
  return product.price - getEffectivePrice(product);
};

export const calculateItemTotal = (item: CartItem): number => {
  const effectivePrice = getEffectivePrice(item);
  
  const calculations = {
    cento: () => (effectivePrice / 100) * item.quantity,
    kg: () => effectivePrice * item.quantity,
    unidade: () => effectivePrice * item.quantity,
  };

  const calculation = calculations[item.pricingType];
  return calculation ? calculation() : 0;
};