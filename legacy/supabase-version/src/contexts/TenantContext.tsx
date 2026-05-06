import React, { createContext, useContext } from 'react';
import { useTenant } from '../hooks/useTenant';
import { Category, TenantSettings } from '../types';

// Definindo a estrutura do contexto
interface TenantContextType {
  tenantData: {
    menu: Category[];
    settings: TenantSettings;
  } | null;
  subdomain: string | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
}

// Criando o contexto com um valor padrão
const TenantContext = createContext<TenantContextType | undefined>(undefined);

// Provedor do contexto que encapsulará a aplicação
export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const tenantInfo = useTenant();

  return (
    <TenantContext.Provider value={tenantInfo}>
      {children}
    </TenantContext.Provider>
  );
};

// Hook customizado para consumir o contexto facilmente
export const useTenantContext = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenantContext deve ser usado dentro de um TenantProvider');
  }
  return context;
};
