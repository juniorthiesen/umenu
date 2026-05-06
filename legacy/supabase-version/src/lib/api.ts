import { supabase, AppSetting, Category, Product, Promotion, ProductWithPromotion, MenuCategory } from './supabase';

// =====================================================
// CONFIGURAÇÕES DA APLICAÇÃO
// =====================================================

export const getAppSettings = async (): Promise<Record<string, string>> => {
  const { data, error } = await supabase
    .from('app_settings')
    .select('key, value');

  if (error) {
    console.error('Error fetching app settings:', error);
    return {};
  }

  return data.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as Record<string, string>);
};

export const updateAppSetting = async (key: string, value: string): Promise<boolean> => {
  const { error } = await supabase.rpc('update_app_setting', {
    setting_key: key,
    setting_value: value
  });

  if (error) {
    console.error('Error updating app setting:', error);
    return false;
  }

  return true;
};

export const getAppSetting = async (key: string): Promise<string | null> => {
  const { data, error } = await supabase.rpc('get_app_setting', {
    setting_key: key
  });

  if (error) {
    console.error('Error fetching app setting:', error);
    return null;
  }

  return data;
};

// =====================================================
// CATEGORIAS
// =====================================================

export const getCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return data || [];
};

export const createCategory = async (category: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category | null> => {
  const { data, error } = await supabase
    .from('categories')
    .insert([category])
    .select()
    .single();

  if (error) {
    console.error('Error creating category:', error);
    return null;
  }

  return data;
};

export const updateCategory = async (id: string, updates: Partial<Category>): Promise<boolean> => {
  const { error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating category:', error);
    return false;
  }

  return true;
};

export const deleteCategory = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('categories')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('Error deleting category:', error);
    return false;
  }

  return true;
};

// =====================================================
// PRODUTOS
// =====================================================

export const getProducts = async (categoryId?: string): Promise<Product[]> => {
  let query = supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return data || [];
};

export const getProductsWithPromotions = async (): Promise<ProductWithPromotion[]> => {
  const { data, error } = await supabase
    .from('products_with_promotions')
    .select('*');

  if (error) {
    console.error('Error fetching products with promotions:', error);
    return [];
  }

  return data || [];
};

export const createProduct = async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product | null> => {
  const { data, error } = await supabase
    .from('products')
    .insert([product])
    .select()
    .single();

  if (error) {
    console.error('Error creating product:', error);
    return null;
  }

  return data;
};

export const updateProduct = async (id: string, updates: Partial<Product>): Promise<boolean> => {
  const { error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating product:', error);
    return false;
  }

  return true;
};

export const deleteProduct = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('Error deleting product:', error);
    return false;
  }

  return true;
};

// =====================================================
// PROMOÇÕES
// =====================================================

export const getPromotions = async (productId?: string): Promise<Promotion[]> => {
  let query = supabase
    .from('promotions')
    .select('*')
    .eq('is_active', true);

  if (productId) {
    query = query.eq('product_id', productId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching promotions:', error);
    return [];
  }

  return data || [];
};

export const createPromotion = async (promotion: Omit<Promotion, 'id' | 'created_at' | 'updated_at'>): Promise<Promotion | null> => {
  const { data, error } = await supabase
    .from('promotions')
    .insert([promotion])
    .select()
    .single();

  if (error) {
    console.error('Error creating promotion:', error);
    return null;
  }

  return data;
};

export const updatePromotion = async (id: string, updates: Partial<Promotion>): Promise<boolean> => {
  const { error } = await supabase
    .from('promotions')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating promotion:', error);
    return false;
  }

  return true;
};

export const deletePromotion = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('promotions')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('Error deleting promotion:', error);
    return false;
  }

  return true;
};

// =====================================================
// MENU COMPLETO
// =====================================================

export const getCompleteMenu = async (): Promise<MenuCategory[]> => {
  const { data, error } = await supabase
    .from('menu_complete')
    .select('*');

  if (error) {
    console.error('Error fetching complete menu:', error);
    return [];
  }

  return data || [];
};

// =====================================================
// UPLOAD DE IMAGENS
// =====================================================

export const uploadImage = async (file: File, bucket: string = 'images'): Promise<string | null> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file);

  if (error) {
    console.error('Error uploading image:', error);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  return publicUrl;
};

// =====================================================
// UTILITÁRIOS
// =====================================================

export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .trim();
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price);
};