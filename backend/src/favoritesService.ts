import { ImageData } from "./types";

class FavoritesService {
// TODO: Implement favorites in a database
// use this for testing
  private favorites: ImageData[] = [];

  constructor() {
    this.favorites = [];
  }

  async getFavorites() {
    return this.favorites;
  }

  async addFavorite(favorite: ImageData) {
    this.favorites.push(favorite);
  }

  async removeFavorite(id: string) {
    this.favorites = this.favorites.filter((f) => f.id !== id);
  }
}

export default FavoritesService;