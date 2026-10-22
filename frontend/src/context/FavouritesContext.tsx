'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchFavourites, toggleFavourite as apiToggleFavourite } from '../lib/api';

interface FavouritesContextType {
  favourites: string[];
  isFavourite: (symbol: string) => boolean;
  toggle: (symbol: string) => Promise<void>;
  isLoading: boolean;
}

const FavouritesContext = createContext<FavouritesContextType>({
  favourites: [],
  isFavourite: () => false,
  toggle: async () => {},
  isLoading: false,
});

const DEFAULT_FAVOURITES = [
  'NIFTY50', 'BANKNIFTY', 'RELIANCE', 'TCS', 'HDFCBANK', 
  'INFY', 'TATAMOTORS', 'ICICIBANK', 'SBIN', 'BHARTIARTL'
];

export const FavouritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favourites, setFavourites] = useState<string[]>(DEFAULT_FAVOURITES);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize from localStorage or backend
  useEffect(() => {
    let localSaved: string[] | null = null;
    try {
      const stored = localStorage.getItem('bharat_market_favourites');
      if (stored) {
        localSaved = JSON.parse(stored);
        if (Array.isArray(localSaved) && localSaved.length > 0) {
          setFavourites(localSaved);
        }
      }
    } catch (e) {
      console.warn('Could not read favourites from localStorage', e);
    }

    async function loadBackendFavs() {
      try {
        const data = await fetchFavourites();
        if (Array.isArray(data) && data.length > 0) {
          const syms = data.map(item => item.symbol);
          setFavourites(syms);
          localStorage.setItem('bharat_market_favourites', JSON.stringify(syms));
        }
      } catch (err) {
        // Fallback to local
      } finally {
        setIsLoading(false);
      }
    }

    loadBackendFavs();
  }, []);

  const isFavourite = (symbol: string): boolean => {
    const clean = symbol.toUpperCase().replace('.NS', '').replace('^', '').trim();
    return favourites.includes(clean);
  };

  const toggle = async (symbol: string) => {
    const clean = symbol.toUpperCase().replace('.NS', '').replace('^', '').trim();
    const willBeFav = !favourites.includes(clean);
    
    // Optimistic UI update
    const updated = willBeFav 
      ? [...favourites, clean] 
      : favourites.filter(s => s !== clean);

    setFavourites(updated);
    try {
      localStorage.setItem('bharat_market_favourites', JSON.stringify(updated));
      await apiToggleFavourite(clean);
    } catch (err) {
      console.error('Error toggling favourite in backend:', err);
    }
  };

  return (
    <FavouritesContext.Provider value={{ favourites, isFavourite, toggle, isLoading }}>
      {children}
    </FavouritesContext.Provider>
  );
};

export const useFavourites = () => useContext(FavouritesContext);
