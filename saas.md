Guia de Transformação para SAAS: uMenu
Este documento detalha o processo para converter o sistema de cardápio digital de um único cliente em uma plataforma SAAS multi-tenant, onde cada cliente (restaurante) terá seu próprio subdomínio e painel de configuração.

Visão Geral da Arquitetura
A nova arquitetura será composta por três partes principais:

Landing Page (umenu.com.br): Página de vendas onde novos clientes se cadastram.

Painel do Cliente (app.umenu.com.br ou umenu.com.br/dashboard): Área logada para os clientes configurarem seus cardápios.

Cardápio Público (*.umenu.com.br): A aplicação de cardápio existente, que carregará os dados dinamicamente com base no subdomínio.

Passo 1: Estrutura do Banco de Dados Multi-Tenant no Supabase
A base do SAAS é um banco de dados que isola os dados de cada cliente ("tenant").

1.1. Novas Tabelas
Crie as seguintes tabelas no seu painel Supabase:

Tabela: tenants
Armazena as informações de cada cliente/restaurante.

Coluna	Tipo	Descrição
id	uuid	Chave primária (gerada automaticamente).
subdomain	text	Único. O subdomínio escolhido (ex: "pizzariadoedu"). Crie um índice único nesta coluna.
name	text	O nome do restaurante (ex: "Pizzaria do Edu").
owner_id	uuid	Chave estrangeira para auth.users(id). Vincula o tenant ao seu dono.
created_at	timestamp	Data de criação.

Exportar para as Planilhas
Tabela: settings
Configurações específicas de cada tenant.

Coluna	Tipo	Descrição
id	uuid	Chave primária.
tenant_id	uuid	Chave estrangeira para tenants(id).
business_phone	text	Telefone para contato/WhatsApp.
business_address	text	Endereço do estabelecimento.
logo_url	text	URL da imagem do logo.
banner_url	text	URL da imagem do banner principal.
business_hours	jsonb	Horários de funcionamento. Ex: {"1": {"start": 9, "end": 18}, ...}.

Exportar para as Planilhas
1.2. Modificação de Tabelas Existentes
Adicione a coluna tenant_id (do tipo uuid, com chave estrangeira para tenants(id)) às seguintes tabelas (se já existirem):

categories

products

promotions (se for uma tabela separada)

Isso garantirá que cada categoria, produto e promoção pertença a um tenant específico.

1.3. Ativar Row Level Security (RLS)
Esta é a etapa mais crítica para a segurança do seu SAAS.

Vá para a seção "Authentication" -> "Policies" no Supabase.

Ative o RLS para as tabelas tenants, settings, categories e products.

Crie as seguintes políticas:

Permitir que donos leiam seus próprios dados:

SQL

-- Para a tabela 'tenants'
CREATE POLICY "Enable read access for own tenant"
ON tenants FOR SELECT
USING (auth.uid() = owner_id);

-- Para as tabelas 'settings', 'categories', 'products'
CREATE POLICY "Enable read access for tenant members"
ON settings FOR SELECT
USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = settings.tenant_id AND tenants.owner_id = auth.uid()));
Permitir que donos modifiquem seus próprios dados (INSERT, UPDATE, DELETE):

SQL

-- Exemplo para a tabela 'products'
CREATE POLICY "Enable insert for tenant members"
ON products FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = products.tenant_id AND tenants.owner_id = auth.uid()));

CREATE POLICY "Enable update for tenant members"
ON products FOR UPDATE
USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = products.tenant_id AND tenants.owner_id = auth.uid()));

CREATE POLICY "Enable delete for tenant members"
ON products FOR DELETE
USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = products.tenant_id AND tenants.owner_id = auth.uid()));
Replicar políticas similares para todas as tabelas que contêm dados sensíveis do cliente.

Passo 2: Cadastro de Clientes e Verificação de Subdomínio
Crie o fluxo para um novo restaurante se cadastrar na plataforma.

2.1. Verificação de Subdomínio com Supabase Edge Function
Crie uma Edge Function:

Use a CLI do Supabase: supabase functions new check-subdomain

O código da função (index.ts) irá consultar a tabela tenants para ver se um subdomínio já existe.

TypeScript

// supabase/functions/check-subdomain/index.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey' } });
  }

  const { subdomain } = await req.json()
  const { data, error } = await supabase
    .from('tenants')
    .select('subdomain')
    .eq('subdomain', subdomain)
    .single()

  return new Response(JSON.stringify({ available: !data }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
})
Integre no Formulário de Cadastro:

No campo de subdomínio, adicione um evento onChange.

Use um hook useDebounce (como o que você já tem) para chamar a Edge Function e verificar a disponibilidade em tempo real.

2.2. Fluxo de Registro
Formulário: Peça o nome do restaurante, e-mail, senha e o subdomínio desejado.

Submissão:
a. Chame supabase.auth.signUp() com o e-mail e a senha.
b. Se o cadastro for bem-sucedido, pegue o user.id retornado.
c. Faça um INSERT na tabela tenants com o subdomain, o nome do restaurante e o owner_id (que é o user.id).
d. Redirecione o usuário para o painel de controle (ex: app.umenu.com.br/setup).

Passo 3: Criação do Painel do Cliente (Dashboard)
Crie uma nova aplicação React ou uma área protegida na sua aplicação existente.

3.1. Autenticação e Contexto
Use o Supabase Auth para a tela de login.

Após o login, crie um contexto (TenantContext) que busca e armazena as informações do tenant associado ao auth.uid().

3.2. Funcionalidades do Painel
CRUD de Cardápio:

Crie formulários para adicionar, editar e remover categorias e produtos. Reutilize a lógica de ProductCard e types/index.ts para estruturar os dados.

Todas as operações de banco de dados (INSERT, UPDATE, DELETE) devem incluir o tenant_id do usuário logado. O RLS garantirá a segurança.

Configurações da Loja:

Crie uma página onde o cliente pode atualizar as informações da tabela settings (telefone, endereço, horários, etc.).

Implemente o upload de imagens (logo e banner) para o Supabase Storage, salvando as URLs na tabela settings.

Passo 4: Adaptação do Cardápio Público
Modifique seu aplicativo de cardápio existente para ser dinâmico.

4.1. Lógica de Subdomínio
Na sua aplicação React (a que mostra o cardápio), capture o subdomínio da URL.

JavaScript

// Exemplo em um componente React
const getSubdomain = () => {
  const host = window.location.hostname;
  const parts = host.split('.');
  if (parts.length > 2 && parts[0] !== 'www') {
    return parts[0];
  }
  return null;
};

const subdomain = getSubdomain();
4.2. Carregamento Dinâmico de Dados
Remova a importação estática de src/data/menu.ts.

Crie uma Supabase Edge Function pública chamada get-menu-by-subdomain.

Esta função receberá um subdomain como parâmetro.

Ela fará uma consulta no banco para buscar todos os dados associados a esse subdomínio: settings, categories, products, etc.

Importante: Esta função usará a SUPABASE_ANON_KEY e não precisará de autenticação de usuário.

Na inicialização do seu app de cardápio, chame essa função com o subdomínio capturado e popule o estado da sua aplicação com os dados retornados.

4.3. Componentes Dinâmicos
Passe os dados carregados (nome do restaurante, logo, produtos, etc.) via props ou contexto para os componentes (Header, Hero, ProductCard, OrderSummary).

O botão "Finalizar Pedido" no OrderSummary.tsx agora usará o business_phone vindo do banco de dados, em vez de uma variável de ambiente estática.

Passo 5: Deploy e Domínios
5.1. Configuração de Domínio Wildcard
No seu provedor de hospedagem (Vercel, Netlify, etc.), configure o domínio umenu.com.br para a sua landing page/painel.

Adicione um domínio wildcard *.umenu.com.br e aponte-o para a sua aplicação de cardápio público. Isso fará com que qualquer subdomínio seja direcionado para a aplicação correta.

5.2. Variáveis de Ambiente
No seu serviço de hospedagem, configure as variáveis de ambiente para produção:

VITE_SUPABASE_URL

VITE_SUPABASE_ANON_KEY