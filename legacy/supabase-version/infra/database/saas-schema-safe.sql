-- =====================================================
-- uMENU SAAS - MULTI-TENANT DATABASE SCHEMA (SAFE VERSION)
-- Supabase PostgreSQL Schema para SAAS com prefixo umenu_
-- Esta versão verifica se elementos já existem antes de criar
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

-- Índices para performance (com IF NOT EXISTS)
CREATE UNIQUE INDEX IF NOT EXISTS idx_umenu_tenants_subdomain ON umenu_tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_umenu_tenants_owner ON umenu_tenants(owner_id);
CREATE INDEX IF NOT EXISTS idx_umenu_tenants_status ON umenu_tenants(status);

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
CREATE INDEX IF NOT EXISTS idx_umenu_tenant_settings_tenant ON umenu_tenant_settings(tenant_id);

-- =====================================================
-- 3. TABELA DE CATEGORIAS
-- =====================================================
CREATE TABLE IF NOT EXISTS umenu_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES umenu_tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_umenu_categories_tenant_id ON umenu_categories(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_umenu_categories_tenant_slug ON umenu_categories(tenant_id, slug);
CREATE INDEX IF NOT EXISTS idx_umenu_categories_tenant_active ON umenu_categories(tenant_id, display_order);

-- =====================================================
-- 4. TABELA DE PRODUTOS
-- =====================================================
CREATE TABLE IF NOT EXISTS umenu_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES umenu_tenants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES umenu_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    pricing_type VARCHAR(20) DEFAULT 'unidade', -- 'unidade', 'cento', 'kg'
    min_quantity INTEGER,
    step_quantity INTEGER DEFAULT 1,
    image_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_umenu_products_tenant_id ON umenu_products(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_umenu_products_tenant_slug ON umenu_products(tenant_id, slug);
CREATE INDEX IF NOT EXISTS idx_umenu_products_tenant_category ON umenu_products(tenant_id, category_id);
CREATE INDEX IF NOT EXISTS idx_umenu_products_tenant_active ON umenu_products(tenant_id, display_order);

-- =====================================================
-- 5. TABELA DE PROMOÇÕES
-- =====================================================
CREATE TABLE IF NOT EXISTS umenu_promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES umenu_tenants(id) ON DELETE CASCADE,
    product_id UUID REFERENCES umenu_products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    label TEXT,
    promotional_price DECIMAL(10,2),
    discount_percentage INTEGER,
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_umenu_promotions_tenant_id ON umenu_promotions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_umenu_promotions_tenant ON umenu_promotions(tenant_id, is_active);

-- =====================================================
-- 6. TABELA DE PEDIDOS
-- =====================================================
CREATE TABLE IF NOT EXISTS umenu_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES umenu_tenants(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT,
    items JSONB NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_umenu_orders_tenant_id ON umenu_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_umenu_orders_status ON umenu_orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_umenu_orders_created ON umenu_orders(tenant_id, created_at);

-- =====================================================
-- 7. FUNÇÃO PARA CRIAR CONFIGURAÇÕES PADRÃO
-- =====================================================
CREATE OR REPLACE FUNCTION create_default_tenant_settings(tenant_id_param UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO umenu_tenant_settings (tenant_id)
    VALUES (tenant_id_param)
    ON CONFLICT (tenant_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. TRIGGERS PARA UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers (DROP IF EXISTS para evitar erros)
DROP TRIGGER IF EXISTS update_umenu_tenants_updated_at ON umenu_tenants;
CREATE TRIGGER update_umenu_tenants_updated_at BEFORE UPDATE ON umenu_tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_umenu_tenant_settings_updated_at ON umenu_tenant_settings;
CREATE TRIGGER update_umenu_tenant_settings_updated_at BEFORE UPDATE ON umenu_tenant_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_umenu_categories_updated_at ON umenu_categories;
CREATE TRIGGER update_umenu_categories_updated_at BEFORE UPDATE ON umenu_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_umenu_products_updated_at ON umenu_products;
CREATE TRIGGER update_umenu_products_updated_at BEFORE UPDATE ON umenu_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_umenu_promotions_updated_at ON umenu_promotions;
CREATE TRIGGER update_umenu_promotions_updated_at BEFORE UPDATE ON umenu_promotions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_umenu_orders_updated_at ON umenu_orders;
CREATE TRIGGER update_umenu_orders_updated_at BEFORE UPDATE ON umenu_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. ROW LEVEL SECURITY (RLS)
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

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Enable read access for tenant owners" ON umenu_tenants;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON umenu_tenants;
DROP POLICY IF EXISTS "Enable update for tenant owners" ON umenu_tenants;

-- Tenants: Proprietários podem ver/editar seus próprios tenants
CREATE POLICY "Enable read access for tenant owners" ON umenu_tenants
    FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Enable insert for authenticated users" ON umenu_tenants
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Enable update for tenant owners" ON umenu_tenants
    FOR UPDATE USING (owner_id = auth.uid());

-- =====================================================
-- POLÍTICAS RLS PARA TENANT SETTINGS
-- =====================================================

DROP POLICY IF EXISTS "Enable read access for tenant members" ON umenu_tenant_settings;
DROP POLICY IF EXISTS "Enable insert for tenant members" ON umenu_tenant_settings;
DROP POLICY IF EXISTS "Enable update for tenant members" ON umenu_tenant_settings;

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

-- =====================================================
-- POLÍTICAS RLS PARA CATEGORIES
-- =====================================================

DROP POLICY IF EXISTS "Enable read access for tenant members" ON umenu_categories;
DROP POLICY IF EXISTS "Enable insert for tenant members" ON umenu_categories;
DROP POLICY IF EXISTS "Enable update for tenant members" ON umenu_categories;
DROP POLICY IF EXISTS "Enable delete for tenant members" ON umenu_categories;

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

-- =====================================================
-- POLÍTICAS RLS PARA PRODUCTS
-- =====================================================

DROP POLICY IF EXISTS "Enable read access for tenant members" ON umenu_products;
DROP POLICY IF EXISTS "Enable insert for tenant members" ON umenu_products;
DROP POLICY IF EXISTS "Enable update for tenant members" ON umenu_products;
DROP POLICY IF EXISTS "Enable delete for tenant members" ON umenu_products;

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

-- =====================================================
-- POLÍTICAS RLS PARA PROMOTIONS
-- =====================================================

DROP POLICY IF EXISTS "Enable read access for tenant members" ON umenu_promotions;
DROP POLICY IF EXISTS "Enable insert for tenant members" ON umenu_promotions;
DROP POLICY IF EXISTS "Enable update for tenant members" ON umenu_promotions;
DROP POLICY IF EXISTS "Enable delete for tenant members" ON umenu_promotions;

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

-- =====================================================
-- 10. FUNÇÕES AUXILIARES
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

-- Função para buscar tenant por subdomínio
CREATE OR REPLACE FUNCTION get_tenant_by_subdomain(subdomain_param TEXT)
RETURNS TABLE(
    id UUID,
    name TEXT,
    subdomain TEXT,
    owner_id UUID,
    plan VARCHAR(50),
    status VARCHAR(20),
    business_phone TEXT,
    business_address TEXT,
    logo_url TEXT,
    banner_url TEXT,
    primary_color VARCHAR(7),
    secondary_color VARCHAR(7),
    accent_color VARCHAR(7),
    business_hours JSONB,
    delivery_fee DECIMAL(10,2),
    minimum_order DECIMAL(10,2),
    is_open BOOLEAN,
    hero_title TEXT,
    hero_subtitle TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id, t.name, t.subdomain, t.owner_id, t.plan, t.status,
        s.business_phone, s.business_address, s.logo_url, s.banner_url,
        s.primary_color, s.secondary_color, s.accent_color, s.business_hours,
        s.delivery_fee, s.minimum_order, s.is_open, s.hero_title, s.hero_subtitle
    FROM umenu_tenants t
    LEFT JOIN umenu_tenant_settings s ON t.id = s.tenant_id
    WHERE t.subdomain = subdomain_param AND t.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 11. COMENTÁRIOS FINAIS
-- =====================================================

COMMENT ON TABLE umenu_tenants IS 'Restaurantes/clientes do SAAS';
COMMENT ON TABLE umenu_tenant_settings IS 'Configurações específicas de cada tenant';
COMMENT ON TABLE umenu_categories IS 'Categorias de produtos por tenant';
COMMENT ON TABLE umenu_products IS 'Produtos do cardápio por tenant';
COMMENT ON TABLE umenu_promotions IS 'Promoções ativas por tenant';
COMMENT ON TABLE umenu_orders IS 'Pedidos realizados por tenant';

-- =====================================================
-- SCHEMA SAAS SEGURO CRIADO!
-- Este script pode ser executado múltiplas vezes sem erros
-- =====================================================
