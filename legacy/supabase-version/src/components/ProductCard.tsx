import React, { useState, useCallback } from 'react';
import { Plus, Minus, ShoppingCart, Check, Tag } from 'lucide-react';
import { Product } from '../types';
import { formatCurrency, getEffectivePrice, isPromotionActive, getDiscountAmount } from '../utils/pricing';
import { useCart } from '../contexts/CartContext';
import { useMetaPixel } from '../hooks/useMetaPixel';
import { LazyImage } from './LazyImage';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({ product }) => {
  const { updateQuantity, getItemQuantity } = useCart();
  const { trackAddToCart } = useMetaPixel();
  const [quantity, setQuantity] = useState(0);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);

  const currentCartQuantity = getItemQuantity(product.id);

  const handleFocus = useCallback(() => {
    if (quantity === 0 && product.pricingType === 'kg' && product.minQuantity) {
      setQuantity(product.minQuantity);
    }
  }, [quantity, product.pricingType, product.minQuantity]);

  const handleQuantityChange = useCallback((delta: number) => {
    setError('');
    let newQuantity = (quantity || 0) + delta;
    if (newQuantity < 0) newQuantity = 0;
    setQuantity(product.pricingType === 'kg' ? parseFloat(newQuantity.toFixed(2)) : newQuantity);
  }, [quantity, product.pricingType]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const value = e.target.value;
    const newQuantity = product.pricingType === 'kg' ? parseFloat(value) : parseInt(value, 10);
    setQuantity(isNaN(newQuantity) || newQuantity < 0 ? 0 : newQuantity);
  }, [product.pricingType]);

  const validateQuantity = useCallback((qty: number): string | null => {
    if (qty <= 0) {
      return 'A quantidade deve ser maior que zero.';
    }

    if (product.pricingType === 'cento' && (qty % (product.minQuantity || 25) !== 0)) {
      return `A quantidade deve ser em múltiplos de ${product.minQuantity || 25}.`;
    }

    if (product.pricingType === 'kg' && product.minQuantity && qty < product.minQuantity) {
      return `O pedido mínimo é de ${product.minQuantity}kg.`;
    }

    if (product.pricingType === 'kg' && product.step && product.minQuantity && qty > product.minQuantity) {
      const quantityAboveMin = qty - product.minQuantity;
      const remainder = quantityAboveMin % product.step;
      if (Math.abs(remainder) > 1e-9 && Math.abs(remainder - product.step) > 1e-9) {
        return `O incremento deve ser de ${product.step * 1000}g.`;
      }
    }

    return null;
  }, [product]);

  const handleAddToCart = useCallback(() => {
    const validationError = validateQuantity(quantity);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    const newTotalQuantity = currentCartQuantity + quantity;
    updateQuantity(product.id, newTotalQuantity);
    
    // Meta Pixel - Track AddToCart event
    trackAddToCart(product, quantity);
    
    setQuantity(0);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }, [quantity, currentCartQuantity, product.id, updateQuantity, validateQuantity, trackAddToCart, product]);

  const isOnPromotion = isPromotionActive(product);
  const effectivePrice = getEffectivePrice(product);
  const discountAmount = getDiscountAmount(product);



  return (
    <div className="bg-white rounded-xl shadow-lg shadow-slate-200/50 overflow-hidden transform transition-all duration-300 flex flex-row sm:flex-col hover:shadow-xl hover:-translate-y-1 relative">
      {/* Badge de Promoção */}
      {isOnPromotion && (
        <div className="absolute top-2 left-2 z-10">
          <div className="bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 shadow-lg">
            <Tag size={12} />
            {product.promotion?.label || 'OFERTA'}
          </div>
        </div>
      )}

      <div className="w-1/3 sm:w-full flex-shrink-0 relative">
        <LazyImage
          src={product.image}
          alt={product.name}
          className="w-full h-full sm:aspect-square object-cover"
        />
        {/* Overlay de desconto para mobile */}
        {isOnPromotion && (
          <div className="absolute bottom-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold sm:hidden">
            -{product.promotion?.discountPercentage}%
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <h3 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight leading-tight">
          {product.name}
        </h3>
        <p className="text-slate-600 text-xs sm:text-sm mt-1 flex-grow hidden sm:block">
          {product.description}
        </p>

        <div className="mt-2 sm:mt-4">
          {isOnPromotion ? (
            <div className="space-y-1">
              {/* Preço original riscado */}
              <p className="text-sm text-slate-500 line-through">
                {formatCurrency(product.price)}
                <span className="text-xs ml-1">/ {product.pricingType}</span>
              </p>

              {/* Preço promocional em destaque */}
              <div className="flex items-center gap-2">
                <p className="text-lg sm:text-2xl font-extrabold text-red-600">
                  {formatCurrency(effectivePrice)}
                  <span className="text-xs sm:text-sm font-medium text-slate-500 ml-1.5">
                    / {product.pricingType}
                  </span>
                </p>

                {/* Badge de desconto para desktop */}
                <div className="hidden sm:block bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">
                  -{product.promotion?.discountPercentage}%
                </div>
              </div>

              {/* Economia em valor */}
              <p className="text-xs text-green-600 font-medium">
                Economize {formatCurrency(discountAmount)}
              </p>
            </div>
          ) : (
            <p className="text-lg sm:text-2xl font-extrabold text-slate-900">
              {formatCurrency(product.price)}
              <span className="text-xs sm:text-sm font-medium text-slate-500 ml-1.5">
                / {product.pricingType}
              </span>
            </p>
          )}

          {product.minQuantity && (
            <p className="text-xs text-slate-500 mt-1">
              Mínimo {product.minQuantity}{product.pricingType === 'kg' ? 'kg' : ' un'}.
            </p>
          )}
        </div>

        <div className="mt-auto pt-2 sm:mt-6 sm:pt-4 sm:border-t sm:border-slate-100">
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <button
              onClick={() => handleQuantityChange(-(product.step || 1))}
              className="bg-slate-200 text-slate-700 rounded-full p-2 sm:p-2.5 transition-colors hover:bg-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              aria-label="Diminuir quantidade"
            >
              <Minus size={14} />
            </button>

            <input
              type="number"
              value={quantity}
              onFocus={handleFocus}
              onChange={handleInputChange}
              step={product.step || 1}
              min="0"
              className="w-16 sm:w-20 text-center font-bold text-base sm:text-lg text-slate-800 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              aria-label="Quantidade"
            />

            <button
              onClick={() => handleQuantityChange(product.step || 1)}
              className="bg-slate-200 text-slate-700 rounded-full p-2 sm:p-2.5 transition-colors hover:bg-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              aria-label="Aumentar quantidade"
            >
              <Plus size={14} />
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-[11px] sm:text-xs text-center mt-2 font-medium">
              {error}
            </p>
          )}

          <button
            onClick={handleAddToCart}
            className={`w-full mt-3 sm:mt-4 font-bold py-2.5 sm:py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:text-slate-500 text-sm ${added ? 'bg-green-600 text-white' : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
            disabled={quantity <= 0 || added}
          >
            {added ? (
              <>
                <Check size={18} /> Adicionado!
              </>
            ) : (
              <>
                <ShoppingCart size={16} /> Adicionar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});