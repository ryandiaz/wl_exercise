import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImageData } from '../types';
import { favoritesService } from '../services/favoritesService';
import { ThemeToggle } from './ThemeToggle';
import './FavoritesPage.css';

interface FavoritesPageProps {
  onSelectFavorite: (favorite: ImageData) => void;
}

/**
 * FavoritesPage component - Displays and manages user's favorite images
 * 
 * This component provides:
 * - Grid layout displaying all saved favorite images
 * - Ability to select a favorite and return to main canvas with it loaded
 * - Remove functionality to remove a favorite from the favorites list
 * - Navigation back to the main canvas
 * - Empty state when no favorites exist
 * 
 * The component handles its own data fetching and state management
 * while communicating with the parent through callback props
 */
export const FavoritesPage: React.FC<FavoritesPageProps> = ({ onSelectFavorite }) => {
  // Local state for managing favorites data and UI states
  const [favorites, setFavorites] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  /**
   * Effect to load favorites when component mounts
   */
  useEffect(() => {
    loadFavorites();
  }, []);

  // Function to load favorites from the service
  const loadFavorites = async () => {
    try {
      setLoading(true);
      setError(null);
      const favoritesList = await favoritesService.getFavorites();
      console.log('Favorites:', favoritesList);
      setFavorites(favoritesList);
    } catch (err) {
      setError('Failed to load favorites');
      console.error('Error loading favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handler for selecting a favorite image
   * Passes the selected favorite to parent and navigates back to main canvas
   */
  const handleSelectFavorite = (favorite: ImageData) => {
    onSelectFavorite(favorite);
    navigate('/'); // Navigate back to main page
  };

  /**
   * Handler for removing a favorite image
   * Updates both the service and local state
   */
  const handleRemoveFavorite = async (id: string) => {
    try {
      await favoritesService.removeFavorite(id);
      setFavorites(prev => prev.filter(fav => fav.id !== id));
    } catch (err) {
      console.error('Error removing favorite:', err);
    }
  };

  // Loading state UI
  if (loading) {
    return (
      <div className="favorites-page">
        <div className="favorites-header">
          <div className="header-left">
            <button className="back-button" onClick={() => navigate('/')}>
              ← Back to Canvas
            </button>
            <h1>Favorites</h1>
          </div>
          <ThemeToggle />
        </div>
        <div className="favorites-loading">
          <div className="loading-spinner"></div>
          <p>Loading favorites...</p>
        </div>
      </div>
    );
  }

  // Error state UI
  if (error) {
    return (
      <div className="favorites-page">
        <div className="favorites-header">
          <div className="header-left">
            <button className="back-button" onClick={() => navigate('/')}>
              ← Back to Canvas
            </button>
            <h1>Favorites</h1>
          </div>
          <ThemeToggle />
        </div>
        <div className="favorites-error">
          <p>{error}</p>
          <button onClick={loadFavorites}>Try Again</button>
        </div>
      </div>
    );
  }

  // Main favorites display UI
  return (
    <div className="favorites-page">
      {/* Header with navigation and theme toggle */}
      <div className="favorites-header">
        <div className="header-left">
          <button className="back-button" onClick={() => navigate('/')}>
            ← Back to Canvas
          </button>
          <h1>Favorites</h1>
        </div>
        <ThemeToggle />
      </div>
      
      {/* Conditional rendering based on whether favorites exist */}
      {favorites.length === 0 ? (
        // Empty state when no favorites
        <div className="favorites-empty">
          <div className="empty-content">
            <div className="empty-icon">⭐</div>
            <h3>No Favorites Yet</h3>
            <p>Add images to your favorites from the main canvas to see them here.</p>
          </div>
        </div>
      ) : (
        // Grid display of favorites
        <div className="favorites-grid">
          {favorites.map(favorite => (
            <div 
              key={favorite.id}
              className="favorite-item"
              onClick={() => handleSelectFavorite(favorite)}
            >
              <div className="favorite-image-container">
                <img 
                  src={favorite.imageUrl} 
                  alt={favorite.prompt}
                  className="favorite-image"
                />
                
                {/* Overlay with remove button */}
                <div className="favorite-overlay">
                  <button 
                    className="remove-favorite-btn"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the select action
                      handleRemoveFavorite(favorite.id);
                    }}
                    title="Remove from favorites"
                  >
                    ×
                  </button>
                </div>
                
                {/* Tooltip showing the prompt */}
                <div className="favorite-tooltip">
                  {favorite.prompt}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 