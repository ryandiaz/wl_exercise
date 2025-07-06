import { LLMPromptVariation } from '../types';

// Placeholder service for LLM prompt variations
export class LLMService {
  static async generatePromptVariations(originalPrompt: string): Promise<LLMPromptVariation> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Generate simple variations as placeholders
    const variations = [
      `${originalPrompt} with vibrant colors`,
      `${originalPrompt} in a different art style`,
      `${originalPrompt} with dramatic lighting`,
      `${originalPrompt} from a unique perspective`
    ];

    return {
      originalPrompt,
      variations
    };
  }
} 