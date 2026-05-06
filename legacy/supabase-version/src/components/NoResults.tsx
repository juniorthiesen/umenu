import React from 'react';
import { Search } from 'lucide-react';
import { useSearch } from '../contexts/SearchContext';

export const NoResults: React.FC = React.memo(() => {
  const { searchTerm, setSearchTerm } = useSearch();
  
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <Search size={64} className="text-slate-300 mb-4" />
      <h3 className="text-xl font-semibold text-slate-700 mb-2">
        Nenhum produto encontrado
      </h3>
      <p className="text-slate-500 mb-6 max-w-md">
        Não encontramos produtos para "{searchTerm}". Tente buscar por outro termo ou navegue pelas categorias.
      </p>
      <button
        onClick={() => setSearchTerm('')}
        className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium"
      >
        Ver todos os produtos
      </button>
    </div>
  );
});