-- =====================================================
-- CORREÇÃO RÁPIDA PARA TABELAS EXISTENTES
-- Execute este script se você tem erro "column tenant_id does not exist"
-- =====================================================

-- 1. Adicionar tenant_id nas tabelas que precisam
ALTER TABLE umenu_tenant_settings ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES umenu_tenants(id) ON DELETE CASCADE;
ALTER TABLE umenu_categories ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES umenu_tenants(id) ON DELETE CASCADE;
ALTER TABLE umenu_products ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES umenu_tenants(id) ON DELETE CASCADE;
ALTER TABLE umenu_promotions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES umenu_tenants(id) ON DELETE CASCADE;

-- 2. Adicionar outras colunas essenciais que podem estar faltando
ALTER TABLE umenu_tenant_settings ADD COLUMN IF NOT EXISTS business_phone TEXT;
ALTER TABLE umenu_tenant_settings ADD COLUMN IF NOT EXISTS business_address TEXT;
ALTER TABLE umenu_tenant_settings ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE umenu_tenant_settings ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7) DEFAULT '#f97316';
ALTER TABLE umenu_tenant_settings ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT true;

ALTER TABLE umenu_products ADD COLUMN IF NOT EXISTS pricing_type VARCHAR(20) DEFAULT 'unidade';
ALTER TABLE umenu_products ADD COLUMN IF NOT EXISTS min_quantity INTEGER;
ALTER TABLE umenu_products ADD COLUMN IF NOT EXISTS step_quantity INTEGER DEFAULT 1;
ALTER TABLE umenu_products ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE umenu_products ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;

-- 3. Criar índices básicos
CREATE INDEX IF NOT EXISTS idx_umenu_tenant_settings_tenant ON umenu_tenant_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_umenu_categories_tenant_id ON umenu_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_umenu_products_tenant_id ON umenu_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_umenu_promotions_tenant_id ON umenu_promotions(tenant_id);

-- 4. Ativar RLS
ALTER TABLE umenu_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE umenu_tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE umenu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE umenu_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE umenu_promotions ENABLE ROW LEVEL SECURITY;

-- 5. Remover e recriar função problemática
DROP FUNCTION IF EXISTS check_subdomain_availability(TEXT);
CREATE FUNCTION check_subdomain_availability(subdomain_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM umenu_tenants WHERE subdomain = subdomain_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Políticas RLS básicas para tenants
DROP POLICY IF EXISTS "Enable read access for tenant owners" ON umenu_tenants;
CREATE POLICY "Enable read access for tenant owners" ON umenu_tenants
    FOR SELECT USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON umenu_tenants;
CREATE POLICY "Enable insert for authenticated users" ON umenu_tenants
    FOR INSERT WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Enable update for tenant owners" ON umenu_tenants;
CREATE POLICY "Enable update for tenant owners" ON umenu_tenants
    FOR UPDATE USING (owner_id = auth.uid());

-- 7. Políticas RLS para categories
DROP POLICY IF EXISTS "Enable read access for tenant members" ON umenu_categories;
CREATE POLICY "Enable read access for tenant members" ON umenu_categories
    FOR SELECT USING (tenant_id IS NULL OR EXISTS (
        SELECT 1 FROM umenu_tenants 
        WHERE umenu_tenants.id = umenu_categories.tenant_id 
        AND umenu_tenants.owner_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Enable insert for tenant members" ON umenu_categories;
CREATE POLICY "Enable insert for tenant members" ON umenu_categories
    FOR INSERT WITH CHECK (tenant_id IS NULL OR EXISTS (
        SELECT 1 FROM umenu_tenants 
        WHERE umenu_tenants.id = umenu_categories.tenant_id 
        AND umenu_tenants.owner_id = auth.uid()
    ));

-- 8. Políticas RLS para products
DROP POLICY IF EXISTS "Enable read access for tenant members" ON umenu_products;
CREATE POLICY "Enable read access for tenant members" ON umenu_products
    FOR SELECT USING (tenant_id IS NULL OR EXISTS (
        SELECT 1 FROM umenu_tenants 
        WHERE umenu_tenants.id = umenu_products.tenant_id 
        AND umenu_tenants.owner_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Enable insert for tenant members" ON umenu_products;
CREATE POLICY "Enable insert for tenant members" ON umenu_products
    FOR INSERT WITH CHECK (tenant_id IS NULL OR EXISTS (
        SELECT 1 FROM umenu_tenants 
        WHERE umenu_tenants.id = umenu_products.tenant_id 
        AND umenu_tenants.owner_id = auth.uid()
    ));

-- =====================================================
-- CORREÇÃO RÁPIDA CONCLUÍDA!
-- =====================================================

SELECT 'Correção rápida aplicada! Teste o sistema agora.' as resultado;
