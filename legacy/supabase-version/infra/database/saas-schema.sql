-- =====================================================
-- uMENU SAAS - MULTI-TENANT DATABASE SCHEMA (UPDATED)
-- Supabase PostgreSQL Schema para SAAS com prefixo umenu_
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TENANTS (RESTAURANTES)
-- =====================================================
CREATE TABLE IF NOT EXISTS umenu_tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subdomain TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan VARCHAR(50) DEFAULT 'free', -- 'free', 'basic', 'premium'
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'suspended', 'cancelled'
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE UNIQUE INDEX idx_umenu_tenants_subdomain ON umenu_tenants(subdomain);
CREATE INDEX idx_umenu_tenants_owner ON umenu_tenants(owner_id);
CREATE INDEX idx_umenu_tenants_status ON umenu_tenants(status);

-- =====================================================
-- 2. CONFIGURAÇÕES DO TENANT
-- =====================================================
CREATE TABLE IF NOT EXISTS umenu_tenant_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES umenu_tenants(id) ON DELETE CASCADE,
    business_phone TEXT,
    business_address TEXT,
    logo_url TEXT,
    banner_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#f97316',
    secondary_color VARCHAR(7) DEFAULT '#1e293b',
    accent_color VARCHAR(7) DEFAULT '#16a34a',
    business_hours JSONB DEFAULT '{"1": {"start": 9, "end": 18}, "2": {"start": 9, "end": 18}, "3": {"start": 9, "end": 18}, "4": {"start": 9, "end": 18}, "5": {"start": 9, "end": 18}, "6": {"start": 9, "end": 13}, "0": null}',
    delivery_fee DECIMAL(10,2) DEFAULT 5.00,
    minimum_order DECIMAL(10,2) DEFAULT 30.00,
    is_open BOOLEAN DEFAULT true,
    hero_title TEXT DEFAULT 'O sabor que une momentos',
    hero_subtitle TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para performance
CREATE INDEX idx_umenu_tenant_settings_tenant ON umenu_tenant_settings(tenant_id);

-- =====================================================
-- 3. ATUALIZAR TABELA DE CATEGORIAS EXISTENTE
-- =====================================================
-- Adicionar tenant_id à tabela existente
ALTER TABLE umenu_categories 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES umenu_tenants(id) ON DELETE CASCADE;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_umenu_categories_tenant_id ON umenu_categories(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_umenu_categories_tenant_slug ON umenu_categories(tenant_id, slug);
CREATE INDEX IF NOT EXISTS idx_umenu_categories_tenant_active ON umenu_categories(tenant_id, display_order);

-- =====================================================
-- 4. ATUALIZAR TABELA DE PRODUTOS EXISTENTE
-- =====================================================
-- Adicionar tenant_id à tabela existente
ALTER TABLE umenu_products 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES umenu_tenants(id) ON DELETE CASCADE;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_umenu_products_tenant_id ON umenu_products(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_umenu_products_tenant_slug ON umenu_products(tenant_id, slug);
CREATE INDEX IF NOT EXISTS idx_umenu_products_tenant_category ON umenu_products(tenant_id, category_id);
CREATE INDEX IF NOT EXISTS idx_umenu_products_tenant_active ON umenu_products(tenant_id, display_order);

-- =====================================================
-- 5. ATUALIZAR TABELA DE PROMOÇÕES EXISTENTE
-- =====================================================
-- Adicionar tenant_id à tabela existente
ALTER TABLE umenu_promotions 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES umenu_tenants(id) ON DELETE CASCADE;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_umenu_promotions_tenant_id ON umenu_promotions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_umenu_promotions_tenant ON umenu_promotions(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_umenu_promotions_product ON umenu_promotions(product_id, is_active);
CREATE INDEX IF NOT EXISTS idx_umenu_promotions_valid ON umenu_promotions(valid_until, is_active);

-- =====================================================
-- 6. PEDIDOS (MULTI-TENANT)
-- =====================================================
CREATE TABLE IF NOT EXISTS umenu_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES umenu_tenants(id) ON DELETE CASCADE,
    customer_name VARCHAR(200),
    customer_phone VARCHAR(20),
    customer_address TEXT,
    items JSONB NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    whatsapp_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_umenu_orders_tenant ON umenu_orders(tenant_id, created_at DESC);
CREATE INDEX idx_umenu_orders_status ON umenu_orders(tenant_id, status);

-- =====================================================
-- 7. TRIGGERS PARA UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
CREATE TRIGGER update_umenu_tenants_updated_at BEFORE UPDATE ON umenu_tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_umenu_tenant_settings_updated_at BEFORE UPDATE ON umenu_tenant_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_umenu_categories_updated_at BEFORE UPDATE ON umenu_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_umenu_products_updated_at BEFORE UPDATE ON umenu_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_umenu_promotions_updated_at BEFORE UPDATE ON umenu_promotions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_umenu_orders_updated_at BEFORE UPDATE ON umenu_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Ativar RLS em todas as tabelas
ALTER TABLE umenu_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE umenu_tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE umenu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE umenu_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE umenu_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE umenu_orders ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS PARA TENANTS
-- =====================================================

-- Tenants: Proprietários podem ver/editar seus próprios tenants
CREATE POLICY "Enable read access for own tenant" ON umenu_tenants
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Enable insert for authenticated users" ON umenu_tenants
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Enable update for own tenant" ON umenu_tenants
    FOR UPDATE USING (auth.uid() = owner_id);

-- Política pública para leitura de tenants (necessário para cardápio público)
CREATE POLICY "Enable public read access for active tenants" ON umenu_tenants
    FOR SELECT USING (status = 'active');

-- =====================================================
-- POLÍTICAS RLS PARA TENANT_SETTINGS
-- =====================================================

-- Proprietários podem gerenciar configurações
CREATE POLICY "Enable read access for tenant members" ON umenu_tenant_settings
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM umenu_tenants 
        WHERE umenu_tenants.id = umenu_tenant_settings.tenant_id 
        AND umenu_tenants.owner_id = auth.uid()
    ));

CREATE POLICY "Enable insert for tenant members" ON umenu_tenant_settings
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM umenu_tenants 
        WHERE umenu_tenants.id = umenu_tenant_settings.tenant_id 
        AND umenu_tenants.owner_id = auth.uid()
    ));

CREATE POLICY "Enable update for tenant members" ON umenu_tenant_settings
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM umenu_tenants 
        WHERE umenu_tenants.id = umenu_tenant_settings.tenant_id 
        AND umenu_tenants.owner_id = auth.uid()
    ));

-- Política pública para leitura de configurações (necessário para cardápio público)
CREATE POLICY "Enable public read access for settings" ON umenu_tenant_settings
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM umenu_tenants 
        WHERE umenu_tenants.id = umenu_tenant_settings.tenant_id 
        AND umenu_tenants.status = 'active'
    ));

-- =====================================================
-- POLÍTICAS RLS PARA CATEGORIES
-- =====================================================

-- Proprietários podem gerenciar categorias
CREATE POLICY "Enable read access for tenant members" ON umenu_categories
    FOR SELECT USING (tenant_id IS NULL OR EXISTS (
        SELECT 1 FROM umenu_tenants 
        WHERE umenu_tenants.id = umenu_categories.tenant_id 
        AND umenu_tenants.owner_id = auth.uid()
    ));

CREATE POLICY "Enable insert for tenant members" ON umenu_categories
    FOR INSERT WITH CHECK (tenant_id IS NULL OR EXISTS (
        SELECT 1 FROM umenu_tenants 
        WHERE umenu_tenants.id = umenu_categories.tenant_id 
        AND umenu_tenants.owner_id = auth.uid()
    ));

CREATE POLICY "Enable update for tenant members" ON umenu_categories
    FOR UPDATE USING (tenant_id IS NULL OR EXISTS (
        SELECT 1 FROM umenu_tenants 
        WHERE umenu_tenants.id = umenu_categories.tenant_id 
        AND umenu_tenants.owner_id = auth.uid()
    ));

CREATE POLICY "Enable delete for tenant members" ON umenu_categories
    FOR DELETE USING (tenant_id IS NULL OR EXISTS (
        SELECT 1 FROM umenu_tenants 
        WHERE umenu_tenants.id = umenu_categories.tenant_id 
        AND umenu_tenants.owner_id = auth.uid()
    ));

-- Política pública para leitura de categorias ativas
CREATE POLICY "Enable public read access for active categories" ON umenu_categories
    FOR SELECT USING (tenant_id IS NULL OR EXISTS (
        SELECT 1 FROM umenu_tenants 
        WHERE umenu_tenants.id = umenu_categories.tenant_id 
        AND umenu_tenants.status = 'active'
    ));

-- =====================================================
-- POLÍTICAS RLS PARA PRODUCTS
-- =====================================================

-- Proprietários podem gerenciar produtos
CREATE POLICY "Enable read access for tenant members" ON umenu_products
    FOR SELECT USING (tenant_id IS NULL OR EXISTS (
        SELECT 1 FROM umenu_tenants 
        WHERE umenu_tenants.id = umenu_products.tenant_id 
        AND umenu_tenants.owner_id = auth.uid()
    ));

CREATE POLICY "Enable insert for tenant members" ON umenu_products
    FOR INSERT WITH CHECK (tenant_id IS NULL OR EXISTS (
        SELECT 1 FROM umenu_tenants 
        WHERE umenu_tenants.id = umenu_products.tenant_id 
        AND umenu_tenants.owner_id = auth.uid()
    ));

CREATE POLICY "Enable update for tenant members" ON umenu_products
    FOR UPDATE USING (tenant_id IS NULL OR EXISTS (
        SELECT 1 FROM umenu_tenants 
        WHERE umenu_tenants.id = umenu_products.tenant_id 
        AND umenu_tenants.owner_id = auth.uid()
    ));

CREATE POLICY "Enable delete for tenant members" ON umenu_products
    FOR DELETE USING (tenant_id IS NULL OR EXISTS (
        SELECT 1 FROM umenu_tenants 
        WHERE umenu_tenants.id = umenu_products.tenant_id 
        AND umenu_tenants.owner_id = auth.uid()
    ));

-- Política pública para leitura de produtos ativos
CREATE POLICY "Enable public read access for active products" ON umenu_products
    FOR SELECT USING (tenant_id IS NULL OR EXISTS (
        SELECT 1 FROM umenu_tenants 
        WHERE umenu_tenants.id = umenu_products.tenant_id 
        AND umenu_tenants.status = 'active'
    ));

-- =====================================================
-- POLÍTICAS RLS PARA PROMOTIONS
-- =====================================================

-- Proprietários podem gerenciar promoções
CREATE POLICY "Enable read access for tenant members" ON umenu_promotions
    FOR SELECT USING (tenant_id IS NULL OR EXISTS (
        SELECT 1 FROM umenu_tenants 
        WHERE umenu_tenants.id = umenu_promotions.tenant_id 
        AND umenu_tenants.owner_id = auth.uid()
    ));

CREATE POLICY "Enable insert for tenant members" ON umenu_promotions
    FOR INSERT WITH CHECK (tenant_id IS NULL OR EXISTS (
        SELECT 1 FROM umenu_tenants 
        WHERE umenu_tenants.id = umenu_promotions.tenant_id 
        AND umenu_tenants.owner_id = auth.uid()
    ));

CREATE POLICY "Enable update for tenant members" ON umenu_promotions
    FOR UPDATE USING (tenant_id IS NULL OR EXISTS (
        SELECT 1 FROM umenu_tenants 
        WHERE umenu_tenants.id = umenu_promotions.tenant_id 
        AND umenu_tenants.owner_id = auth.uid()
    ));

CREATE POLICY "Enable delete for tenant members" ON umenu_promotions
    FOR DELETE USING (tenant_id IS NULL OR EXISTS (
        SELECT 1 FROM umenu_tenants 
        WHERE umenu_tenants.id = umenu_promotions.tenant_id 
        AND umenu_tenants.owner_id = auth.uid()
    ));

-- Política pública para leitura de promoções ativas
CREATE POLICY "Enable public read access for active promotions" ON umenu_promotions
    FOR SELECT USING (tenant_id IS NULL OR EXISTS (
        SELECT 1 FROM umenu_tenants 
        WHERE umenu_tenants.id = umenu_promotions.tenant_id 
        AND umenu_tenants.status = 'active'
    ));

-- =====================================================
-- POLÍTICAS RLS PARA ORDERS
-- =====================================================

-- Proprietários podem ver pedidos do seu tenant
CREATE POLICY "Enable read access for tenant members" ON umenu_orders
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM umenu_tenants 
        WHERE umenu_tenants.id = umenu_orders.tenant_id 
        AND umenu_tenants.owner_id = auth.uid()
    ));

CREATE POLICY "Enable insert for tenant members" ON umenu_orders
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM umenu_tenants 
        WHERE umenu_tenants.id = umenu_orders.tenant_id 
        AND umenu_tenants.owner_id = auth.uid()
    ));

CREATE POLICY "Enable update for tenant members" ON umenu_orders
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM umenu_tenants 
        WHERE umenu_tenants.id = umenu_orders.tenant_id 
        AND umenu_tenants.owner_id = auth.uid()
    ));

-- =====================================================
-- 9. FUNÇÕES AUXILIARES
-- =====================================================

-- Função para verificar disponibilidade de subdomínio
CREATE OR REPLACE FUNCTION check_subdomain_availability(subdomain_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM umenu_tenants WHERE subdomain = subdomain_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter tenant por subdomínio
CREATE OR REPLACE FUNCTION get_tenant_by_subdomain(subdomain_param TEXT)
RETURNS TABLE (
    tenant_id UUID,
    tenant_name TEXT,
    tenant_status TEXT,
    business_phone TEXT,
    business_address TEXT,
    logo_url TEXT,
    banner_url TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    accent_color TEXT,
    business_hours JSONB,
    delivery_fee DECIMAL,
    minimum_order DECIMAL,
    is_open BOOLEAN,
    hero_title TEXT,
    hero_subtitle TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id as tenant_id,
        t.name as tenant_name,
        t.status as tenant_status,
        s.business_phone,
        s.business_address,
        s.logo_url,
        s.banner_url,
        s.primary_color,
        s.secondary_color,
        s.accent_color,
        s.business_hours,
        s.delivery_fee,
        s.minimum_order,
        s.is_open,
        s.hero_title,
        s.hero_subtitle
    FROM umenu_tenants t
    LEFT JOIN umenu_tenant_settings s ON t.id = s.tenant_id
    WHERE t.subdomain = subdomain_param AND t.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para buscar menu completo por subdomínio
CREATE OR REPLACE FUNCTION get_menu_by_subdomain(subdomain_param TEXT)
RETURNS JSON AS $$
DECLARE
    result JSON;
    tenant_data RECORD;
BEGIN
    -- Verificar se o tenant existe e está ativo
    SELECT * INTO tenant_data FROM get_tenant_by_subdomain(subdomain_param);
    
    IF tenant_data.tenant_id IS NULL THEN
        RETURN json_build_object('error', 'Tenant not found or inactive');
    END IF;
    
    -- Construir o JSON completo
    SELECT json_build_object(
        'tenant', json_build_object(
            'id', tenant_data.tenant_id,
            'name', tenant_data.tenant_name,
            'subdomain', subdomain_param,
            'status', tenant_data.tenant_status
        ),
        'settings', json_build_object(
            'business_phone', tenant_data.business_phone,
            'business_address', tenant_data.business_address,
            'logo_url', tenant_data.logo_url,
            'banner_url', tenant_data.banner_url,
            'primary_color', tenant_data.primary_color,
            'secondary_color', tenant_data.secondary_color,
            'accent_color', tenant_data.accent_color,
            'business_hours', tenant_data.business_hours,
            'delivery_fee', tenant_data.delivery_fee,
            'minimum_order', tenant_data.minimum_order,
            'is_open', tenant_data.is_open,
            'hero_title', tenant_data.hero_title,
            'hero_subtitle', tenant_data.hero_subtitle
        ),
        'categories', (
            SELECT json_agg(
                json_build_object(
                    'id', c.id,
                    'name', c.name,
                    'slug', c.slug,
                    'description', c.description,
                    'image_url', c.image_url,
                    'products', (
                        SELECT json_agg(
                            json_build_object(
                                'id', p.id,
                                'name', p.name,
                                'slug', p.slug,
                                'description', p.description,
                                'price', p.price,
                                'pricing_type', p.pricing_type,
                                'min_quantity', p.min_quantity,
                                'step_quantity', p.step_quantity,
                                'image_url', p.image_url,
                                'promotion', (
                                    SELECT json_build_object(
                                        'id', pr.id,
                                        'name', pr.name,
                                        'label', pr.label,
                                        'promotional_price', pr.promotional_price,
                                        'discount_percentage', pr.discount_percentage,
                                        'valid_until', pr.valid_until,
                                        'is_active', pr.is_active
                                    )
                                    FROM umenu_promotions pr
                                    WHERE pr.product_id = p.id 
                                    AND pr.is_active = true
                                    AND (pr.valid_until IS NULL OR pr.valid_until > NOW())
                                    LIMIT 1
                                )
                            )
                        )
                        FROM umenu_products p
                        WHERE p.category_id = c.id 
                        AND p.tenant_id = tenant_data.tenant_id
                        ORDER BY p.display_order, p.name
                    )
                )
                ORDER BY c.display_order, c.name
            )
            FROM umenu_categories c
            WHERE c.tenant_id = tenant_data.tenant_id
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar configurações padrão para novo tenant
CREATE OR REPLACE FUNCTION create_default_tenant_settings(tenant_id_param UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO umenu_tenant_settings (tenant_id) VALUES (tenant_id_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. VIEWS ÚTEIS
-- =====================================================

-- View para produtos com promoções por tenant
CREATE VIEW umenu_tenant_products_with_promotions AS
SELECT 
    p.*,
    pr.id as promotion_id,
    pr.name as promotion_name,
    pr.label as promotion_label,
    pr.promotional_price,
    pr.discount_percentage,
    pr.valid_until as promotion_valid_until,
    pr.is_active as promotion_active,
    c.name as category_name,
    c.slug as category_slug,
    t.name as tenant_name,
    t.subdomain as tenant_subdomain
FROM umenu_products p
JOIN umenu_tenants t ON p.tenant_id = t.id
LEFT JOIN umenu_promotions pr ON p.id = pr.product_id 
    AND pr.is_active = true 
    AND (pr.valid_until IS NULL OR pr.valid_until > NOW())
JOIN umenu_categories c ON p.category_id = c.id
WHERE t.status = 'active'
ORDER BY t.name, c.display_order, p.display_order;

-- =====================================================
-- 11. DADOS DE EXEMPLO (OPCIONAL)
-- =====================================================

-- Função para criar tenant de exemplo
CREATE OR REPLACE FUNCTION create_sample_tenant(
    owner_email TEXT,
    tenant_name TEXT,
    subdomain_param TEXT
)
RETURNS UUID AS $$
DECLARE
    tenant_id UUID;
    owner_id UUID;
    fritos_id UUID;
    quiches_id UUID;
    doces_id UUID;
BEGIN
    -- Para exemplo, vamos usar um UUID fixo
    owner_id := uuid_generate_v4();
    
    -- Criar tenant
    INSERT INTO umenu_tenants (name, subdomain, owner_id)
    VALUES (tenant_name, subdomain_param, owner_id)
    RETURNING id INTO tenant_id;
    
    -- Criar configurações padrão
    PERFORM create_default_tenant_settings(tenant_id);
    
    -- Criar categorias de exemplo
    INSERT INTO umenu_categories (tenant_id, name, slug, display_order) VALUES
    (tenant_id, 'Fritos', 'fritos', 1),
    (tenant_id, 'Mini Quiches', 'mini-quiches', 2),
    (tenant_id, 'Doces', 'doces', 3)
    RETURNING id INTO fritos_id;
    
    SELECT id INTO fritos_id FROM umenu_categories WHERE tenant_id = tenant_id AND slug = 'fritos';
    SELECT id INTO quiches_id FROM umenu_categories WHERE tenant_id = tenant_id AND slug = 'mini-quiches';
    SELECT id INTO doces_id FROM umenu_categories WHERE tenant_id = tenant_id AND slug = 'doces';
    
    -- Criar produtos de exemplo
    INSERT INTO umenu_products (tenant_id, category_id, name, slug, description, price, pricing_type, min_quantity, step_quantity, image_url) VALUES
    (tenant_id, fritos_id, 'Pastel', 'pastel', 'Massa crocante recheada', 130.00, 'cento', 25, 25, 'https://adsmentor.com.br/wp-content/uploads/2025/07/pastel.png'),
    (tenant_id, quiches_id, 'Quiche Especial', 'quiche-especial', 'Mini quiche gourmet', 7.00, 'unidade', NULL, 1, 'https://adsmentor.com.br/wp-content/uploads/2025/07/Quiches.png'),
    (tenant_id, doces_id, 'Brigadeiro', 'brigadeiro', 'Doce tradicional brasileiro', 190.00, 'cento', 25, 25, 'https://adsmentor.com.br/wp-content/uploads/2025/07/brigadeiro.png');
    
    RETURN tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMENTÁRIOS FINAIS
-- =====================================================

COMMENT ON TABLE umenu_tenants IS 'Restaurantes/clientes do SAAS';
COMMENT ON TABLE umenu_tenant_settings IS 'Configurações específicas de cada tenant';
COMMENT ON TABLE umenu_categories IS 'Categorias de produtos por tenant';
COMMENT ON TABLE umenu_products IS 'Produtos do cardápio por tenant';
COMMENT ON TABLE umenu_promotions IS 'Promoções ativas por tenant';
COMMENT ON TABLE umenu_orders IS 'Pedidos realizados por tenant';

-- =====================================================
-- SCHEMA SAAS ATUALIZADO COM PREFIXO umenu_ CRIADO!
-- Execute este arquivo no Supabase SQL Editor
-- =====================================================