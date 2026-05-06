import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { Category, SearchContextType } from '../types';
import { useDebounce } from '../hooks/useDebounce';

const SearchContext = createContext<SearchContextType | undefined>(undefined);

interface SearchProviderProps {
  children: ReactNode;
  menuData: Category[];
}

export const SearchProvider: React.FC<SearchProviderProps> = ({ children, menuData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const isSearching = searchTerm !== debouncedSearchTerm;

  const filteredMenu = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return menuData;
    }

    const term = debouncedSearchTerm.toLowerCase().trim();

    return menuData
      .map(category => ({
        ...category,
        products: category.products.filter(product =>
          product.name.toLowerCase().includes(term) ||
          product.description?.toLowerCase().includes(term) ||
          category.name.toLowerCase().includes(term)
        )
      }))
      .filter(category => category.products.length > 0);
  }, [debouncedSearchTerm]);

  const hasResults = filteredMenu.some(category => category.products.length > 0);

  const value: SearchContextType = {
    searchTerm,
    setSearchTerm,
    filteredMenu,
    hasResults,
    isSearching,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = (): SearchContextType => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};