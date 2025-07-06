import { GenerationRequest, GenerationResponse } from '../types';


const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const imageGenerationUrl = `${API_BASE_URL}/api/image`;

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

} 