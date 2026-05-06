-- =====================================================
-- ADICIONAR COLUNAS QUE FALTAM NA TABELA PRODUCTS
-- Execute este script se você tem erro "Could not find column"
-- =====================================================

-- Adicionar colunas que podem estar faltando na tabela umenu_products
ALTER TABLE umenu_products ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;
ALTER TABLE umenu_products ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE umenu_products ADD COLUMN IF NOT EXISTS pricing_type VARCHAR(20) DEFAULT 'unidade';
ALTER TABLE umenu_products ADD COLUMN IF NOT EXISTS min_quantity INTEGER;
ALTER TABLE umenu_products ADD COLUMN IF NOT EXISTS step_quantity INTEGER DEFAULT 1;
ALTER TABLE umenu_products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE umenu_products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Adicionar colunas que podem estar faltando na tabela umenu_categories
ALTER TABLE umenu_categories ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE umenu_categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE umenu_categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Verificar se as colunas foram adicionadas
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'umenu_products' 
AND column_name IN ('is_available', 'display_order', 'pricing_type', 'min_quantity', 'step_quantity')
ORDER BY column_name;

SELECT 'Colunas adicionadas com sucesso!' as resultado;
