/**
 * Utilitários para gerenciamento de subdomínios no SAAS
 */

/**
 * Extrai o subdomínio da URL atual
 * @returns string | null - O subdomínio ou null se não houver
 */
export const getSubdomain = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const host = window.location.hostname;
  const parts = host.split('.');
  
  // Para desenvolvimento local (localhost)
  if (host === 'localhost' || host.startsWith('127.0.0.1')) {
    // Verificar se há um parâmetro de query para simular subdomínio
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('tenant') || null;
  }
  
  // Para produção (*.umenu.com.br)
  if (parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'app') {
    return parts[0];
  }
  
  return null;
};

/**
 * Verifica se a URL atual é do painel administrativo
 * @returns boolean
 */
export const isAdminDomain = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const host = window.location.hostname;
  
  // Para desenvolvimento local
  if (host === 'localhost' || host.startsWith('127.0.0.1')) {
    return window.location.pathname.startsWith('/admin') || 
           window.location.pathname.startsWith('/dashboard');
  }
  
  // Para produção
  return host.startsWith('app.') || host.includes('dashboard');
};

/**
 * Verifica se a URL atual é da landing page
 * @returns boolean
 */
export const isLandingPage = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const host = window.location.hostname;
  const subdomain = getSubdomain();
  
  // Se não há subdomínio, é a landing page
  return !subdomain && !isAdminDomain();
};

/**
 * Gera URL para um tenant específico
 * @param subdomain - O subdomínio do tenant
 * @returns string - URL completa
 */
export const getTenantUrl = (subdomain: string): string => {
  if (typeof window === 'undefined') return '';
  
  const protocol = window.location.protocol;
  const host = window.location.hostname;
  
  // Para desenvolvimento local
  if (host === 'localhost' || host.startsWith('127.0.0.1')) {
    const port = window.location.port ? `:${window.location.port}` : '';
    return `${protocol}//${host}${port}?tenant=${subdomain}`;
  }
  
  // Para produção
  const domain = host.split('.').slice(-2).join('.'); // umenu.com.br
  return `${protocol}//${subdomain}.${domain}`;
};

/**
 * Gera URL para o painel administrativo
 * @returns string - URL do painel
 */
export const getAdminUrl = (): string => {
  if (typeof window === 'undefined') return '';
  
  const protocol = window.location.protocol;
  const host = window.location.hostname;
  
  // Para desenvolvimento local
  if (host === 'localhost' || host.startsWith('127.0.0.1')) {
    const port = window.location.port ? `:${window.location.port}` : '';
    return `${protocol}//${host}${port}/admin`;
  }
  
  // Para produção
  const domain = host.split('.').slice(-2).join('.'); // umenu.com.br
  return `${protocol}//app.${domain}`;
};

/**
 * Gera URL para a landing page
 * @returns string - URL da landing page
 */
export const getLandingUrl = (): string => {
  if (typeof window === 'undefined') return '';
  
  const protocol = window.location.protocol;
  const host = window.location.hostname;
  
  // Para desenvolvimento local
  if (host === 'localhost' || host.startsWith('127.0.0.1')) {
    const port = window.location.port ? `:${window.location.port}` : '';
    return `${protocol}//${host}${port}`;
  }
  
  // Para produção
  const domain = host.split('.').slice(-2).join('.'); // umenu.com.br
  return `${protocol}//${domain}`;
};

/**
 * Valida se um subdomínio é válido
 * @param subdomain - O subdomínio a ser validado
 * @returns boolean
 */
export const isValidSubdomain = (subdomain: string): boolean => {
  // Regex para validar subdomínio: apenas letras, números e hífens
  const regex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
  
  // Verificar se não é um subdomínio reservado
  const reserved = ['www', 'app', 'admin', 'api', 'mail', 'ftp', 'blog', 'shop', 'store'];
  
  return regex.test(subdomain) && !reserved.includes(subdomain) && subdomain.length >= 3;
};

/**
 * Gera sugestões de subdomínio baseado no nome do negócio
 * @param businessName - Nome do negócio
 * @returns string[] - Array de sugestões
 */
export const generateSubdomainSuggestions = (businessName: string): string[] => {
  const clean = businessName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .replace(/^-|-$/g, ''); // Remove hífens do início e fim
  
  const suggestions = [clean];
  
  // Adicionar variações
  if (clean.length > 10) {
    // Versão abreviada
    const words = clean.split('-');
    if (words.length > 1) {
      suggestions.push(words.map(w => w.charAt(0)).join('') + words[words.length - 1]);
    }
  }
  
  // Adicionar sufixos
  suggestions.push(`${clean}br`);
  suggestions.push(`${clean}online`);
  suggestions.push(`${clean}delivery`);
  
  return suggestions.filter(s => s.length >= 3 && s.length <= 63);
};