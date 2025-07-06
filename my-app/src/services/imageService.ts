import { GenerationRequest, GenerationResponse } from '../types';


const imageGenerationUrl = 'http://localhost:8080/image';
const favoritesUrl = 'http://localhost:8080/favorites';

// Placeholder service for image generation
export class ImageGenerationService {
  // static async generateImage(prompt: string): Promise<string> {
  //   // Simulate API delay
  //   await new Promise(resolve => setTimeout(resolve, 1000));
    
  //   // Return placeholder image URL
  //   return `https://picsum.photos/128/128?random=${Date.now()}`;
  // }

  // static async generateImageVariations(request: GenerationRequest): Promise<string[]> {
  //   // Simulate API delay
  //   await new Promise(resolve => setTimeout(resolve, 1500));
    
  //   // Return placeholder image URLs
  //   const variations = [];
  //   for (let i = 0; i < (request.variations || 4); i++) {
  //     variations.push(`https://picsum.photos/128/128?random=${Date.now() + i}`);
  //   }
  //   return variations;
  // }

  static async generateImageV2(request: GenerationRequest): Promise<GenerationResponse> {
    console.log('Generating image with request:', request, ' json: ', JSON.stringify(request));
    const response = await fetch(imageGenerationUrl, {
      method: 'POST',
      body: JSON.stringify(request),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }

  static async getFavorites(userId: string): Promise<ImageData[]> {
    const response = await fetch(favoritesUrl, {
      method: 'GET',
      body: JSON.stringify({ userId })
    });
    if (response.ok) {
      const data = await response.json();
      if (data.images instanceof Array) {
        const imageList = data.images.map((image: any) => ({
          id: image.id,
          url: image.url,
          prompt: image.prompt,
          variations: image.variations
        }));
        return imageList;
      }
      return [];
    }
    return [];
  }

  static async addToFavorites(userId: string, imageData: ImageData): Promise<void> {
    const response = await fetch(favoritesUrl, {
      method: 'POST',
      body: JSON.stringify({ userId, imageData })
    });
    if (response.ok) {
      return;
    }
    throw new Error('Failed to add to favorites');
  }

  static async removeFromFavorites(userId: string, imageId: string): Promise<void> {
    const response = await fetch(favoritesUrl + '/' + imageId, {
      method: 'DELETE',
    });
    if (response.ok) {
      return;
    }
    throw new Error('Failed to remove from favorites');
  }
} 