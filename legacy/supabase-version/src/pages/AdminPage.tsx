import React, { useState, useEffect } from 'react';
import {
  Settings,
  Package,
  Tag,
  BarChart3,
  Users,
  ShoppingBag,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Eye,
  EyeOff,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { Product, Category } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getTenantUrl } from '../utils/subdomain';

// Tipos para Admin
interface AdminProduct extends Product {
  categoryName?: string;
  category_id?: string; // ID da categoria no banco
}

interface AdminStats {
  totalProducts: number;
  activePromotions: number;
  totalCategories: number;
  totalOrders: number;
}

// Componente para botão de visualizar cardápio
const ViewMenuButton: React.FC = () => {
  const { user } = useAuth();
  const [tenantSubdomain, setTenantSubdomain] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTenantSubdomain = async () => {
      if (!user) return;

      try {
        const { data: tenantData, error } = await supabase
          .from('umenu_tenants')
          .select('subdomain')
          .eq('owner_id', user.id)
          .single();

        if (error) {
          console.error('Erro ao buscar subdomínio (ViewMenuButton):', error);
          return;
        }

        console.log('Subdomínio carregado (ViewMenuButton):', tenantData.subdomain);
        setTenantSubdomain(tenantData.subdomain);
      } catch (error) {
        console.error('Erro ao carregar subdomínio (ViewMenuButton):', error);
      } finally {
        setLoading(false);
      }
    };

    loadTenantSubdomain();
  }, [user]);

  const handleViewMenu = () => {
    if (!tenantSubdomain) {
      console.error('Subdomínio não encontrado');
      return;
    }

    // Gerar URL baseada no ambiente
    const menuUrl = getTenantUrl(tenantSubdomain);

    console.log('=== DEBUG CARDÁPIO ===');
    console.log('Subdomínio:', tenantSubdomain);
    console.log('URL gerada:', menuUrl);
    console.log('Ambiente atual:', window.location.hostname);
    console.log('======================');

    // Abrir em nova aba - vai diretamente para a URL do tenant
    window.open(menuUrl, '_blank');
  };

  if (loading || !tenantSubdomain) {
    return null;
  }

  return (
    <button
      onClick={handleViewMenu}
      className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
      title={`Visualizar cardápio: ${tenantSubdomain ? getTenantUrl(tenantSubdomain) : 'Carregando...'}`}
    >
      <ExternalLink size={16} />
      Ver Cardápio
    </button>
  );
};

// Componente para exibir URL do cardápio nas configurações
const MenuUrlDisplay: React.FC = () => {
  const { user } = useAuth();
  const [tenantSubdomain, setTenantSubdomain] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTenantSubdomain = async () => {
      if (!user) return;

      try {
        const { data: tenantData, error } = await supabase
          .from('umenu_tenants')
          .select('subdomain')
          .eq('owner_id', user.id)
          .single();

        if (error) {
          console.error('Erro ao buscar subdomínio:', error);
          return;
        }

        setTenantSubdomain(tenantData.subdomain);
      } catch (error) {
        console.error('Erro ao carregar subdomínio:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTenantSubdomain();
  }, [user]);

  const handleViewMenu = () => {
    if (!tenantSubdomain) return;

    const menuUrl = getTenantUrl(tenantSubdomain);

    console.log('Abrindo cardápio (configurações):', menuUrl);
    console.log('Subdomínio:', tenantSubdomain);

    window.open(menuUrl, '_blank');
  };

  const handleCopyUrl = () => {
    if (!tenantSubdomain) return;

    const menuUrl = getTenantUrl(tenantSubdomain);
    navigator.clipboard.writeText(menuUrl);

    // Feedback visual (você pode melhorar isso com um toast)
    alert('URL copiada para a área de transferência!');
  };

  if (loading) {
    return (
      <div className="text-sm text-gray-600">
        <p><strong>URL do Cardápio:</strong></p>
        <div className="flex items-center gap-2 mt-1">
          <Loader2 size={16} className="animate-spin" />
          <span>Carregando...</span>
        </div>
      </div>
    );
  }

  if (!tenantSubdomain) {
    return (
      <div className="text-sm text-gray-600">
        <p><strong>URL do Cardápio:</strong></p>
        <p className="text-red-600 bg-red-50 px-2 py-1 rounded mt-1">
          Erro ao carregar URL do cardápio
        </p>
      </div>
    );
  }

  const menuUrl = getTenantUrl(tenantSubdomain);

  return (
    <div className="text-sm text-gray-600 flex-1">
      <p><strong>URL do Cardápio:</strong></p>
      <div className="flex items-center gap-2 mt-1">
        <p className="text-orange-600 font-mono bg-orange-50 px-2 py-1 rounded flex-1">
          {menuUrl}
        </p>
        <button
          onClick={handleCopyUrl}
          className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-xs"
          title="Copiar URL"
        >
          Copiar
        </button>
        <button
          onClick={handleViewMenu}
          className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors text-xs flex items-center gap-1"
          title="Abrir cardápio"
        >
          <ExternalLink size={12} />
          Abrir
        </button>
      </div>
    </div>
  );
};

// Componente principal da página admin
export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'promotions' | 'settings'>('dashboard');
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalProducts: 0,
    activePromotions: 0,
    totalCategories: 0,
    totalOrders: 0
  });

  const { user } = useAuth();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Função para recarregar dados
  const reloadData = () => {
    if (tenantId) {
      loadData(tenantId);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    if (user) {
      loadTenantAndData();
    }
  }, [user]);

  const loadTenantAndData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Buscar tenant do usuário
      const { data: tenantData, error: tenantError } = await supabase
        .from('umenu_tenants')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (tenantError) {
        console.error('Erro ao buscar tenant:', tenantError);
        return;
      }

      setTenantId(tenantData.id);
      await loadData(tenantData.id);

    } catch (error) {
      console.error('Erro ao carregar dados do tenant:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async (currentTenantId: string) => {
    try {
      // Carregar categorias do tenant
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('umenu_categories')
        .select('*')
        .eq('tenant_id', currentTenantId)
        .order('name');

      if (categoriesError) {
        console.error('Erro ao carregar categorias:', categoriesError);
        setCategories([]);
      } else {
        setCategories(categoriesData || []);
      }

      // Carregar produtos do tenant
      const { data: productsData, error: productsError } = await supabase
        .from('umenu_products')
        .select(`
          *,
          category:umenu_categories(name)
        `)
        .eq('tenant_id', currentTenantId)
        .order('name');

      if (productsError) {
        console.error('Erro ao carregar produtos:', productsError);
        setProducts([]);
      } else {
        const formattedProducts: AdminProduct[] = (productsData || []).map(product => ({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          pricingType: product.pricing_type,
          minQuantity: product.min_quantity,
          step: product.step_quantity,
          image: product.image_url,
          categoryName: product.category?.name,
          category_id: product.category_id,
          promotion: product.promotion_id ? {
            isActive: true, // Seria verificado na tabela de promoções
            promotionalPrice: product.promotional_price || product.price,
            discountPercentage: 0,
            validUntil: '',
            label: 'PROMOÇÃO'
          } : undefined
        }));

        setProducts(formattedProducts);
      }

      // Calcular estatísticas
      const activePromotions = (productsData || []).filter(p => p.promotion_id).length;
      setStats({
        totalProducts: (productsData || []).length,
        activePromotions,
        totalCategories: (categoriesData || []).length,
        totalOrders: 0 // Seria carregado do banco
      });

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img
                src="https://adsmentor.com.br/wp-content/uploads/2025/07/359813634_767659685362995_5873767330149179225_n.png"
                alt="Logo"
                className="h-8 w-8 rounded-full"
              />
              <h1 className="text-xl font-bold text-gray-900">
                Salgados & Cia - Admin
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <ViewMenuButton />
              <span className="text-sm text-gray-500">
                Última atualização: {new Date().toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow-sm p-4">
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${activeTab === 'dashboard'
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    <BarChart3 size={20} />
                    Dashboard
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('products')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${activeTab === 'products'
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    <Package size={20} />
                    Produtos
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('promotions')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${activeTab === 'promotions'
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    <Tag size={20} />
                    Promoções
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${activeTab === 'settings'
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    <Settings size={20} />
                    Configurações
                  </button>
                </li>
              </ul>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin h-8 w-8 text-orange-600" />
                <span className="ml-2 text-gray-600">Carregando dados...</span>
              </div>
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  <DashboardTab stats={stats} onTabChange={setActiveTab} />
                )}
                {activeTab === 'products' && (
                  <ProductsTab products={products} categories={categories} onUpdate={reloadData} />
                )}
                {activeTab === 'promotions' && (
                  <PromotionsTab products={products} onUpdate={reloadData} />
                )}
                {activeTab === 'settings' && (
                  <SettingsTab />
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

// Componente Dashboard
const DashboardTab: React.FC<{
  stats: AdminStats;
  onTabChange: (tab: 'dashboard' | 'products' | 'promotions' | 'settings') => void;
}> = ({ stats, onTabChange }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Produtos</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalProducts}</p>
            </div>
            <Package className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Promoções Ativas</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activePromotions}</p>
            </div>
            <Tag className="h-12 w-12 text-red-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Categorias</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalCategories}</p>
            </div>
            <Users className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pedidos Hoje</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
            </div>
            <ShoppingBag className="h-12 w-12 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => onTabChange('products')}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-5 w-5 text-green-600" />
            <span className="font-medium">Adicionar Produto</span>
          </button>
          <button
            onClick={() => onTabChange('promotions')}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Tag className="h-5 w-5 text-red-600" />
            <span className="font-medium">Nova Promoção</span>
          </button>
          <button
            onClick={() => onTabChange('settings')}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings className="h-5 w-5 text-blue-600" />
            <span className="font-medium">Configurações</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal de Adicionar Produto
const AddProductModal: React.FC<{
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ categories, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    price: '',
    pricingType: 'unidade' as const,
    minQuantity: '1',
    imageUrl: '',
    description: ''
  });
  const [localCategories, setLocalCategories] = useState(categories);
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!formData.categoryId) newErrors.categoryId = 'Categoria é obrigatória';
    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Preço deve ser um número válido maior que zero';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      setCreatingCategory(true);
      
      if (!user) throw new Error('Usuário não autenticado');
      
      // Buscar tenant do usuário
      const { data: tenantData, error: tenantError } = await supabase
        .from('umenu_tenants')
        .select('id')
        .eq('owner_id', user.id)
        .single();
      
      if (tenantError || !tenantData) {
        throw new Error('Erro ao encontrar restaurante do usuário');
      }
      
      // Gerar slug único para categoria
      const slug = await generateUniqueCategorySlug(newCategoryName, tenantData.id);
      
      // Buscar próximo display_order
      const { data: existingCategories } = await supabase
        .from('umenu_categories')
        .select('display_order')
        .eq('tenant_id', tenantData.id)
        .order('display_order', { ascending: false })
        .limit(1);
      
      const nextOrder = existingCategories && existingCategories.length > 0 
        ? (existingCategories[0].display_order || 0) + 1 
        : 1;
      
      // Criar categoria
      const { data: newCategory, error: categoryError } = await supabase
        .from('umenu_categories')
        .insert({
          name: newCategoryName.trim(),
          slug,
          tenant_id: tenantData.id,
          display_order: nextOrder
        })
        .select()
        .single();
      
      if (categoryError) {
        throw new Error(`Erro ao criar categoria: ${categoryError.message}`);
      }
      
      // Atualizar lista local
      const categoryForList = {
        id: newCategory.id,
        name: newCategory.name,
        products: []
      };
      
      setLocalCategories(prev => [...prev, categoryForList]);
      setFormData(prev => ({ ...prev, categoryId: newCategory.id }));
      setNewCategoryName('');
      setShowNewCategoryForm(false);
      
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      alert(error instanceof Error ? error.message : 'Erro desconhecido ao criar categoria');
    } finally {
      setCreatingCategory(false);
    }
  };

  const generateUniqueCategorySlug = async (baseName: string, tenantId: string): Promise<string> => {
    // Criar slug base
    const baseSlug = baseName.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    // Verificar se o slug já existe
    const { data: existingCategory, error } = await supabase
      .from('umenu_categories')
      .select('slug')
      .eq('slug', baseSlug)
      .eq('tenant_id', tenantId)
      .maybeSingle();
    
    if (error) {
      console.error('Erro ao verificar slug da categoria:', error);
      return `${baseSlug}-${Date.now()}`;
    }
    
    // Se não existe, usar o slug base
    if (!existingCategory) {
      return baseSlug;
    }
    
    // Se existe, tentar com números incrementais
    let counter = 1;
    let uniqueSlug = `${baseSlug}-${counter}`;
    
    while (true) {
      const { data: conflictingCategory, error: conflictError } = await supabase
        .from('umenu_categories')
        .select('slug')
        .eq('slug', uniqueSlug)
        .eq('tenant_id', tenantId)
        .maybeSingle();
      
      if (conflictError) {
        console.error('Erro ao verificar conflito de slug da categoria:', conflictError);
        return `${baseSlug}-${Date.now()}`;
      }
      
      if (!conflictingCategory) {
        return uniqueSlug;
      }
      
      counter++;
      uniqueSlug = `${baseSlug}-${counter}`;
      
      // Evitar loop infinito
      if (counter > 100) {
        return `${baseSlug}-${Date.now()}`;
      }
    }
  };

  const generateUniqueSlug = async (baseName: string, tenantId: string): Promise<string> => {
    // Criar slug base
    const baseSlug = baseName.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    // Verificar se o slug já existe
    const { data: existingProduct, error } = await supabase
      .from('umenu_products')
      .select('slug')
      .eq('slug', baseSlug)
      .eq('tenant_id', tenantId)
      .maybeSingle();
    
    if (error) {
      console.error('Erro ao verificar slug do produto:', error);
      return `${baseSlug}-${Date.now()}`;
    }
    
    // Se não existe, usar o slug base
    if (!existingProduct) {
      return baseSlug;
    }
    
    // Se existe, tentar com números incrementais
    let counter = 1;
    let uniqueSlug = `${baseSlug}-${counter}`;
    
    while (true) {
      const { data: conflictingProduct, error: conflictError } = await supabase
        .from('umenu_products')
        .select('slug')
        .eq('slug', uniqueSlug)
        .eq('tenant_id', tenantId)
        .maybeSingle();
      
      if (conflictError) {
        console.error('Erro ao verificar conflito de slug do produto:', conflictError);
        return `${baseSlug}-${Date.now()}`;
      }
      
      if (!conflictingProduct) {
        return uniqueSlug;
      }
      
      counter++;
      uniqueSlug = `${baseSlug}-${counter}`;
      
      // Evitar loop infinito
      if (counter > 100) {
        return `${baseSlug}-${Date.now()}`;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      if (!user) throw new Error('Usuário não autenticado');
      
      // Buscar tenant do usuário
      const { data: tenantData, error: tenantError } = await supabase
        .from('umenu_tenants')
        .select('id')
        .eq('owner_id', user.id)
        .single();
      
      if (tenantError || !tenantData) {
        throw new Error('Erro ao encontrar restaurante do usuário');
      }
      
      // Gerar slug único
      const slug = await generateUniqueSlug(formData.name, tenantData.id);
      
      // Criar produto
      const { error: productError } = await supabase
        .from('umenu_products')
        .insert({
          name: formData.name.trim(),
          slug,
          price: parseFloat(formData.price),
          pricing_type: formData.pricingType,
          min_quantity: parseInt(formData.minQuantity) || 1,
          image_url: formData.imageUrl.trim() || null,
          description: formData.description.trim() || null,
          category_id: formData.categoryId,
          tenant_id: tenantData.id
        });
      
      if (productError) {
        throw new Error(`Erro ao criar produto: ${productError.message}`);
      }
      
      onSuccess();
      
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      alert(error instanceof Error ? error.message : 'Erro desconhecido ao criar produto');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Adicionar Novo Produto</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome do Produto */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Produto *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: Pizza Margherita"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>
            
            {/* Categoria */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Categoria *
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewCategoryForm(!showNewCategoryForm)}
                  className="text-orange-600 hover:text-orange-700 text-sm flex items-center gap-1"
                >
                  <Plus size={14} />
                  Nova Categoria
                </button>
              </div>
              
              {showNewCategoryForm ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateCategory()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Nome da categoria"
                  />
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={creatingCategory || !newCategoryName.trim()}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                  >
                    {creatingCategory ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewCategoryForm(false);
                      setNewCategoryName('');
                    }}
                    className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <select
                  value={formData.categoryId}
                  onChange={(e) => handleInputChange('categoryId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                    errors.categoryId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecione uma categoria</option>
                  {localCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.categoryId && <p className="text-red-500 text-sm mt-1">{errors.categoryId}</p>}
            </div>
            
            {/* Preço */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preço *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0,00"
              />
              {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
            </div>
            
            {/* Tipo de Preço */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Preço
              </label>
              <select
                value={formData.pricingType}
                onChange={(e) => handleInputChange('pricingType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="unidade">Por unidade</option>
                <option value="cento">Por cento</option>
                <option value="kg">Por kg</option>
              </select>
            </div>
            
            {/* Quantidade Mínima */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantidade Mínima
              </label>
              <input
                type="number"
                min="1"
                value={formData.minQuantity}
                onChange={(e) => handleInputChange('minQuantity', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            
            {/* URL da Imagem */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL da Imagem
              </label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>
            
            {/* Descrição */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Descrição do produto..."
              />
            </div>
          </div>
          
          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 disabled:bg-gray-400"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Criar Produto
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Componente Produtos
const ProductsTab: React.FC<{
  products: AdminProduct[];
  categories: Category[];
  onUpdate: () => void;
}> = ({ products, categories, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      const { error } = await supabase
        .from('umenu_products')
        .delete()
        .eq('id', productId);

      if (error) {
        throw new Error(`Erro ao excluir produto: ${error.message}`);
      }

      onUpdate(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      alert(error instanceof Error ? error.message : 'Erro desconhecido ao excluir produto');
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.categoryName === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Produtos</h2>
        <button 
          onClick={() => setShowAddProductModal(true)}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Novo Produto
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="all">Todas as Categorias</option>
            {categories.map(category => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Produtos */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preço
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Promoção
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Package className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {products.length === 0 ? 'Nenhum produto cadastrado' : 'Nenhum produto encontrado'}
                      </h3>
                      <p className="text-gray-500 mb-4">
                        {products.length === 0
                          ? 'Comece adicionando seu primeiro produto ao cardápio'
                          : 'Tente ajustar os filtros de busca'
                        }
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.description?.substring(0, 50)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.categoryName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      R$ {product.price.toFixed(2)}
                      <div className="text-xs text-gray-500">
                        / {product.pricingType}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.promotion?.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {product.promotion.label}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Sem promoção</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Ativo
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar produto"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(String(product.id))}
                          className="text-red-600 hover:text-red-900"
                          title="Excluir produto"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Adicionar Produto */}
      {showAddProductModal && (
        <AddProductModal
          categories={categories}
          onClose={() => setShowAddProductModal(false)}
          onSuccess={() => {
            setShowAddProductModal(false);
            onUpdate();
          }}
        />
      )}
    </div>
  );
};

// Componente Promoções
const PromotionsTab: React.FC<{
  products: AdminProduct[];
  onUpdate: () => void;
}> = ({ products }) => {
  const promotionalProducts = products.filter(p => p.promotion?.isActive);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Promoções</h2>
        <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
          <Plus size={20} />
          Nova Promoção
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promotionalProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="relative">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-2 left-2">
                <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                  {product.promotion?.label}
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900">{product.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{product.categoryName}</p>

              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-sm text-gray-500 line-through">
                    R$ {product.price.toFixed(2)}
                  </span>
                  <span className="text-lg font-bold text-red-600 ml-2">
                    R$ {product.promotion?.promotionalPrice.toFixed(2)}
                  </span>
                </div>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                  -{product.promotion?.discountPercentage}%
                </span>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors">
                  Editar
                </button>
                <button className="flex-1 bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors">
                  Desativar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Componente Configurações
const SettingsTab: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    isOpen: true,
    deliveryFee: '5.00',
    minimumOrder: '30.00'
  });
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Buscar tenant do usuário
      const { data: tenantData, error: tenantError } = await supabase
        .from('umenu_tenants')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (tenantError || !tenantData) {
        throw new Error('Erro ao encontrar restaurante do usuário');
      }

      // Salvar configurações
      const { error: settingsError } = await supabase
        .from('umenu_tenant_settings')
        .upsert({
          tenant_id: tenantData.id,
          is_open: settings.isOpen,
          delivery_fee: Number(settings.deliveryFee),
          minimum_order: Number(settings.minimumOrder)
        }, {
          onConflict: 'tenant_id'
        });

      if (settingsError) {
        throw new Error(`Erro ao salvar configurações: ${settingsError.message}`);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert(error instanceof Error ? error.message : 'Erro desconhecido ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Configurações</h2>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações do Negócio</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status do Negócio
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSettings({ ...settings, isOpen: !settings.isOpen })}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${settings.isOpen
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
                  }`}
              >
                {settings.isOpen ? <Eye size={16} /> : <EyeOff size={16} />}
                {settings.isOpen ? 'Aberto' : 'Fechado'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Taxa de Entrega (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={settings.deliveryFee}
              onChange={(e) => setSettings({ ...settings, deliveryFee: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pedido Mínimo (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={settings.minimumOrder}
              onChange={(e) => setSettings({ ...settings, minimumOrder: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-between items-center">
          <MenuUrlDisplay />
          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="text-green-600 text-sm flex items-center gap-1">
                ✅ Salvo com sucesso!
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 disabled:bg-gray-400"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Salvar Configurações
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;