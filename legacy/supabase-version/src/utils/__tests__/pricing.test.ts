// Testes unitários para as funções utilitárias incluindo promoções
import { 
  formatCurrency, 
  calculateItemTotal, 
  getEffectivePrice, 
  isPromotionActive, 
  getDiscountAmount 
} from '../pricing';
import { CartItem, Product } from '../../types';

describe('Pricing Utils', () => {
  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(100)).toBe('R$ 100,00');
      expect(formatCurrency(10.5)).toBe('R$ 10,50');
      expect(formatCurrency(0)).toBe('R$ 0,00');
    });
  });

  describe('calculateItemTotal', () => {
    it('should calculate total for "unidade" pricing', () => {
      const item: CartItem = {
        id: 1,
        name: 'Test Product',
        price: 10,
        pricingType: 'unidade',
        quantity: 3,
        image: 'test.jpg'
      };
      expect(calculateItemTotal(item)).toBe(30);
    });

    it('should calculate total for "cento" pricing', () => {
      const item: CartItem = {
        id: 1,
        name: 'Test Product',
        price: 100,
        pricingType: 'cento',
        quantity: 50,
        image: 'test.jpg'
      };
      expect(calculateItemTotal(item)).toBe(50); // (100/100) * 50
    });

    it('should calculate total for "kg" pricing', () => {
      const item: CartItem = {
        id: 1,
        name: 'Test Product',
        price: 20,
        pricingType: 'kg',
        quantity: 2.5,
        image: 'test.jpg'
      };
      expect(calculateItemTotal(item)).toBe(50);
    });

    it('should calculate total with promotional price', () => {
      const item: CartItem = {
        id: 1,
        name: 'Test Product',
        price: 100,
        pricingType: 'unidade',
        quantity: 2,
        image: 'test.jpg',
        promotion: {
          isActive: true,
          promotionalPrice: 80,
          discountPercentage: 20,
          label: 'OFERTA'
        }
      };
      expect(calculateItemTotal(item)).toBe(160); // 80 * 2
    });

    it('should return 0 for invalid pricing type', () => {
      const item: CartItem = {
        id: 1,
        name: 'Test Product',
        price: 10,
        pricingType: 'invalid' as any,
        quantity: 3,
        image: 'test.jpg'
      };
      expect(calculateItemTotal(item)).toBe(0);
    });
  });

  describe('Promotion Functions', () => {
    const productWithActivePromotion: Product = {
      id: 1,
      name: 'Test Product',
      price: 100,
      pricingType: 'unidade',
      image: 'test.jpg',
      promotion: {
        isActive: true,
        promotionalPrice: 80,
        discountPercentage: 20,
        label: 'OFERTA'
      }
    };

    const productWithExpiredPromotion: Product = {
      id: 2,
      name: 'Test Product 2',
      price: 100,
      pricingType: 'unidade',
      image: 'test.jpg',
      promotion: {
        isActive: true,
        promotionalPrice: 80,
        discountPercentage: 20,
        validUntil: '2020-01-01T00:00:00', // Data passada
        label: 'OFERTA'
      }
    };

    const productWithoutPromotion: Product = {
      id: 3,
      name: 'Test Product 3',
      price: 100,
      pricingType: 'unidade',
      image: 'test.jpg'
    };

    describe('isPromotionActive', () => {
      it('should return true for active promotion without expiry', () => {
        expect(isPromotionActive(productWithActivePromotion)).toBe(true);
      });

      it('should return false for expired promotion', () => {
        expect(isPromotionActive(productWithExpiredPromotion)).toBe(false);
      });

      it('should return false for product without promotion', () => {
        expect(isPromotionActive(productWithoutPromotion)).toBe(false);
      });
    });

    describe('getEffectivePrice', () => {
      it('should return promotional price for active promotion', () => {
        expect(getEffectivePrice(productWithActivePromotion)).toBe(80);
      });

      it('should return original price for expired promotion', () => {
        expect(getEffectivePrice(productWithExpiredPromotion)).toBe(100);
      });

      it('should return original price for product without promotion', () => {
        expect(getEffectivePrice(productWithoutPromotion)).toBe(100);
      });
    });

    describe('getDiscountAmount', () => {
      it('should return discount amount for active promotion', () => {
        expect(getDiscountAmount(productWithActivePromotion)).toBe(20);
      });

      it('should return 0 for expired promotion', () => {
        expect(getDiscountAmount(productWithExpiredPromotion)).toBe(0);
      });

      it('should return 0 for product without promotion', () => {
        expect(getDiscountAmount(productWithoutPromotion)).toBe(0);
      });
    });
  });
});