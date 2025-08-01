import { useState, useEffect, useCallback } from 'react';
import { getSubdomain } from '../utils/subdomain';
import { Category, TenantSettings, Product, PricingType } from '../types';
import { supabase } from '../lib/supabase';

// Estrutura de dados que a Edge Function retorna
interface TenantData {
  menu: Category[];
  settings: TenantSettings;
}

// Cache em memória para evitar buscas repetidas na mesma sessão
const tenantCache = new Map<string, TenantData>();

// Hook para verificar disponibilidade de subdomínio
export const useSubdomainCheck = () => {
  const checkAvailability = useCallback(async (subdomain: string): Promise<boolean> => {
    try {
      // Validação básica do subdomínio
      if (!subdomain || subdomain.length < 3) {
        return false;
      }

      // Verificar se o subdomínio já existe na base de dados
      const { data, error } = await supabase
        .from('umenu_tenants')
        .select('subdomain')
        .eq('subdomain', subdomain)
        .maybeSingle();
      
      if (error) {
        console.error('Erro ao verificar subdomínio:', error);
        return false;
      }
      
      // Retorna true se NÃO encontrou o subdomínio (disponível)
      return !data;
    } catch (error) {
      console.error('Erro ao verificar subdomínio:', error);
      return false;
    }
  }, []);

  return { checkAvailability };
};

export const useTenant = () => {
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subdomain, setSubdomain] = useState<string | null>(null);

  useEffect(() => {
    const currentSubdomain = getSubdomain();
    setSubdomain(currentSubdomain);

    if (!currentSubdomain) {
      // Se não há subdomínio, talvez seja a landing page ou um erro.
      // Poderíamos ter uma lógica para carregar dados padrão aqui.
      console.log('Nenhum subdomínio encontrado, usando dados de fallback ou modo demo.');
      // Por enquanto, apenas paramos o carregamento.
      setLoading(false);
      return;
    }

    const fetchTenantData = async () => {
      // 1. Verificar cache primeiro
      if (tenantCache.has(currentSubdomain)) {
        setTenantData(tenantCache.get(currentSubdomain)!);
        setLoading(false);
        return;
      }

      // 2. Se não estiver no cache, buscar diretamente do Supabase
      try {
        setLoading(true);
        setError(null);

        // Buscar tenant pelo subdomínio
        const { data: tenant, error: tenantError } = await supabase
          .from('umenu_tenants')
          .select('id, name, subdomain')
          .eq('subdomain', currentSubdomain)
          .single();

        if (tenantError || !tenant) {
          throw new Error(`Restaurante "${currentSubdomain}" não encontrado`);
        }

        // Buscar configurações do tenant
        const { data: settings, error: settingsError } = await supabase
          .from('umenu_tenant_settings')
          .select('*')
          .eq('tenant_id', tenant.id)
          .single();

        if (settingsError) {
          console.warn('Configurações não encontradas, usando padrões:', settingsError);
        }

        // Buscar categorias e produtos
        const { data: categories, error: categoriesError } = await supabase
          .from('umenu_categories')
          .select(`
            id,
            name,
            slug,
            display_order
          `)
          .eq('tenant_id', tenant.id)
          .order('display_order');

        if (categoriesError) {
          throw new Error('Erro ao carregar categorias: ' + categoriesError.message);
        }

        // Buscar produtos para cada categoria
        const menu: Category[] = [];
        
        if (categories && categories.length > 0) {
          for (const category of categories) {
            const { data: products, error: productsError } = await supabase
              .from('umenu_products')
              .select('*')
              .eq('category_id', category.id)
              .eq('tenant_id', tenant.id)
              .order('name');

            if (productsError) {
              console.warn(`Erro ao carregar produtos da categoria ${category.name}:`, productsError);
              continue;
            }

            // Converter produtos do formato do banco para o formato da aplicação
            const formattedProducts: Product[] = (products || []).map(product => ({
              id: parseInt(product.id),
              name: product.name,
              price: parseFloat(product.price),
              pricingType: product.pricing_type as PricingType,
              image: product.image_url || '',
              description: product.description,
              minQuantity: product.min_quantity || 1
            }));

            menu.push({
              id: category.id,
              name: category.name,
              products: formattedProducts
            });
          }
        }

        // Montar dados do tenant
        const tenantSettings: TenantSettings = {
          tenant_id: tenant.id,
          business_phone: settings?.business_phone || '',
          business_address: settings?.business_address || '',
          logo_url: settings?.logo_url || '',
          banner_url: settings?.banner_url || '',
          primary_color: settings?.primary_color || '#f97316',
          secondary_color: settings?.secondary_color || '#1e293b',
          accent_color: settings?.accent_color || '#16a34a',
          business_hours: settings?.business_hours || {},
          delivery_fee: settings?.delivery_fee || 5.00,
          minimum_order: settings?.minimum_order || 30.00,
          is_open: settings?.is_open ?? true,
          hero_title: settings?.hero_title || tenant.name,
          hero_subtitle: settings?.hero_subtitle || 'O sabor que une momentos'
        };

        const data: TenantData = {
          menu,
          settings: tenantSettings
        };

        // 3. Salvar no cache e no estado
        tenantCache.set(currentSubdomain, data);
        setTenantData(data);

      } catch (err) {
        console.error('Falha ao buscar dados do tenant:', err);
        setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchTenantData();

  }, []); // Executa apenas uma vez na montagem do componente

  return { 
    tenantData, 
    subdomain,
    isLoading: loading, 
    isError: !!error,
    error 
  };
};
