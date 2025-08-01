# 🚀 Setup do Banco de Dados - UMenu

## ❌ Problema Atual
Você tem duas situações possíveis:

### Situação 1: Tabelas não existem
Erros 400/404 porque as tabelas não foram criadas:
- `umenu_tenants`
- `umenu_tenant_settings` 
- `umenu_categories`
- `umenu_products`
- `umenu_promotions`

### Situação 2: Tabelas existem mas estão incompletas
Erro `column "tenant_id" does not exist` - você tem tabelas antigas sem as colunas necessárias.

## ✅ Solução: Escolha o Script Correto

### Passo 1: Acesse o Supabase
1. Vá para [supabase.com](https://supabase.com)
2. Entre no seu projeto
3. Vá para **SQL Editor** no menu lateral

### Passo 2: Escolha o Script Correto

#### 🆕 **Se as tabelas NÃO existem** (primeira vez)
1. Use o arquivo `database/saas-schema-safe.sql`
2. Copie **TODO** o conteúdo
3. Cole no SQL Editor e execute

#### 🔧 **Se as tabelas JÁ existem** (erro de coluna faltando)

**Opção A - Correção Rápida (Recomendado)**
1. Use o arquivo `database/quick-fix.sql`
2. Copie **TODO** o conteúdo
3. Cole no SQL Editor e execute

**Opção B - Migração Completa**
1. Use o arquivo `database/migration-fix.sql`
2. Copie **TODO** o conteúdo
3. Cole no SQL Editor e execute

> 💡 **Dica**: Se tiver erro de função, use o `quick-fix.sql` primeiro

### Passo 3: Verificar se Funcionou
Após executar o script, você deve ver as seguintes tabelas criadas:

```sql
-- Verificar se as tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'umenu_%';
```

Deve retornar:
- `umenu_tenants`
- `umenu_tenant_settings`
- `umenu_categories`
- `umenu_products`
- `umenu_promotions`
- `umenu_orders`

## 🔧 O que o Script Faz

### 1. **Cria as Tabelas Principais**
- **umenu_tenants**: Restaurantes/clientes do SAAS
- **umenu_tenant_settings**: Configurações de cada restaurante
- **umenu_categories**: Categorias de produtos por tenant
- **umenu_products**: Produtos do cardápio por tenant
- **umenu_promotions**: Promoções ativas por tenant

### 2. **Configura Segurança (RLS)**
- Row Level Security para isolamento de dados por tenant
- Políticas que garantem que cada restaurante vê apenas seus dados
- Autenticação baseada no usuário logado

### 3. **Cria Funções Auxiliares**
- `check_subdomain_availability()`: Verifica se subdomínio está disponível
- `get_tenant_by_subdomain()`: Busca dados do tenant
- `get_menu_by_subdomain()`: Retorna menu completo

### 4. **Índices para Performance**
- Índices otimizados para consultas multi-tenant
- Chaves únicas para subdomínios
- Índices compostos para queries eficientes

## 🎯 Após Executar o Script

1. **Faça um novo cadastro** de restaurante
2. **Verifique se os dados são salvos** corretamente
3. **Teste o painel admin** - deve carregar sem erros
4. **Botões funcionarão** corretamente

## 🔧 Troubleshooting

### Erros Comuns e Soluções:

#### `ERROR: cannot change return type of existing function`
- **Solução**: Use o arquivo `quick-fix.sql` em vez do `migration-fix.sql`
- Este erro acontece quando funções já existem com tipos diferentes

#### `ERROR: column "tenant_id" does not exist`
- **Solução**: Execute o `quick-fix.sql` para adicionar as colunas que faltam

#### `Could not find the 'is_available' column`
- **Solução**: Execute o arquivo `add-missing-columns.sql` para adicionar colunas específicas
- Este erro acontece quando algumas colunas da tabela products não foram criadas

#### `ERROR: relation "idx_umenu_tenants_subdomain" already exists`
- **Solução**: Use qualquer um dos scripts "safe" que verificam existência antes de criar

### Se ainda houver erros:

1. **Verifique as variáveis de ambiente**:
   ```env
   VITE_SUPABASE_URL=sua_url_aqui
   VITE_SUPABASE_ANON_KEY=sua_chave_aqui
   ```

2. **Verifique se o RLS está ativo**:
   ```sql
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename LIKE 'umenu_%';
   ```

3. **Teste uma query simples**:
   ```sql
   SELECT * FROM umenu_tenants LIMIT 1;
   ```

## 📞 Suporte

Se ainda houver problemas após executar o script, me informe:
1. Qual erro específico está aparecendo
2. Se todas as tabelas foram criadas
3. Se as políticas RLS estão ativas

---

**⚠️ IMPORTANTE**: Execute o script `saas-schema-safe.sql` ANTES de tentar usar o sistema novamente!

## 🆕 Versão Segura do Script

O arquivo `saas-schema-safe.sql` foi criado para resolver o erro que você encontrou:
- ✅ Usa `CREATE TABLE IF NOT EXISTS`
- ✅ Usa `CREATE INDEX IF NOT EXISTS` 
- ✅ Remove políticas existentes antes de recriar
- ✅ Remove triggers existentes antes de recriar
- ✅ Pode ser executado múltiplas vezes sem erros
