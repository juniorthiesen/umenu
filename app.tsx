import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Info } from 'lucide-react';

// Imports dos módulos refatorados
import { Category, Product } from './src/types';
import { menuData } from './src/data/menu';
import { useBusinessStatus } from './src/hooks/useBusinessStatus';
import { usePromotions } from './src/hooks/usePromotions';
import { useMetaPixel } from './src/hooks/useMetaPixel';
import { SearchProvider, useSearch } from './src/contexts/SearchContext';
import { CartProvider } from './src/contexts/CartContext';
import { Header } from './src/components/Header';
import { ProductCard } from './src/components/ProductCard';
import { OrderSummary } from './src/components/OrderSummary';
import { NoResults } from './src/components/NoResults';
import { PromotionsSection } from './src/components/PromotionsSection';

// Hero Component
const Hero: React.FC = React.memo(() => {
  const isOpen = useBusinessStatus();
  
  return (
    <div className="relative bg-slate-800 text-white">
      <img
        src="https://placehold.co/1200x400/a57d65/FFFFFF?text=Banner+de+Salgados"
        alt="Banner com variedade de salgados"
        className="w-full h-48 md:h-64 object-cover opacity-30"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
      <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-4">
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-shadow">
          O sabor que une momentos
        </h2>
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-slate-300" />
            <span className="font-medium">Palmas, PR</span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
            isOpen ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
          }`}>
            <span className={`h-2 w-2 rounded-full ${isOpen ? 'bg-green-400' : 'bg-red-400'}`}></span>
            {isOpen ? 'Aberto Agora' : 'Fechado Agora'}
          </div>
          <button className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold bg-slate-100/10 text-slate-200 hover:bg-slate-100/20 transition-colors">
            <Info size={16} />
            Mais informações
          </button>
        </div>
      </div>
    </div>
  );
});

// CategoryNav Component
const CategoryNav: React.FC<{ categories: Category[]; activeCategory: string | null }> = React.memo(({ 
  categories, 
  activeCategory 
}) => {
  const { searchTerm } = useSearch();
  const [navPosition, setNavPosition] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => {
      const headerHeight = 64; // altura do header (h-16 = 64px)
      const scrollY = window.scrollY;
      
      // No mobile, quando o header some, o nav deve subir para o topo
      // No desktop, mantém sempre a posição original
      if (window.innerWidth < 768) { // mobile breakpoint
        if (scrollY > headerHeight * 2) {
          setNavPosition(0); // vai para o topo quando header some
        } else {
          setNavPosition(headerHeight); // mantém posição original
        }
      } else {
        setNavPosition(headerHeight); // desktop sempre mantém posição
      }
    };

    handleScroll(); // executa uma vez no mount
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);
  
  if (searchTerm.trim() && categories.length === 0) {
    return null;
  }
  
  return (
    <nav 
      className="sticky bg-white/95 backdrop-blur-sm shadow-sm z-30 border-b border-slate-200 transition-all duration-300"
      style={{ top: `${navPosition}px` }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center overflow-x-auto whitespace-nowrap py-3 space-x-5 sm:space-x-8 text-sm font-medium text-slate-600">
          {categories.map(category => (
            <a
              key={category.id}
              href={`#${category.id}`}
              className={`pb-2 transition-all duration-300 border-b-2 ${
                activeCategory === category.id 
                  ? 'text-orange-600 border-orange-500' 
                  : 'border-transparent hover:text-orange-500'
              }`}
            >
              {category.name} {searchTerm.trim() && `(${category.products.length})`}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
});

// CategorySection Component
const CategorySection: React.FC<{ 
  category: Category; 
  refProp: React.RefObject<HTMLElement> 
}> = React.memo(({ category, refProp }) => {
  return (
    <section id={category.id} ref={refProp} className="py-8 md:py-10 scroll-mt-16 md:scroll-mt-20">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2 tracking-tight">
          {category.name}
        </h2>
        <div className="h-1 w-20 sm:w-24 bg-orange-500 mb-8 sm:mb-10"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {category.products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
});

// Main App Component
const AppContent: React.FC = () => {
  const { filteredMenu, hasResults, searchTerm } = useSearch();
  const { promotionalProducts, hasPromotions } = usePromotions();
  const { trackPageView } = useMetaPixel();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  const categoryRefs = useRef<Record<string, React.RefObject<HTMLElement>>>({});
  const displayMenu = searchTerm.trim() ? filteredMenu : menuData;
  
  // Create refs for categories
  displayMenu.forEach(cat => {
    if (!categoryRefs.current[cat.id]) {
      categoryRefs.current[cat.id] = React.createRef<HTMLElement>();
    }
  });

  // Intersection Observer for active category
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.id);
          }
        });
      },
      { rootMargin: '-40% 0px -60% 0px', threshold: 0 }
    );

    const refs = categoryRefs.current;
    Object.values(refs).forEach(ref => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });

    return () => {
      Object.values(refs).forEach(ref => {
        if (ref.current) {
          observer.unobserve(ref.current);
        }
      });
    };
  }, [displayMenu]);

  // Meta Pixel - Track PageView
  useEffect(() => {
    trackPageView();
  }, [trackPageView]);

  // Função para navegar para um produto específico
  const handleProductClick = (product: Product) => {
    // Encontrar a categoria do produto
    const category = menuData.find(cat => 
      cat.products.some(p => p.id === product.id)
    );
    
    if (category) {
      // Navegar para a categoria
      const element = document.getElementById(category.id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-700">
      <Header />
      <Hero />
      
      {/* Seção de Promoções - só aparece quando não há busca ativa e há promoções */}
      {!searchTerm.trim() && hasPromotions && (
        <PromotionsSection 
          products={promotionalProducts} 
          onProductClick={handleProductClick}
        />
      )}
      
      <CategoryNav categories={displayMenu} activeCategory={activeCategory} />
      
      <main>
        {searchTerm.trim() && !hasResults ? (
          <NoResults />
        ) : (
          displayMenu.map(category => (
            <CategorySection 
              key={category.id} 
              category={category} 
              refProp={categoryRefs.current[category.id]} 
            />
          ))
        )}
      </main>
      
      <OrderSummary />
      
      <footer className="bg-slate-800 text-slate-300 py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Salgados & Cia. Todos os direitos reservados.
          </p>
          <p className="text-xs text-slate-400 mt-2">Desenvolvido com ❤️</p>
        </div>
      </footer>
    </div>
  );
};

// Root App Component with Providers
export default function App() {
  return (
    <SearchProvider>
      <CartProvider>
        <style>{`
          html {
            scroll-behavior: smooth;
          }
          ::-webkit-scrollbar {
            width: 8px;
          }
          ::-webkit-scrollbar-track {
            background: #f1f5f9;
          }
          ::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
          .text-shadow {
            text-shadow: 2px 2px 4px rgba(0,0,0,0.4);
          }
          .line-clamp-1 {
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          /* Esconder scrollbar no carrossel mobile */
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <AppContent />
      </CartProvider>
    </SearchProvider>
  );
}