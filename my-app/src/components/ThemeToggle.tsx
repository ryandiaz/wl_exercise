import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import './ThemeToggle.css';

/**
 * ThemeToggle component - Provides a toggle button for switching between light and dark themes
 * 
 * This component:
 * - Uses the ThemeContext to access current theme state and toggle function
 * - Renders a button that visually indicates the current theme
 * - Provides smooth transition between light and dark modes
 * - Maintains theme state across the entire application
 * - Offers accessible interaction with proper button semantics
 * 
 * The component is typically placed in headers or navigation areas
 * where users expect to find theme controls
 */
export const ThemeToggle: React.FC = () => {
  // Access theme context for current theme state and toggle function
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} theme`}
      title={`Switch to ${isDarkMode ? 'light' : 'dark'} theme`}
    >
      {/* Conditional rendering of theme icon based on current theme */}
      {isDarkMode ? '☀️' : '🌙'}
    </button>
  );
}; 