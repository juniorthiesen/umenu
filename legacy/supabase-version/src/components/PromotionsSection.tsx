import React from 'react';
import { Tag, Flame, Clock } from 'lucide-react';
import { Product } from '../types';
import { formatCurrency, getEffectivePrice, isPromotionActive } from '../utils/pricing';
import { LazyImage } from './LazyImage';
import { useMetaPixel } from '../hooks/useMetaPixel';

interface PromotionsSectionProps {
  products: Product[];
  onProductClick?: (product: Product) => void;
}

// Componente do card de promoção
const PromotionCard: React.FC<{ 
  product: Product; 
  onProductClick?: (product: Product) => void;
  className?: string;
  trackViewContent?: (product: Product) => void;
}> = ({ product, onProductClick, className = '', trackViewContent }) => {
  return (
    <div
      className={`bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer relative ${className}`}
      onClick={() => {
        // Meta Pixel - Track ViewContent event
        trackViewContent?.(product);
        onProductClick?.(product);
      }}
    >
      {/* Badge de promoção */}
      <div className="absolute top-2 left-2 z-10">
        <div className="bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 shadow-lg animate-pulse">
          <Tag size={12} />
          {product.promotion?.label || 'OFERTA'}
        </div>
      </div>

      {/* Badge de desconto */}
      <div className="absolute top-2 right-2 z-10">
        <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
          -{product.promotion?.discountPercentage}%
        </div>
      </div>

      {/* Imagem do produto */}
      <div className="relative h-32 sm:h-40">
        <LazyImage
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        {/* Overlay com gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
      </div>

      {/* Conteúdo do card */}
      <div className="p-3">
        <h3 className="font-bold text-slate-800 text-sm mb-1 line-clamp-1">
          {product.name}
        </h3>
        
        <p className="text-xs text-slate-600 mb-2 line-clamp-2">
          {product.description}
        </p>

        {/* Preços */}
        <div className="space-y-1">
          {/* Preço original riscado */}
          <p className="text-xs text-slate-500 line-through">
            De: {formatCurrency(product.price)}
          </p>
          
          {/* Preço promocional */}
          <div className="flex items-center justify-between">
            <p className="text-lg font-extrabold text-red-600">
              {formatCurrency(getEffectivePrice(product))}
              <span className="text-xs font-medium text-slate-500 ml-1">
                / {product.pricingType}
              </span>
            </p>
          </div>

          {/* Economia */}
          <p className="text-xs text-green-600 font-medium">
            Economize {formatCurrency(product.price - getEffectivePrice(product))}
          </p>
        </div>

        {/* Indicador de tempo limitado */}
        <div className="flex items-center gap-1 mt-2 text-xs text-orange-600">
          <Clock size={12} />
          <span className="font-medium">Oferta por tempo limitado</span>
        </div>
      </div>
    </div>
  );
};

export const PromotionsSection: React.FC<PromotionsSectionProps> = React.memo(({ 
  products, 
  onProductClick 
}) => {
  const { trackViewContent } = useMetaPixel();
  
  // Filtrar apenas produtos com promoções ativas
  const promotionalProducts = products.filter(isPromotionActive);

  if (promotionalProducts.length === 0) {
    return null;
  }

  return (
    <section className="bg-gradient-to-r from-red-50 to-orange-50 py-8 px-4 mb-8">
      <div className="max-w-7xl mx-auto">
        {/* Header da seção */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Flame className="text-red-500" size={24} />
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800">
              🔥 Ofertas Especiais
            </h2>
            <Flame className="text-red-500" size={24} />
          </div>
          <p className="text-slate-600 text-sm md:text-base">
            Aproveite nossos preços promocionais por tempo limitado!
          </p>
        </div>

        {/* Grid/Carrossel de produtos em promoção */}
        <div>
          {/* Carrossel para mobile - mostra 2 cards + cantinho do terceiro */}
          <div className="flex overflow-x-auto gap-3 pb-4 sm:hidden scrollbar-hide" style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            paddingLeft: '1rem',
            paddingRight: '1rem'
          }}>
            {promotionalProducts.map((product, index) => (
              <div
                key={product.id}
                className="flex-shrink-0"
                style={{ 
                  scrollSnapAlign: 'start',
                  // Largura otimizada: primeiros 2 cards ocupam ~45% da tela cada, demais ~40%
                  width: index < 2 ? 'calc(45vw - 0.5rem)' : 'calc(40vw - 0.5rem)',
                  minWidth: '280px' // Largura mínima para garantir legibilidade
                }}
              >
                <PromotionCard product={product} onProductClick={onProductClick} trackViewContent={trackViewContent} className="h-full" />
              </div>
            ))}
            {/* Espaçador final */}
            <div className="flex-shrink-0 w-4"></div>
          </div>
          
          {/* Grid para desktop */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {promotionalProducts.map((product) => (
              <PromotionCard 
                key={product.id} 
                product={product} 
                onProductClick={onProductClick} 
                trackViewContent={trackViewContent}
              />
            ))}
          </div>
        </div>

        {/* Call to action */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-600 mb-2">
            ⚡ Não perca essas ofertas incríveis!
          </p>
          <div className="inline-flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg hover:bg-red-600 transition-colors">
            <Tag size={16} />
            Ver todos os produtos em promoção
          </div>
        </div>
      </div>
    </section>
  );
});

PromotionsSection.displayName = 'PromotionsSection';
