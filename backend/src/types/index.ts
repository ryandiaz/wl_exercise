export interface ImageData {
    id: string;
    prompt: string;
    imageUrl: string;
    isGenerating?: boolean;
    variations?: string[];
}

export function imageDataFromJson(json: string): ImageData {
    return JSON.parse(json);
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