import React, { useCallback } from 'react';
import { ShoppingCart, X, Trash2, Plus, Minus, Tag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useMetaPixel } from '../hooks/useMetaPixel';
import { formatCurrency, calculateItemTotal, getEffectivePrice, isPromotionActive } from '../utils/pricing';

const BUSINESS_PHONE = import.meta.env.VITE_WHATSAPP_PHONE || "5546988145788";

export const OrderSummary: React.FC = React.memo(() => {
  const { 
    cart, 
    totalPrice, 
    isCartOpen, 
    closeCart, 
    updateQuantity, 
    removeFromCart, 
    clearCart 
  } = useCart();
  const { trackInitiateCheckout } = useMetaPixel();

  const generateWhatsAppMessage = useCallback(() => {
    let message = "Olá! Gostaria de fazer o seguinte pedido:\n\n";
    let totalSavings = 0;
    
    cart.forEach(item => {
      const itemTotal = formatCurrency(calculateItemTotal(item));
      const quantityLabel = item.pricingType === 'kg' 
        ? `${item.quantity.toFixed(2)}kg` 
        : `${item.quantity} unidades`;
      
      const itemIsOnPromotion = isPromotionActive(item);
      const effectivePrice = getEffectivePrice(item);
      
      message += `*${item.name}*\n`;
      
      if (itemIsOnPromotion) {
        message += `🏷️ ${item.promotion?.label} (-${item.promotion?.discountPercentage}%)\n`;
        message += `~~${formatCurrency(item.price)}~~ ➜ ${formatCurrency(effectivePrice)} / ${item.pricingType}\n`;
        
        // Calcular economia total do item
        const itemSavings = (item.price - effectivePrice) * (item.pricingType === 'cento' ? item.quantity / 100 : item.quantity);
        totalSavings += itemSavings;
      } else {
        message += `${formatCurrency(item.price)} / ${item.pricingType}\n`;
      }
      
      message += `Quantidade: ${quantityLabel}\n`;
      message += `Subtotal: ${itemTotal}\n\n`;
    });
    
    message += `*Total do Pedido: ${formatCurrency(totalPrice)}*\n`;
    
    if (totalSavings > 0) {
      message += `💰 *Você economizou: ${formatCurrency(totalSavings)}*\n`;
    }
    
    return encodeURIComponent(message);
  }, [cart, totalPrice]);

  const handleFinalizeOrder = useCallback(() => {
    if (cart.length === 0) return;
    
    // Meta Pixel - Track InitiateCheckout event
    trackInitiateCheckout(cart, totalPrice);
    
    const message = generateWhatsAppMessage();
    const whatsappUrl = `https://wa.me/${BUSINESS_PHONE}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  }, [cart.length, generateWhatsAppMessage, trackInitiateCheckout, cart, totalPrice]);

  const handleQuantityUpdate = useCallback((itemId: number, delta: number, step: number = 1) => {
    const item = cart.find(cartItem => cartItem.id === itemId);
    if (!item) return;
    
    const newQuantity = item.quantity + (delta * step);
    updateQuantity(itemId, newQuantity);
  }, [cart, updateQuantity]);

  return (
    <div 
      className={`fixed inset-0 z-50 transition-colors duration-300 ${
        isCartOpen ? 'bg-black/50' : 'bg-transparent pointer-events-none'
      }`} 
      onClick={closeCart}
    >
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-heading"
      >
        <div className="p-5 flex justify-between items-center border-b border-slate-200">
          <h2 id="cart-heading" className="text-xl font-bold text-slate-800">
            O seu Carrinho
          </h2>
          <button 
            onClick={closeCart} 
            className="p-2 rounded-full hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500" 
            aria-label="Fechar carrinho"
          >
            <X size={24} className="text-slate-600" />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-5">
            <ShoppingCart size={56} className="text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-700">
              O seu carrinho está vazio
            </h3>
            <p className="text-slate-500 mt-2">
              Adicione produtos do cardápio para começar.
            </p>
          </div>
        ) : (
          <>
            <div className="flex-grow overflow-y-auto p-5 space-y-5">
              {cart.map(item => {
                const itemIsOnPromotion = isPromotionActive(item);
                const effectivePrice = getEffectivePrice(item);
                
                return (
                  <div key={item.id} className="flex items-start gap-4 relative">
                    {/* Badge de promoção no carrinho */}
                    {itemIsOnPromotion && (
                      <div className="absolute -top-1 -left-1 z-10">
                        <div className="bg-red-500 text-white px-1.5 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                          <Tag size={10} />
                          {item.promotion?.label || 'OFERTA'}
                        </div>
                      </div>
                    )}
                    
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-20 h-20 rounded-lg object-cover" 
                    />
                    
                    <div className="flex-grow">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-800">{item.name}</h4>
                        {itemIsOnPromotion && (
                          <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-bold">
                            -{item.promotion?.discountPercentage}%
                          </span>
                        )}
                      </div>
                      
                      {/* Preços no carrinho */}
                      <div className="mt-1">
                        {itemIsOnPromotion ? (
                          <div className="space-y-0.5">
                            <p className="text-xs text-slate-500 line-through">
                              {formatCurrency(item.price)} / {item.pricingType}
                            </p>
                            <p className="font-bold text-red-600 text-sm">
                              {formatCurrency(effectivePrice)} / {item.pricingType}
                            </p>
                            <p className="font-bold text-orange-600">
                              Total: {formatCurrency(calculateItemTotal(item))}
                            </p>
                          </div>
                        ) : (
                          <p className="font-bold text-orange-600">
                            {formatCurrency(calculateItemTotal(item))}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <button 
                          onClick={() => handleQuantityUpdate(item.id, -1, item.step || 1)} 
                          className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500" 
                          aria-label={`Diminuir quantidade de ${item.name}`}
                        >
                          <Minus size={14} />
                        </button>
                        
                        <span className="font-bold w-10 text-center text-slate-700">
                          {item.pricingType === 'kg' ? item.quantity.toFixed(1) : item.quantity}
                        </span>
                        
                        <button 
                          onClick={() => handleQuantityUpdate(item.id, 1, item.step || 1)} 
                          className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500" 
                          aria-label={`Aumentar quantidade de ${item.name}`}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => removeFromCart(item.id)} 
                      className="text-red-500 hover:text-red-600 p-1 rounded-full hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500" 
                      aria-label={`Remover ${item.name} do carrinho`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                );
              })}
            </div>
            
            <div className="p-5 border-t border-slate-200 bg-slate-50">
              {/* Resumo de economias */}
              {(() => {
                const totalSavings = cart.reduce((savings, item) => {
                  if (isPromotionActive(item)) {
                    const itemSavings = (item.price - getEffectivePrice(item)) * 
                      (item.pricingType === 'cento' ? item.quantity / 100 : item.quantity);
                    return savings + itemSavings;
                  }
                  return savings;
                }, 0);

                return totalSavings > 0 ? (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tag className="text-green-600" size={16} />
                        <span className="text-sm font-medium text-green-800">
                          Você está economizando
                        </span>
                      </div>
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(totalSavings)}
                      </span>
                    </div>
                  </div>
                ) : null;
              })()}

              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-medium text-slate-600">Total</span>
                <span className="text-2xl font-bold text-slate-900">
                  {formatCurrency(totalPrice)}
                </span>
              </div>
              
              <button 
                onClick={handleFinalizeOrder} 
                className="w-full bg-green-600 text-white font-bold py-3.5 px-4 rounded-lg hover:bg-green-700 transition-colors text-lg flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
              >
                Finalizar Pedido no WhatsApp
              </button>
              
              <button 
                onClick={clearCart} 
                className="w-full mt-3 text-sm text-slate-500 hover:text-red-600 font-semibold flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-red-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                <Trash2 size={14} /> Esvaziar Carrinho
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
});