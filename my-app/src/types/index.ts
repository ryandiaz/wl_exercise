export interface ImageData {
  id: string;
  prompt: string;
  imageUrl: string;
  position: Position;
  isGenerating?: boolean;
  variations?: string[];
}

export interface Position {
  x: number;
  y: number;
}

export interface CanvasSize {
  width: number;
  height: number;
}

export interface GenerationRequest {
  prompt: string;
  variations?: number;
}
export interface GenerationResponse {
  prompt: string;
  variations: string[];
  imageUrl: string;
}

export interface LLMPromptVariation {
  originalPrompt: string;
  variations: string[];
} 