import { useState, useEffect } from 'react';

interface BusinessHours {
  [key: number]: { start: number; end: number } | null;
}

const BUSINESS_HOURS: BusinessHours = {
  0: null, // Domingo - fechado
  1: { start: 7, end: 18 }, // Segunda
  2: { start: 7, end: 18 }, // Terça
  3: { start: 7, end: 18 }, // Quarta
  4: { start: 7, end: 18 }, // Quinta
  5: { start: 7, end: 18 }, // Sexta
  6: { start: 7, end: 13 }, // Sábado
};

export const useBusinessStatus = (): boolean => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkStatus = () => {
      const now = new Date();
      const day = now.getDay();
      const hours = now.getHours();
      
      const todayHours = BUSINESS_HOURS[day];
      
      if (!todayHours) {
        setIsOpen(false);
        return;
      }
      
      setIsOpen(hours >= todayHours.start && hours < todayHours.end);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 60000);
    
    return () => clearInterval(interval);
  }, []);

  return isOpen;
};