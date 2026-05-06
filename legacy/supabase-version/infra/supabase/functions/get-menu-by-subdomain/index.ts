
import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors.ts';

// Tipos para os dados do menu, podem ser compartilhados com o frontend
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  pricingType: 'unidade' | 'cento' | 'kg';
  minQuantity?: number;
  step: number;
  image: string;
}

interface Category {
  id: string;
  name: string;
  products: Product[];
}

interface TenantSettings {
  name: string;
  phone: string;
  address: string;
  logoUrl: string;
  bannerUrl: string;
  hours: any; // JSONB
}

interface TenantData {
  menu: Category[];
  settings: TenantSettings;
}

Deno.serve(async (req) => {
  // Trata a requisição pre-flight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { subdomain } = await req.json();
    if (!subdomain) {
      throw new Error('Subdomínio é obrigatório');
    }

    // Use o Service Role Key para ter acesso total ao banco de dados
    // As políticas de RLS não se aplicam aqui, o que é necessário para buscar dados de qualquer tenant.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Encontrar o tenant pelo subdomínio
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, name, settings:settings(*)')
      .eq('subdomain', subdomain)
      .single();

    if (tenantError) {
      console.error(`Erro ao buscar tenant para subdomínio "${subdomain}":`, tenantError.message);
      return new Response(JSON.stringify({ error: 'Cardápio não encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tenantId = tenant.id;
    const tenantSettings = tenant.settings[0]; // settings é uma relação one-to-one

    // 2. Buscar categorias e produtos para o tenant_id encontrado
    const { data: categoriesData, error: categoriesError } = await supabaseAdmin
      .from('categories')
      .select(`
        id,
        name,
        slug,
        display_order,
        products (
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
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .eq('products.is_active', true)
      .order('display_order', { ascending: true })
      .order('display_order', { foreignTable: 'products', ascending: true });

    if (categoriesError) {
      throw new Error(`Erro ao buscar o cardápio: ${categoriesError.message}`);
    }

    // 3. Formatar os dados para o frontend
    const formattedMenu: Category[] = (categoriesData || [])
      .filter(category => category.products && category.products.length > 0)
      .map(category => ({
        id: category.slug || String(category.id),
        name: category.name,
        products: category.products.map((product: any): Product => ({
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

    const responsePayload: TenantData = {
      menu: formattedMenu,
      settings: {
        name: tenant.name,
        phone: tenantSettings?.business_phone || '',
        address: tenantSettings?.business_address || '',
        logoUrl: tenantSettings?.logo_url || '',
        bannerUrl: tenantSettings?.banner_url || '',
        hours: tenantSettings?.business_hours || {},
      }
    };

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
