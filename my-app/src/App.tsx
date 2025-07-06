import React, { useState, useCallback } from 'react';
import { ImageData, CanvasSize } from './types';
import { ImageGenerationService } from './services/imageService';
import { LLMService } from './services/llmService';
import { LayoutUtils } from './utils/layoutUtils';
import { PromptInput } from './components/PromptInput';
import { ImageCanvas } from './components/ImageCanvas';
import './App.css';

function App() {
  // RYANDEBUG: should this be a map? and should it live here or in the ImageCanvas?
  const [images, setImages] = useState<ImageData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const canvasSize: CanvasSize = { width: 1200, height: 800 }; // This would be dynamic in a real app

  const handleSelectImage = (id: string) => {
    console.log('selected image', id);
    setSelectedImage(id);
  };

  const handlePromptChange = useCallback(async (prompt: string) => {
    // RYANDEBUG : is this necessary if useCallback is used?
    if (prompt === currentPrompt) return;
    
    setCurrentPrompt(prompt);
    setIsGenerating(true);

    // Create a new image with generating state
    const newImage: ImageData = {
      id: LayoutUtils.generateUniqueId(),
      prompt,
      imageUrl: '',
      position: { x: 50, y: 50 },
      isGenerating: true
    };
    // initialize the selected image to the first image
    console.log('images', images);
    console.log('prompt', prompt);
    if (images.length === 0) {
      setSelectedImage(newImage.id);
      setImages(prev => [newImage, ...prev]);
    } 

    try {
      // Generate the actual image
      const imageResponse = await ImageGenerationService.generateImageV2({ prompt });

      // Update the image with the generated URL
      setImages(prev => prev.map(img => 
        img.id === (selectedImage || newImage.id) 
          ? { ...img, imageUrl: imageResponse.imageUrl, prompt: imageResponse.prompt, variations: imageResponse.variations, isGenerating: false }
          : img
      ));
    } catch (error) {
      console.error('Failed to generate image:', error);
      // Remove the failed image
      setImages(prev => prev.filter(img => img.id !== newImage.id));
    } finally {
      setIsGenerating(false);
    }
  }, [currentPrompt, selectedImage, images]);

  const handlePositionChange = useCallback((id: string, position: { x: number; y: number }) => {
    // RYANDEBUG : why is it not updated in place? can we change this to a map to make it more efficient?
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, position } : img
    ));
  }, []);

  const handleDuplicate = useCallback((id: string) => {
    const originalImage = images.find(img => img.id === id);
    if (!originalImage) return;

    const duplicatedImage: ImageData = {
      ...originalImage,
      id: LayoutUtils.generateUniqueId(),
      position: {
        x: originalImage.position.x + 20,
        y: originalImage.position.y + 20
      }
    };

    setImages(prev => [...prev, duplicatedImage]);
  }, [images]);

  const handleRemove = useCallback((id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  }, []);

  const handleExpand = useCallback(async (id: string) => {
    const originalImage = images.find(img => img.id === id);
    if (!originalImage) return;

    try {
      // Generate prompt variations using LLM
      const promptVariations = originalImage.variations || [];
      
      // Create new images for each variation in a cross pattern around the original
      const tileSize = 128; // Match the current tile size
      const spacing = 144; // Tile size + margin
      
      const positions = [
        { x: originalImage.position.x, y: originalImage.position.y - spacing }, // Above
        { x: originalImage.position.x + spacing, y: originalImage.position.y }, // Right
        { x: originalImage.position.x, y: originalImage.position.y + spacing }, // Below
        { x: originalImage.position.x - spacing, y: originalImage.position.y }, // Left
      ];

      const newImages: ImageData[] = promptVariations.map((prompt, index) => ({
        id: LayoutUtils.generateUniqueId(),
        prompt,
        imageUrl: '',
        position: positions[index] || { x: originalImage.position.x + spacing, y: originalImage.position.y },
        isGenerating: true
      }));

      setImages(prev => [...prev, ...newImages]);

      // Generate images for each variation
      const imagePromises = newImages.map(async (image) => {
        try {
          const imageResponse = await ImageGenerationService.generateImageV2({ prompt: image.prompt });
          setImages(prev => prev.map(img => 
            img.id === image.id 
              ? { ...img, imageUrl: imageResponse.imageUrl, prompt: imageResponse.prompt, variations: imageResponse.variations, isGenerating: false }
              : img
          ));
          return { success: true, image, imageResponse };
        } catch (error) {
          console.error('Failed to generate variation:', error);
          return { success: false, image, error };
        }
      });

      const results = await Promise.all(imagePromises);
      
      results.forEach(({ success, image, imageResponse, error }) => {
        if (!success) {
          setImages(prev => prev.filter(img => img.id !== image.id));
        }
      });      
    } catch (error) {
      console.error('Failed to generate prompt variations:', error);
    }
  }, [images]);

  const handleArrangeToGrid = useCallback(() => {
    const arrangedImages = LayoutUtils.arrangeToGrid(images, canvasSize);
    setImages(arrangedImages);
  }, [images, canvasSize]);

  return (
    <div className="app">
      <PromptInput
        onPromptChange={handlePromptChange}
        onArrangeToGrid={handleArrangeToGrid}
        isGenerating={isGenerating}
      />
      <ImageCanvas
        images={images}
        onPositionChange={handlePositionChange}
        onDuplicate={handleDuplicate}
        onRemove={handleRemove}
        onExpand={handleExpand}
        onSelect={handleSelectImage}
      />
    </div>
  );
}

export default App;
