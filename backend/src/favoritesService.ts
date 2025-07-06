import { ImageData } from "./types";
import { Pool } from "pg";

interface IFavoritesService {
  getFavorites(): Promise<ImageData[]>;
  addFavorite(favorite: ImageData): Promise<void>;
  removeFavorite(id: string): Promise<void>;
}

const USER_ID = "default";
// In-memory implementation for testing
class InMemoryFavoritesService implements IFavoritesService {
  private favorites: ImageData[] = [];

  constructor() {
    this.favorites = [];
  }

  async getFavorites(): Promise<ImageData[]> {
    return this.favorites;
  }

  async addFavorite(favorite: ImageData): Promise<void> {
    this.favorites.push(favorite);
  }

  async removeFavorite(id: string): Promise<void> {
    this.favorites = this.favorites.filter((f) => f.id !== id);
  }
}

class PostgreSQLFavoritesService implements IFavoritesService {
  private pool: Pool;

  constructor(connectionConfig?: {
    host?: string;
    port?: number;
    database?: string;
    user?: string;
    password?: string;
  }) {
    this.pool = new Pool({
      host: connectionConfig?.host || process.env.DB_HOST || 'localhost',
      port: connectionConfig?.port || parseInt(process.env.DB_PORT || '5432'),
      database: connectionConfig?.database || process.env.DB_NAME || 'imagegen',
      user: connectionConfig?.user || process.env.DB_USER || 'postgres',
      password: connectionConfig?.password || process.env.DB_PASSWORD || '',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  async getFavorites(): Promise<ImageData[]> {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT prompt, image_id as "id", image_url as "imageUrl", variations 
        FROM favorites 
        ORDER BY created_at DESC
      `;
      const result = await client.query(query);
      return result.rows.map(row => ({
        id: row.id,
        prompt: row.prompt,
        imageUrl: row.imageUrl,
        variations: row.variations,
      }));
    } catch (error) {
      console.error("Error fetching favorites:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  async addFavorite(favorite: ImageData): Promise<void> {
    const client = await this.pool.connect();
    try {
      const query = `
        INSERT INTO favorites (user_id, image_id, prompt, image_url, variations, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `;
      const values = [
        USER_ID,
        favorite.id,
        favorite.prompt,
        favorite.imageUrl,
        favorite.variations ? JSON.stringify(favorite.variations) : null,
      ];
      await client.query(query, values);
    } catch (error) {
      console.error("Error adding favorite:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  async removeFavorite(id: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      const query = `DELETE FROM favorites WHERE image_id = $1 AND user_id = $2`;
      await client.query(query, [id, USER_ID]);
    } catch (error) {
      console.error("Error removing favorite:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export { IFavoritesService, InMemoryFavoritesService, PostgreSQLFavoritesService };