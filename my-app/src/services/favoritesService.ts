import { ImageData } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

class FavoritesService {
  private favoritesUrl = API_BASE_URL + '/api/favorites';

  async getFavorites(): Promise<ImageData[]> {
    try {
      const response = await fetch(this.favoritesUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch favorites: ${response.statusText}`);
      }
      return (await response.json()).favorites;
    } catch (error) {
      console.error('Error fetching favorites:', error);
      return [];
    }
  }

  async addFavorite(favorite: ImageData): Promise<void> {
    try {
      const response = await fetch(this.favoritesUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(favorite),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add favorite: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw error;
    }
  }

  async removeFavorite(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.favoritesUrl}/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to remove favorite: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      throw error;
    }
  }
}

export const favoritesService = new FavoritesService(); 