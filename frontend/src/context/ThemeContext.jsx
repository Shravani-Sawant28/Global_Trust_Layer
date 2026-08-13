'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({ theme: 'light', toggleTheme: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  // Initialise from localStorage on mount — default is always light
  useEffect(() => {
    // Clear any OS-inherited dark setting saved before v2 redesign
    if (!localStorage.getItem('gtl_theme_v2')) {
      localStorage.removeItem('gtl_theme');
      localStorage.setItem('gtl_theme_v2', '1');
    }
    const stored = localStorage.getItem('gtl_theme');
    const preferred = stored || 'light';   // default: light
    setTheme(preferred);
    document.documentElement.classList.toggle('dark', preferred === 'dark');
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('gtl_theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
