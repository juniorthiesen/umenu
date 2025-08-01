import React, { useState, useEffect, useRef } from 'react';
import { SearchProvider } from './contexts/SearchContext';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';
import { useTenantContext } from './contexts/TenantContext'; // Importa o novo contexto
import { Header } from './components/Header';
import { ProductCard } from './components/ProductCard';
import { OrderSummary } from './components/OrderSummary';
import { NoResults } from './components/NoResults';
import { TenantRegistration } from './components/TenantRegistration';
import AdminRoute from './components/AdminRoute';
import { Category, TenantSettings } from './types';
import { useBusinessStatus } from './hooks/useBusinessStatus';
import { useSearch } from './contexts/SearchContext';
import { MapPin, Info, Store, Users, ArrowRight, WifiOff, AlertTriangle } from 'lucide-react';

// Tipos de rota
type Route = 'home' | 'admin' | 'cadastro' | 'login' | 'landing';

// Hook para gerenciar rotas
const useRouter = () => {
  const [currentRoute, setCurrentRoute] = useState<Route>('landing');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      switch (hash) {
        case 'admin': setCurrentRoute('admin'); break;
        case 'cadastro': setCurrentRoute('cadastro'); break;
        case 'login': setCurrentRoute('login'); break;
        case 'home': setCurrentRoute('home'); break;
        default: setCurrentRoute('landing');
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (route: Route) => {
    window.location.hash = route === 'landing' ? '' : route;
    setCurrentRoute(route);
  };

  return { currentRoute, navigate };
};

// Landing Page - Página inicial para atrair novos usuários
const LandingPage: React.FC = () => {
  const { navigate } = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <header className="bg-white/80 backdrop-blur-lg shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Store className="text-orange-600" size={32} />
            <h1 className="text-2xl font-bold text-slate-800">UMenu</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('login')} className="px-4 py-2 text-slate-600 hover:text-orange-600 transition-colors">Entrar</button>
            <button onClick={() => navigate('cadastro')} className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium">Criar Cardápio</button>
          </div>
        </div>
      </header>
      <section className="py-20 lg:py-32 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl lg:text-6xl font-extrabold text-slate-800 mb-6">Crie seu cardápio online<span className="block text-orange-600">em minutos</span></h2>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">Transforme seu restaurante com um cardápio digital moderno, responsivo e fácil de usar. Seus clientes vão adorar!</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate('cadastro')} className="px-8 py-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold text-lg flex items-center justify-center gap-2"><Store size={20} />Começar Agora - Grátis</button>
            <button onClick={() => navigate('home')} className="px-8 py-4 border-2 border-slate-300 text-slate-700 rounded-lg hover:border-orange-500 hover:text-orange-600 transition-colors font-semibold text-lg">Ver Demo</button>
          </div>
        </div>
      </section>
    </div>
  );
};

// Página de Login
const LoginPage: React.FC = () => {
  const { navigate } = useRouter();
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4 bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <Store className="mx-auto text-orange-600 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-slate-800">Entrar no UMenu</h2>
          <p className="text-slate-600 mt-2">Acesse seu painel administrativo</p>
        </div>
        <div className="space-y-4">
          <button onClick={() => navigate('admin')} className="w-full py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium">Acessar Painel Admin</button>
          <div className="text-center"><span className="text-slate-500 text-sm">Não tem uma conta? </span><button onClick={() => navigate('cadastro')} className="text-orange-600 hover:text-orange-700 font-medium text-sm">Criar cardápio</button></div>
          <div className="text-center"><button onClick={() => navigate('landing')} className="text-slate-500 hover:text-slate-700 text-sm">← Voltar ao início</button></div>
        </div>
      </div>
    </div>
  );
};

// Página de Cadastro
const CadastroPage: React.FC = () => {
  const { navigate } = useRouter();
  const handleSuccess = (_tenantId: string, subdomain: string) => {
    alert(`Cardápio criado com sucesso! Subdomínio: ${subdomain}`);
    navigate('admin');
  };
  const handleCancel = () => navigate('landing');
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm"><div className="container mx-auto px-4 py-4 flex justify-between items-center"><div className="flex items-center gap-3"><Store className="text-orange-600" size={32} /><h1 className="text-xl font-bold text-slate-800">UMenu</h1></div><button onClick={() => navigate('landing')} className="text-slate-600 hover:text-slate-800 transition-colors">← Voltar</button></div></header>
      <TenantRegistration onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  );
};

// Componente Hero dinâmico
const Hero: React.FC<{ settings: TenantSettings }> = React.memo(({ settings }) => {
  const isOpen = useBusinessStatus(settings.hours);
  return (
    <div className="relative bg-slate-800 text-white">
      <img src={settings.bannerUrl || 'https://placehold.co/1200x400/a57d65/FFFFFF?text=Banner'} alt={`Banner de ${settings.name}`} className="w-full h-48 md:h-64 object-cover opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
      <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-4">
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-shadow">{settings.name}</h2>
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2"><MapPin size={18} className="text-slate-300" /><span className="font-medium">{settings.address}</span></div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${isOpen ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}><span className={`h-2 w-2 rounded-full ${isOpen ? 'bg-green-400' : 'bg-red-400'}`}></span>{isOpen ? 'Aberto Agora' : 'Fechado Agora'}</div>
        </div>
      </div>
    </div>
  );
});

// CategoryNav Component
const CategoryNav: React.FC<{ categories: Category[]; activeCategory: string | null }> = React.memo(({ categories, activeCategory }) => {
  const { searchTerm } = useSearch();
  if (searchTerm.trim() && categories.length === 0) return null;
  return (
    <nav className="sticky top-16 bg-white/95 backdrop-blur-sm shadow-sm z-30 border-b border-slate-200">
      <div className="container mx-auto px-4"><div className="flex items-center overflow-x-auto whitespace-nowrap py-3 space-x-5 sm:space-x-8 text-sm font-medium text-slate-600">{categories.map(category => (<a key={category.id} href={`#${category.id}`} className={`pb-2 transition-all duration-300 border-b-2 ${activeCategory === category.id ? 'text-orange-600 border-orange-500' : 'border-transparent hover:text-orange-500'}`}>{category.name} {searchTerm.trim() && `(${category.products.length})`}</a>))}</div></div>
    </nav>
  );
});

// CategorySection Component
const CategorySection: React.FC<{ category: Category; refProp: React.RefObject<HTMLElement> }> = React.memo(({ category, refProp }) => (
  <section id={category.id} ref={refProp} className="py-8 md:py-10 scroll-mt-20">
    <div className="container mx-auto px-4">
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2 tracking-tight">{category.name}</h2>
      <div className="h-1 w-20 sm:w-24 bg-orange-500 mb-8 sm:mb-10"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8">{category.products.map(product => (<ProductCard key={product.id} product={product} />))}</div>
    </div>
  </section>
));

// Página Home (agora recebe os dados via props)
const HomePage: React.FC<{ menu: Category[]; settings: TenantSettings }> = ({ menu, settings }) => {
  const { filteredMenu, hasResults, searchTerm } = useSearch();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const categoryRefs = useRef<Record<string, React.RefObject<HTMLElement>>>({});
  const displayMenu = filteredMenu;

  displayMenu.forEach(cat => { if (!categoryRefs.current[cat.id]) { categoryRefs.current[cat.id] = React.createRef<HTMLElement>(); } });

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) { setActiveCategory(entry.target.id); } }); }, { rootMargin: '-40% 0px -60% 0px', threshold: 0 });
    const refs = categoryRefs.current;
    Object.values(refs).forEach(ref => { if (ref.current) observer.observe(ref.current); });
    return () => { Object.values(refs).forEach(ref => { if (ref.current) observer.unobserve(ref.current); }); };
  }, [displayMenu]);

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-700">
      <Header logoUrl={settings.logoUrl} />
      <Hero settings={settings} />
      <CategoryNav categories={displayMenu} activeCategory={activeCategory} />
      <main>{searchTerm.trim() && !hasResults ? <NoResults /> : displayMenu.map(category => (<CategorySection key={category.id} category={category} refProp={categoryRefs.current[category.id]} />))}</main>
      <OrderSummary tenantPhone={settings.phone} />
      <footer className="bg-slate-800 text-slate-300 py-8 mt-16"><div className="container mx-auto px-4 text-center"><p className="text-sm">&copy; {new Date().getFullYear()} {settings.name}. Todos os direitos reservados.</p><p className="text-xs text-slate-400 mt-2">Desenvolvido com ❤️ por UMenu</p></div></footer>
    </div>
  );
};

// Wrapper para HomePage que agora consome o TenantContext
const HomePageWrapper: React.FC<{ tenantData: { menu: Category[]; settings: TenantSettings } }> = ({ tenantData }) => {
  if (!tenantData || tenantData.menu.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <AlertTriangle className="mx-auto h-12 w-12 text-orange-400" />
          <h3 className="mt-4 text-lg font-medium text-slate-900">Cardápio em Construção</h3>
          <p className="mt-2 text-sm text-slate-500">Este cardápio ainda não tem produtos cadastrados. Volte mais tarde!</p>
        </div>
      </div>
    );
  }

  return (
    <SearchProvider menuData={tenantData.menu}>
      <CartProvider>
        <HomePage menu={tenantData.menu} settings={tenantData.settings} />
      </CartProvider>
    </SearchProvider>
  );
};

// Router Principal - Agora com a lógica de carregamento do Tenant
export const Router: React.FC = () => {
  const { currentRoute } = useRouter();
  const { tenantData, subdomain, isLoading, isError, error } = useTenantContext();

  const renderPage = () => {
    // Se não for a home, renderiza as páginas de admin/cadastro/etc
    if (currentRoute !== 'home') {
      switch (currentRoute) {
        case 'admin': return <AuthProvider><AdminRoute /></AuthProvider>;
        case 'cadastro': return <AuthProvider><CadastroPage /></AuthProvider>;
        case 'login': return <LoginPage />;
        case 'landing':
        default: return <LandingPage />;
      }
    }

    // Lógica para a rota 'home' (o cardápio do tenant)
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          <p className="ml-4 text-slate-600">Carregando cardápio de {subdomain}...</p>
        </div>
      );
    }

    if (isError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-sm mx-auto">
            <WifiOff className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="mt-4 text-lg font-medium text-red-800">Cardápio não encontrado</h3>
            <p className="mt-2 text-sm text-slate-500">Não foi possível encontrar o cardápio para "{subdomain}". Verifique o endereço e tente novamente.</p>
            <p className="mt-1 text-xs text-slate-400">({error})</p>
          </div>
        </div>
      );
    }

    if (tenantData) {
      return <HomePageWrapper tenantData={tenantData} />;
    }

    // Fallback se não houver subdomínio (deve ser pego pelo useRouter, mas como segurança)
    return <LandingPage />;
  };

  return (
    <>
      <style>{` html { scroll-behavior: smooth; } `}</style>
      {renderPage()}
    </>
  );
};

export default Router;
