import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, ReactNode } from 'react';
import { CartItem, CartContextType, Product } from '../types';
import { menuData } from '../data/menu';
import { calculateItemTotal } from '../utils/pricing';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useDebounce } from '../hooks/useDebounce';

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useLocalStorage<CartItem[]>('cart', []);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const findProduct = useCallback((productId: number): Product | undefined => {
    return menuData.flatMap(c => c.products).find(p => p.id === productId);
  }, []);

  const updateQuantity = useCallback((productId: number, newQuantity: number) => {
    const product = findProduct(productId);
    if (!product) return;

    if (newQuantity <= 0) {
      setCart(prevCart => prevCart.filter(item => item.id !== productId));
      return;
    }

    if (product.pricingType === 'kg' && product.minQuantity && newQuantity > 0 && newQuantity < product.minQuantity) {
      setCart(prevCart => prevCart.filter(item => item.id !== productId));
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === productId);
      const quantity = product.pricingType === 'kg' ? parseFloat(newQuantity.toFixed(2)) : Math.round(newQuantity);

      if (existingItem) {
        return prevCart.map(item =>
          item.id === productId ? { ...item, quantity } : item
        );
      }
      return [...prevCart, { ...product, quantity }];
    });
  }, [findProduct, setCart]);

  const removeFromCart = useCallback((productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  }, [setCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, [setCart]);

  const getItemQuantity = useCallback((productId: number) => {
    return cart.find(item => item.id === productId)?.quantity || 0;
  }, [cart]);

  const totalItems = useMemo(() => cart.length, [cart]);

  const totalPrice = useMemo(() => {
    return cart.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  }, [cart]);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const value: CartContextType = {
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getItemQuantity,
    totalItems,
    totalPrice,
    isCartOpen,
    openCart,
    closeCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};