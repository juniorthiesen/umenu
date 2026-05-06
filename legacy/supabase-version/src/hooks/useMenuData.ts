import { useState, useEffect } from 'react';
import { Category, Product } from '../types';
import { supabase } from '../lib/supabase';
import { menuData as demoData } from '../data/menu';

export const useMenuData = () => {
  const [menuData, setMenuData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMenuData();
  }, []);

  const loadMenuData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Tentar buscar dados do Supabase
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('umenu_categories')
        .select(`
          id,
          name,
          slug,
          display_order,
          umenu_products (
            id,
            name,
            description,
            price,
            pricing_type,
            min_quantity,
            step_quantity,
            image_url,
            is_available
          )
        `)
        .eq('umenu_products.is_available', true)
        .order('display_order');

      // Se houver erro ou não houver dados, usar dados demo
      if (categoriesError || !categoriesData || categoriesData.length === 0) {
        console.warn('Usando dados demo - banco não configurado ou sem dados:', categoriesError?.message);
        setMenuData(demoData);
        return;
      }

      // Transformar dados do Supabase para o formato esperado pela interface
      const formattedCategories: Category[] = (categoriesData || [])
        .filter(category => category.umenu_products && category.umenu_products.length > 0)
        .map(category => ({
          id: category.slug || String(category.id),
          name: category.name,
          products: category.umenu_products.map((product: any): Product => ({
            id: product.id,
            name: product.name,
            description: product.description || '',
            price: product.price,
            pricingType: product.pricing_type || 'unidade',
            minQuantity: product.min_quantity || undefined,
            step: product.step_quantity || 1,
            image: product.image_url || `https://placehold.co/300x300/F59E0B/FFFFFF?text=${encodeURIComponent(product.name)}`
          }))
        }));

      setMenuData(formattedCategories);
    } catch (error) {
      console.error('Erro ao carregar dados do menu:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      // Em caso de erro, usar dados vazios em vez de dados mockados
      setMenuData([]);
    } finally {
      setLoading(false);
    }
  };

  return { menuData, loading, error, reloadMenu: loadMenuData };
};
