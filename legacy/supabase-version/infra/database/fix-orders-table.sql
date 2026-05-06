-- =====================================================
-- SCRIPT PARA CORRIGIR TABELA DE PEDIDOS
-- Execute este script se a tabela umenu_orders já existir
-- =====================================================

-- Remover tabela existente se necessário
DROP TABLE IF EXISTS umenu_orders CASCADE;

-- Recriar tabela de pedidos com estrutura correta
CREATE TABLE umenu_orders (
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

-- Recriar índices
CREATE INDEX idx_umenu_orders_tenant ON umenu_orders(tenant_id, created_at DESC);
CREATE INDEX idx_umenu_orders_status ON umenu_orders(tenant_id, status);

-- Recriar trigger
CREATE TRIGGER update_umenu_orders_updated_at 
    BEFORE UPDATE ON umenu_orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Reativar RLS
ALTER TABLE umenu_orders ENABLE ROW LEVEL SECURITY;

-- Recriar políticas RLS
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

-- Comentário
COMMENT ON TABLE umenu_orders IS 'Pedidos realizados por tenant - CORRIGIDO';