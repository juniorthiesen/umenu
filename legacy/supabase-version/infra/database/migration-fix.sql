-- =====================================================
-- MIGRAÇÃO PARA CORRIGIR TABELAS EXISTENTES
-- Execute este script se você já tem tabelas criadas mas com estrutura antiga
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. VERIFICAR E CORRIGIR TABELA TENANTS
-- =====================================================
CREATE TABLE IF NOT EXISTS umenu_tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subdomain TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan VARCHAR(50) DEFAULT 'free',
    status VARCHAR(20) DEFAULT 'active',
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. CORRIGIR TABELA TENANT_SETTINGS
-- =====================================================

-- Adicionar colunas que podem estar faltando
DO $$ 
BEGIN
    -- Adicionar tenant_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'umenu_tenant_settings' AND column_name = 'tenant_id') THEN
        ALTER TABLE umenu_tenant_settings ADD COLUMN tenant_id UUID REFERENCES umenu_tenants(id) ON DELETE CASCADE;
    END IF;
    
    -- Adicionar outras colunas se não existirem
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'umenu_tenant_settings' AND column_name = 'business_phone') THEN
        ALTER TABLE umenu_tenant_settings ADD COLUMN business_phone TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'umenu_tenant_settings' AND column_name = 'business_address') THEN
        ALTER TABLE umenu_tenant_settings ADD COLUMN business_address TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'umenu_tenant_settings' AND column_name = 'logo_url') THEN
        ALTER TABLE umenu_tenant_settings ADD COLUMN logo_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'umenu_tenant_settings' AND column_name = 'banner_url') THEN
        ALTER TABLE umenu_tenant_settings ADD COLUMN banner_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'umenu_tenant_settings' AND column_name = 'primary_color') THEN
        ALTER TABLE umenu_tenant_settings ADD COLUMN primary_color VARCHAR(7) DEFAULT '#f97316';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'umenu_tenant_settings' AND column_name = 'secondary_color') THEN
        ALTER TABLE umenu_tenant_settings ADD COLUMN secondary_color VARCHAR(7) DEFAULT '#1e293b';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'umenu_tenant_settings' AND column_name = 'accent_color') THEN
        ALTER TABLE umenu_tenant_settings ADD COLUMN accent_color VARCHAR(7) DEFAULT '#16a34a';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'umenu_tenant_settings' AND column_name = 'business_hours') THEN
        ALTER TABLE umenu_tenant_settings ADD COLUMN business_hours JSONB DEFAULT '{"1": {"start": 9, "end": 18}, "2": {"start": 9, "end": 18}, "3": {"start": 9, "end": 18}, "4": {"start": 9, "end": 18}, "5": {"start": 9, "end": 18}, "6": {"start": 9, "end": 13}, "0": null}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'umenu_tenant_settings' AND column_name = 'delivery_fee') THEN
        ALTER TABLE umenu_tenant_settings ADD COLUMN delivery_fee DECIMAL(10,2) DEFAULT 5.00;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'umenu_tenant_settings' AND column_name = 'minimum_order') THEN
        ALTER TABLE umenu_tenant_settings ADD COLUMN minimum_order DECIMAL(10,2) DEFAULT 30.00;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'umenu_tenant_settings' AND column_name = 'is_open') THEN
        ALTER TABLE umenu_tenant_settings ADD COLUMN is_open BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'umenu_tenant_settings' AND column_name = 'hero_title') THEN
        ALTER TABLE umenu_tenant_settings ADD COLUMN hero_title TEXT DEFAULT 'O sabor que une momentos';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'umenu_tenant_settings' AND column_name = 'hero_subtitle') THEN
        ALTER TABLE umenu_tenant_settings ADD COLUMN hero_subtitle TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'umenu_tenant_settings' AND column_name = 'created_at') THEN
        ALTER TABLE umenu_tenant_settings ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'umenu_tenant_settings' AND column_name = 'updated_at') THEN
        ALTER TABLE umenu_tenant_settings ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- =====================================================
-- 3. CORRIGIR TABELA CATEGORIES
-- =====================================================

-- Adicionar tenant_id se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'umenu_categories' AND column_name = 'tenant_id') THEN
        ALTER TABLE umenu_categories ADD COLUMN tenant_id UUID REFERENCES umenu_tenants(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================
-- 4. CORRIGIR TABELA PRODUCTS
-- =====================================================

-- Adicionar tenant_id se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'umenu_products' AND column_name = 'tenant_id') THEN
        ALTER TABLE umenu_products ADD COLUMN tenant_id UUID REFERENCES umenu_tenants(id) ON DELETE CASCADE;
    END IF;
    
    -- Adicionar outras colunas que podem estar faltando
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'umenu_products' AND column_name = 'pricing_type') THEN
        ALTER TABLE umenu_products ADD COLUMN pricing_type VARCHAR(20) DEFAULT 'unidade';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'umenu_products' AND column_name = 'min_quantity') THEN
        ALTER TABLE umenu_products ADD COLUMN min_quantity INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'umenu_products' AND column_name = 'step_quantity') THEN
        ALTER TABLE umenu_products ADD COLUMN step_quantity INTEGER DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'umenu_products' AND column_name = 'display_order') THEN
        ALTER TABLE umenu_products ADD COLUMN display_order INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'umenu_products' AND column_name = 'is_available') THEN
        ALTER TABLE umenu_products ADD COLUMN is_available BOOLEAN DEFAULT true;
    END IF;
END $$;

-- =====================================================
-- 5. CORRIGIR TABELA PROMOTIONS
-- =====================================================

-- Adicionar tenant_id se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'umenu_promotions' AND column_name = 'tenant_id') THEN
        ALTER TABLE umenu_promotions ADD COLUMN tenant_id UUID REFERENCES umenu_tenants(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================
-- 6. CRIAR ÍNDICES SE NÃO EXISTIREM
-- =====================================================

-- Índices para tenants
CREATE UNIQUE INDEX IF NOT EXISTS idx_umenu_tenants_subdomain ON umenu_tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_umenu_tenants_owner ON umenu_tenants(owner_id);
CREATE INDEX IF NOT EXISTS idx_umenu_tenants_status ON umenu_tenants(status);

-- Índices para tenant_settings
CREATE INDEX IF NOT EXISTS idx_umenu_tenant_settings_tenant ON umenu_tenant_settings(tenant_id);

-- Índices para categories
CREATE INDEX IF NOT EXISTS idx_umenu_categories_tenant_id ON umenu_categories(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_umenu_categories_tenant_slug ON umenu_categories(tenant_id, slug);
CREATE INDEX IF NOT EXISTS idx_umenu_categories_tenant_active ON umenu_categories(tenant_id, display_order);

-- Índices para products
CREATE INDEX IF NOT EXISTS idx_umenu_products_tenant_id ON umenu_products(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_umenu_products_tenant_slug ON umenu_products(tenant_id, slug);
CREATE INDEX IF NOT EXISTS idx_umenu_products_tenant_category ON umenu_products(tenant_id, category_id);
CREATE INDEX IF NOT EXISTS idx_umenu_products_tenant_active ON umenu_products(tenant_id, display_order);

-- Índices para promotions
CREATE INDEX IF NOT EXISTS idx_umenu_promotions_tenant_id ON umenu_promotions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_umenu_promotions_tenant ON umenu_promotions(tenant_id, is_active);

-- =====================================================
-- 7. ATIVAR ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE umenu_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE umenu_tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE umenu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE umenu_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE umenu_promotions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8. CRIAR POLÍTICAS RLS
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Enable read access for tenant owners" ON umenu_tenants;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON umenu_tenants;
DROP POLICY IF EXISTS "Enable update for tenant owners" ON umenu_tenants;

-- Políticas para tenants
CREATE POLICY "Enable read access for tenant owners" ON umenu_tenants
    FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Enable insert for authenticated users" ON umenu_tenants
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Enable update for tenant owners" ON umenu_tenants
    FOR UPDATE USING (owner_id = auth.uid());

-- Políticas para tenant_settings
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

-- Políticas para categories
DROP POLICY IF EXISTS "Enable read access for tenant members" ON umenu_categories;
DROP POLICY IF EXISTS "Enable insert for tenant members" ON umenu_categories;
DROP POLICY IF EXISTS "Enable update for tenant members" ON umenu_categories;
DROP POLICY IF EXISTS "Enable delete for tenant members" ON umenu_categories;

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

-- Políticas para products
DROP POLICY IF EXISTS "Enable read access for tenant members" ON umenu_products;
DROP POLICY IF EXISTS "Enable insert for tenant members" ON umenu_products;
DROP POLICY IF EXISTS "Enable update for tenant members" ON umenu_products;
DROP POLICY IF EXISTS "Enable delete for tenant members" ON umenu_products;

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

-- Políticas para promotions
DROP POLICY IF EXISTS "Enable read access for tenant members" ON umenu_promotions;
DROP POLICY IF EXISTS "Enable insert for tenant members" ON umenu_promotions;
DROP POLICY IF EXISTS "Enable update for tenant members" ON umenu_promotions;
DROP POLICY IF EXISTS "Enable delete for tenant members" ON umenu_promotions;

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
-- 9. FUNÇÕES AUXILIARES
-- =====================================================

-- Remover funções existentes se houver conflito de tipos
DROP FUNCTION IF EXISTS check_subdomain_availability(TEXT);
DROP FUNCTION IF EXISTS get_tenant_by_subdomain(TEXT);
DROP FUNCTION IF EXISTS create_default_tenant_settings(UUID);

-- Função para verificar disponibilidade de subdomínio
CREATE FUNCTION check_subdomain_availability(subdomain_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM umenu_tenants WHERE subdomain = subdomain_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para buscar tenant por subdomínio
CREATE FUNCTION get_tenant_by_subdomain(subdomain_param TEXT)
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

-- Função para criar configurações padrão
CREATE FUNCTION create_default_tenant_settings(tenant_id_param UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO umenu_tenant_settings (tenant_id)
    VALUES (tenant_id_param)
    ON CONFLICT (tenant_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. TRIGGERS PARA UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
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

-- =====================================================
-- MIGRAÇÃO CONCLUÍDA!
-- Este script corrige tabelas existentes adicionando colunas que faltam
-- =====================================================

SELECT 'Migração concluída! Verifique se todas as tabelas têm as colunas corretas.' as resultado;
