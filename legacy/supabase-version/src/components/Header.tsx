import React, { useEffect, useState } from 'react';
import { ShoppingCart, Search } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useSearch } from '../contexts/SearchContext';
import { useScrollPosition } from '../hooks/useScrollPosition';

export const Header: React.FC = React.memo(() => {
  const { totalItems, openCart } = useCart();
  const { searchTerm, setSearchTerm } = useSearch();
  const { scrollY, isScrollingUp } = useScrollPosition();
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  // Controla a visibilidade do header no mobile
  useEffect(() => {
    const headerHeight = 64; // altura do header (h-16 = 64px)
    
    if (scrollY > headerHeight) {
      setIsHeaderVisible(isScrollingUp || scrollY < headerHeight * 2);
    } else {
      setIsHeaderVisible(true);
    }
  }, [scrollY, isScrollingUp]);

  return (
    <header className={`bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-40 transition-transform duration-300 ${
      isHeaderVisible ? 'translate-y-0' : 'md:translate-y-0 -translate-y-full'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <img 
              src="https://adsmentor.com.br/wp-content/uploads/2025/07/359813634_767659685362995_5873767330149179225_n.png" 
              alt="Logo Salgados & Cia" 
              className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-md" 
            />
            <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
              Salgados & Cia
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-sm"
              />
            </div>

            <button
              onClick={openCart}
              className="relative p-2 rounded-full hover:bg-orange-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 transition-colors"
              aria-label={`Ver carrinho com ${totalItems} itens`}
            >
              <ShoppingCart className="text-orange-600" size={28} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Barra de busca mobile */}
        <div className="sm:hidden pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-sm"
            />
          </div>
        </div>
      </div>
    </header>
  );
});