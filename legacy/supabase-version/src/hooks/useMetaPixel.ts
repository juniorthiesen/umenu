import { useEffect } from 'react';
import { Product, CartItem } from '../types';

// Configuração do Meta Pixel
const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || 'YOUR_PIXEL_ID_HERE';

// Tipos para os eventos do Meta Pixel
interface MetaPixelEvent {
  PageView: {};
  InitiateCheckout: {
    content_ids: string[];
    content_type: 'product';
    contents: Array<{
      id: string;
      quantity: number;
      item_price: number;
    }>;
    currency: 'BRL';
    num_items: number;
    value: number;
  };
  AddToCart: {
    content_ids: string[];
    content_type: 'product';
    contents: Array<{
      id: string;
      quantity: number;
      item_price: number;
    }>;
    currency: 'BRL';
    value: number;
  };
  ViewContent: {
    content_ids: string[];
    content_type: 'product';
    contents: Array<{
      id: string;
      quantity: number;
      item_price: number;
    }>;
    currency: 'BRL';
    value: number;
  };
}

// Declaração global do fbq
declare global {
  interface Window {
    fbq: (action: string, event: string, parameters?: any) => void;
    _fbq: any;
  }
}

class MetaPixelManager {
  private static instance: MetaPixelManager;
  private isInitialized = false;

  public static getInstance(): MetaPixelManager {
    if (!MetaPixelManager.instance) {
      MetaPixelManager.instance = new MetaPixelManager();
    }
    return MetaPixelManager.instance;
  }

  public initialize(): void {
    if (this.isInitialized || !PIXEL_ID || PIXEL_ID === 'YOUR_PIXEL_ID_HERE') {
      console.warn('Meta Pixel não inicializado: ID não configurado');
      return;
    }

    try {
      // Inicializar o Meta Pixel
      (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
        if (f.fbq) return;
        n = f.fbq = function() {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

      window.fbq('init', PIXEL_ID);
      this.isInitialized = true;
      
      console.log('Meta Pixel inicializado com sucesso:', PIXEL_ID);
    } catch (error) {
      console.error('Erro ao inicializar Meta Pixel:', error);
    }
  }

  public trackEvent<T extends keyof MetaPixelEvent>(
    eventName: T,
    parameters?: MetaPixelEvent[T]
  ): void {
    if (!this.isInitialized || !window.fbq) {
      console.warn('Meta Pixel não está inicializado');
      return;
    }

    try {
      window.fbq('track', eventName, parameters);
      console.log(`Meta Pixel evento enviado: ${eventName}`, parameters);
    } catch (error) {
      console.error(`Erro ao enviar evento ${eventName}:`, error);
    }
  }

  public trackCustomEvent(eventName: string, parameters?: any): void {
    if (!this.isInitialized || !window.fbq) {
      console.warn('Meta Pixel não está inicializado');
      return;
    }

    try {
      window.fbq('trackCustom', eventName, parameters);
      console.log(`Meta Pixel evento customizado enviado: ${eventName}`, parameters);
    } catch (error) {
      console.error(`Erro ao enviar evento customizado ${eventName}:`, error);
    }
  }
}

// Hook personalizado para usar o Meta Pixel
export const useMetaPixel = () => {
  const pixelManager = MetaPixelManager.getInstance();

  useEffect(() => {
    pixelManager.initialize();
  }, []);

  // Função para converter produto em formato do Meta Pixel
  const formatProductForPixel = (product: Product | CartItem, quantity = 1) => ({
    id: product.id.toString(),
    quantity,
    item_price: 'promotion' in product && product.promotion?.isActive 
      ? product.promotion.promotionalPrice 
      : product.price
  });

  // Evento PageView
  const trackPageView = () => {
    pixelManager.trackEvent('PageView');
  };

  // Evento AddToCart
  const trackAddToCart = (product: Product, quantity: number) => {
    const productForPixel = formatProductForPixel(product, quantity);
    const price = 'promotion' in product && product.promotion?.isActive 
      ? product.promotion.promotionalPrice 
      : product.price;

    pixelManager.trackEvent('AddToCart', {
      content_ids: [product.id.toString()],
      content_type: 'product',
      contents: [productForPixel],
      currency: 'BRL',
      value: price * quantity
    });
  };

  // Evento InitiateCheckout (quando abre o carrinho/resumo do pedido)
  const trackInitiateCheckout = (cartItems: CartItem[], totalValue: number) => {
    const contents = cartItems.map(item => formatProductForPixel(item, item.quantity));
    const contentIds = cartItems.map(item => item.id.toString());

    pixelManager.trackEvent('InitiateCheckout', {
      content_ids: contentIds,
      content_type: 'product',
      contents,
      currency: 'BRL',
      num_items: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      value: totalValue
    });
  };

  // Evento ViewContent (quando visualiza um produto)
  const trackViewContent = (product: Product) => {
    const productForPixel = formatProductForPixel(product);
    const price = product.promotion?.isActive 
      ? product.promotion.promotionalPrice 
      : product.price;

    pixelManager.trackEvent('ViewContent', {
      content_ids: [product.id.toString()],
      content_type: 'product',
      contents: [productForPixel],
      currency: 'BRL',
      value: price
    });
  };

  // Evento customizado para promoções
  const trackPromotionView = (product: Product) => {
    if (product.promotion?.isActive) {
      pixelManager.trackCustomEvent('PromotionView', {
        product_id: product.id,
        product_name: product.name,
        original_price: product.price,
        promotional_price: product.promotion.promotionalPrice,
        discount_percentage: product.promotion.discountPercentage,
        promotion_label: product.promotion.label
      });
    }
  };

  return {
    trackPageView,
    trackAddToCart,
    trackInitiateCheckout,
    trackViewContent,
    trackPromotionView
  };
};
