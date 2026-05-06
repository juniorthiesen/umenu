import { useMemo } from 'react';
import { Product } from '../types';
import { isPromotionActive } from '../utils/pricing';
import { menuData } from '../data/menu';

export const usePromotions = () => {
  const promotionalProducts = useMemo(() => {
    // Extrair todos os produtos de todas as categorias
    const allProducts: Product[] = menuData.flatMap(category => category.products);
    
    // Filtrar apenas produtos com promoções ativas
    return allProducts.filter(isPromotionActive);
  }, []);

  const hasPromotions = promotionalProducts.length > 0;

  return {
    promotionalProducts,
    hasPromotions,
    promotionsCount: promotionalProducts.length
  };
};
