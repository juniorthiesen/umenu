import React, { useState, useEffect, useMemo } from 'react';
import { Check, X, Loader2, Store, Mail, Lock, Globe, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubdomainCheck } from '../hooks/useTenant';
import { supabase } from '../lib/supabase';
import { isValidSubdomain, generateSubdomainSuggestions } from '../utils/subdomain';
import { useDebounce } from '../hooks/useDebounce';

interface TenantRegistrationProps {
  onSuccess?: (tenantId: string, subdomain: string) => void;
  onCancel?: () => void;
}

export const TenantRegistration: React.FC<TenantRegistrationProps> = ({
  onSuccess,
  onCancel
}) => {
  const { signUp } = useAuth();
  const { checkAvailability } = useSubdomainCheck();
  
  const [formData, setFormData] = useState({
    businessName: '',
    email: '',
    password: '',
    confirmPassword: '',
    subdomain: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [subdomainStatus, setSubdomainStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const debouncedSubdomain = useDebounce(formData.subdomain, 500);

  // Memoize businessName to prevent unnecessary re-renders
  const businessName = useMemo(() => formData.businessName, [formData.businessName]);

  // Verificar disponibilidade do subdomínio
  useEffect(() => {
    const checkSubdomain = async () => {
      if (!debouncedSubdomain || debouncedSubdomain.length < 3) {
        setSubdomainStatus('idle');
        setSuggestions([]);
        return;
      }

      if (!isValidSubdomain(debouncedSubdomain)) {
        setSubdomainStatus('invalid');
        setSuggestions([]);
        return;
      }

      setSubdomainStatus('checking');
      
      const isAvailable = await checkAvailability(debouncedSubdomain);
      
      if (isAvailable) {
        setSubdomainStatus('available');
        setSuggestions([]);
      } else {
        setSubdomainStatus('taken');
        // Gerar sugestões se o subdomínio estiver ocupado
        const newSuggestions = generateSubdomainSuggestions(businessName || debouncedSubdomain);
        setSuggestions(newSuggestions.slice(0, 3));
      }
    };

    checkSubdomain();
  }, [debouncedSubdomain, checkAvailability, businessName]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Auto-gerar subdomínio baseado no nome do negócio
    if (field === 'businessName' && value && !formData.subdomain) {
      const suggestions = generateSubdomainSuggestions(value);
      if (suggestions.length > 0) {
        setFormData(prev => ({ ...prev, subdomain: suggestions[0] }));
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Nome do restaurante é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não coincidem';
    }

    if (!formData.subdomain.trim()) {
      newErrors.subdomain = 'Subdomínio é obrigatório';
    } else if (!isValidSubdomain(formData.subdomain)) {
      newErrors.subdomain = 'Subdomínio inválido. Use apenas letras, números e hífens';
    } else if (subdomainStatus === 'taken') {
      newErrors.subdomain = 'Este subdomínio já está em uso';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (subdomainStatus !== 'available') return;

    setLoading(true);

    try {
      // 1. Criar usuário
      const { data: authData, error: authError } = await signUp(
        formData.email,
        formData.password,
        { business_name: formData.businessName }
      );

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Erro ao criar usuário');
      }

      // 2. Criar tenant
      const { data: tenantData, error: tenantError } = await supabase
        .from('umenu_tenants')
        .insert({
          name: formData.businessName,
          subdomain: formData.subdomain,
          owner_id: authData.user.id
        })
        .select()
        .single();

      if (tenantError) {
        throw new Error(`Erro ao criar restaurante: ${tenantError.message}`);
      }

      // 3. Criar configurações padrão
      const { error: settingsError } = await supabase
        .from('umenu_tenant_settings')
        .insert({
          tenant_id: tenantData.id
        });

      if (settingsError) {
        console.warn('Erro ao criar configurações padrão:', settingsError);
      }

      // Sucesso!
      onSuccess?.(tenantData.id, formData.subdomain);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const getSubdomainIcon = () => {
    switch (subdomainStatus) {
      case 'checking':
        return <Loader2 className="animate-spin text-slate-400" size={16} />;
      case 'available':
        return <Check className="text-green-500" size={16} />;
      case 'taken':
      case 'invalid':
        return <X className="text-red-500" size={16} />;
      default:
        return null;
    }
  };

  const getSubdomainMessage = () => {
    switch (subdomainStatus) {
      case 'checking':
        return 'Verificando disponibilidade...';
      case 'available':
        return 'Subdomínio disponível!';
      case 'taken':
        return 'Este subdomínio já está em uso';
      case 'invalid':
        return 'Subdomínio inválido';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <Store className="h-8 w-8 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Crie seu Cardápio Digital
          </h1>
          <p className="text-slate-600 mt-2">
            Comece a receber pedidos online em minutos
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Nome do Restaurante */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nome do Restaurante
            </label>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) => handleInputChange('businessName', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                errors.businessName ? 'border-red-300' : 'border-slate-300'
              }`}
              placeholder="Ex: Pizzaria do João"
            />
            {errors.businessName && (
              <p className="text-red-500 text-sm mt-1">{errors.businessName}</p>
            )}
          </div>

          {/* Subdomínio */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Seu Endereço Online
            </label>
            <div className="relative">
              <div className="flex">
                <input
                  type="text"
                  value={formData.subdomain}
                  onChange={(e) => handleInputChange('subdomain', e.target.value.toLowerCase())}
                  className={`flex-1 px-4 py-3 border rounded-l-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                    errors.subdomain ? 'border-red-300' : 'border-slate-300'
                  }`}
                  placeholder="meurestaurante"
                />
                <div className="px-4 py-3 bg-slate-100 border border-l-0 border-slate-300 rounded-r-lg text-slate-600 text-sm flex items-center">
                  .umenu.com.br
                </div>
              </div>
              <div className="absolute right-2 top-3 flex items-center gap-2">
                {getSubdomainIcon()}
              </div>
            </div>
            
            {subdomainStatus !== 'idle' && (
              <p className={`text-sm mt-1 ${
                subdomainStatus === 'available' ? 'text-green-600' : 
                subdomainStatus === 'checking' ? 'text-slate-500' : 'text-red-500'
              }`}>
                {getSubdomainMessage()}
              </p>
            )}
            
            {errors.subdomain && (
              <p className="text-red-500 text-sm mt-1">{errors.subdomain}</p>
            )}

            {/* Sugestões */}
            {suggestions.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-slate-600 mb-2">Sugestões disponíveis:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleInputChange('subdomain', suggestion)}
                      className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm hover:bg-orange-200 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* E-mail */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                  errors.email ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder="seu@email.com"
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Senha */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                  errors.password ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* Confirmar Senha */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Confirmar Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                  errors.confirmPassword ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder="Digite a senha novamente"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-3 px-4 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={loading || subdomainStatus !== 'available'}
              className="flex-1 bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Criando...
                </>
              ) : (
                <>
                  <Globe size={18} />
                  Criar Cardápio
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            Ao criar sua conta, você concorda com nossos{' '}
            <a href="#" className="text-orange-600 hover:underline">
              Termos de Uso
            </a>{' '}
            e{' '}
            <a href="#" className="text-orange-600 hover:underline">
              Política de Privacidade
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};