import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImageData, CanvasSize } from '../types';
import { ImageGenerationService } from '../services/imageService';
import { LLMService } from '../services/llmService';
import { LayoutUtils } from '../utils/layoutUtils';
import { favoritesService } from '../services/favoritesService';
import { PromptInput } from './PromptInput';
import { ImageCanvas } from './ImageCanvas';
import { ThemeToggle } from './ThemeToggle';
import './MainCanvas.css';

/**
 * Props interface for the MainCanvas component
 */
interface MainCanvasProps {
  initialImages?: ImageData[];
  initialPrompt?: string;
  initialSelectedImage?: string | null;
}

// localStorage key for persisting canvas state
const STORAGE_KEY = 'imagegen-canvas-state';

/**
 * MainCanvas component - The main orchestrator component for the image generation application
 * 
 * This component serves as the central hub that:
 * - Manages the overall application state (images, prompts, selection)
 * - Coordinates between child components (PromptInput, ImageCanvas, etc.)
 * - Handles image generation and manipulation operations
 * - Provides data persistence through localStorage
 * - Manages navigation to/from the favorites page
 * - Implements auto-save functionality for user work
 * 
 * The component supports both fresh starts and loading from saved state or favorites
 */
export const MainCanvas: React.FC<MainCanvasProps> = ({
  initialImages = [],
  initialPrompt = '',
  initialSelectedImage = null
}) => {
  const navigate = useNavigate();
  
  /**
   * Function to determine initial images on component mount
   * Priority: initialImages (from props) > localStorage > empty array
   */
  const getInitialImages = useCallback(() => {
    // If we have initial images from props (e.g., from favorites), use those
    if (initialImages.length > 0) {
      return initialImages.map(img => ({
        ...img,
        position: { x: 300, y: 200 } // Center the image when loaded from favorites
      }));
    }
    
    // Otherwise, try to load from localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedData = JSON.parse(saved);
        return parsedData.images || [];
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
    
    return [];
  }, [initialImages]);

  // Core application state
  const [images, setImages] = useState<ImageData[]>(getInitialImages);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState(initialPrompt);
  const [selectedImage, setSelectedImage] = useState<string | null>(initialSelectedImage);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 0, height: 0 });

  // State lifted from PromptInput to enable parent-child communication
  const [previousPrompts, setPreviousPrompts] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [imageGenerationEnabled, setImageGenerationEnabled] = useState(false);

  /**
   * Effect to load previous prompts from localStorage on component mount
   * Maintains user's prompt history across sessions
   */
  useEffect(() => {
    const savedPrompts = localStorage.getItem('imagegen-previous-prompts');
    if (savedPrompts) {
      try {
        setPreviousPrompts(JSON.parse(savedPrompts));
      } catch (error) {
        console.error('Error loading previous prompts:', error);
      }
    }
  }, []);

  /**
   * Effect to save previous prompts to localStorage whenever they change
   * Ensures prompt history is preserved across sessions
   */
  useEffect(() => {
    if (previousPrompts.length > 0) {
      localStorage.setItem('imagegen-previous-prompts', JSON.stringify(previousPrompts));
    }
  }, [previousPrompts]);

  /**
   * Effect to handle closing dropdown when clicking outside
   * Improves UX by managing dropdown state properly
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showDropdown && !target.closest('.prompt-input-wrapper')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  /**
   * Effect to auto-save canvas state to localStorage whenever images change
   * Provides automatic data persistence without user intervention
   */
  useEffect(() => {
    try {
      const dataToSave = {
        images,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, [images]);

  /**
   * Effect to load additional state from localStorage on mount
   * Only loads if no initial props are provided (fresh start)
   */
  useEffect(() => {
    if (initialImages.length === 0 && !initialPrompt && !initialSelectedImage) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsedData = JSON.parse(saved);
          if (parsedData.selectedImage) {
            setSelectedImage(parsedData.selectedImage);
          }
          if (parsedData.currentPrompt) {
            setCurrentPrompt(parsedData.currentPrompt);
          }
        }
      } catch (error) {
        console.error('Failed to load additional state from localStorage:', error);
      }
    }
  }, [initialImages.length, initialPrompt, initialSelectedImage]);

  /**
   * Effect to save additional state (selection, prompt) to localStorage
   * Maintains user's current context across sessions
   */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const existingData = saved ? JSON.parse(saved) : {};
      const dataToSave = {
        ...existingData,
        selectedImage,
        currentPrompt,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to save additional state to localStorage:', error);
    }
  }, [selectedImage, currentPrompt]);

  /**
   * Handler for selecting an image tile
   * Updates selected image and sets its prompt as current prompt
   */
  const handleSelectImage = (id: string) => {
    console.log('selected image', id);
    setSelectedImage(id);
    setImageGenerationEnabled(false);
    // Set current prompt to the prompt of the selected image
    setCurrentPrompt(images.find(img => img.id === id)?.prompt || '');
  };

  /**
   * Handler for prompt changes that triggers image generation
   * Creates new image tiles and handles the generation process
   */
  const handlePromptChange = async (prompt: string) => {
    if (prompt.trim().length === 0 || !imageGenerationEnabled) return;
    savePreviousPrompt(prompt);
    
    setIsGenerating(true);

    // Create new image data with loading state
    const newImage: ImageData = {
      id: LayoutUtils.generateUniqueId(),
      prompt,
      imageUrl: '',
      position: { x: 50, y: 50 },
      isGenerating: true,
      isFavorite: false,
    };

    // Add image to canvas if none exist or no image is selected
    if (images.length === 0 || selectedImage === null) {
      setSelectedImage(newImage.id);
      setImages(prev => [newImage, ...prev]);
    } 

    try {
      // Generate image using the image service
      const imageResponse = await ImageGenerationService.generateImageV2({ prompt });

      // Update the image with generated content
      setImages(prev => prev.map(img => 
        img.id === (selectedImage || newImage.id) 
          ? { id: newImage.id, position: img.position, imageUrl: imageResponse.imageUrl, prompt: imageResponse.prompt, variations: imageResponse.variations, isGenerating: false, isFavorite: false }
          : img
      ));
    } catch (error) {
      console.error('Failed to generate image:', error);
      // Remove failed image from canvas
      setImages(prev => prev.filter(img => img.id !== newImage.id));
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Effect to implement debounced prompt processing
   * Prevents excessive API calls during rapid typing
   */
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handlePromptChange(currentPrompt);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [currentPrompt]);

  /**
   * Handler for updating image positions during drag operations
   * Memoized to prevent unnecessary re-renders
   */
  const handlePositionChange = useCallback((id: string, position: { x: number; y: number }) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, position } : img
    ));
  }, []);

  /**
   * Handler for duplicating an image tile
   * Creates a copy with slight position offset
   */
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

  /**
   * Handler for removing an image tile from the canvas
   */
  const handleRemove = useCallback((id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  }, []);

  /**
   * Handler for expanding an image to generate variations
   * Creates multiple new images based on the original image's variations
   */
  const handleExpand = useCallback(async (id: string) => {
    const originalImage = images.find(img => img.id === id);
    if (!originalImage) return;

    try {
      const promptVariations = originalImage.variations || [];
      
      // Configuration for positioning variations around the original
      const tileSize = 128;
      const spacing = 144;
      
      // Calculate positions in a cross pattern around the original
      const positions = [
        { x: originalImage.position.x, y: originalImage.position.y - spacing },
        { x: originalImage.position.x + spacing, y: originalImage.position.y },
        { x: originalImage.position.x, y: originalImage.position.y + spacing },
        { x: originalImage.position.x - spacing, y: originalImage.position.y },
      ];

      // Create new image data for each variation
      const newImages: ImageData[] = promptVariations.map((prompt, index) => ({
        id: LayoutUtils.generateUniqueId(),
        prompt,
        imageUrl: '',
        position: positions[index] || { x: originalImage.position.x + spacing, y: originalImage.position.y },
        isGenerating: true
      }));

      // Add all variations to canvas in loading state
      setImages(prev => [...prev, ...newImages]);

      // Generate images for all variations concurrently
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
      
      // Remove failed variations from canvas
      results.forEach(({ success, image, imageResponse, error }) => {
        if (!success) {
          setImages(prev => prev.filter(img => img.id !== image.id));
        }
      });      
    } catch (error) {
      console.error('Failed to generate prompt variations:', error);
    }
  }, [images]);

  /**
   * Handler for arranging images in a grid layout
   * Uses layout utility to organize images neatly
   */
  const handleArrangeToGrid = useCallback(() => {
    const arrangedImages = LayoutUtils.arrangeToGrid(images, canvasSize);
    setImages(arrangedImages);
  }, [images, canvasSize]);

  /**
   * Handler for clearing all images from the canvas
   */
  const handleClearCanvas = useCallback(() => {
    setImages([]);
    setSelectedImage(null);
  }, []);

  /**
   * Handler for adding an image to favorites
   * Communicates with the favorites service and updates local state
   */
  const handleAddToFavorites = useCallback(async (id: string) => {
    const image = images.find(img => img.id === id);
    if (!image || !image.imageUrl) return;

    try {
      console.log('Adding to favorites:', image);
      await favoritesService.addFavorite(image);
      // Could add a toast notification here

      // Update the image in the canvas to show it as a favorite
      const updatedImage = images.find(img => img.id === id);
      if (updatedImage) {
        updatedImage.isFavorite = true;
        setImages(prev => prev.map(img => 
          img.id === id ? updatedImage : img
        ));
      }
      console.log('Added to favorites:', updatedImage?.prompt);
    } catch (error) {
      console.error('Failed to add to favorites:', error);
    }
  }, [images]);

  /**
   * Handler for navigating to the favorites page
   */
  const handleGoToFavorites = () => {
    navigate('/favorites');
  };

  /**
   * Handler for saving prompts to the previous prompts list
   * Filters out short prompts and maintains list size
   */
  const savePreviousPrompt = useCallback((newPrompt: string) => {
    if (newPrompt.length < 3) return; // Don't save very short prompts
    
    setPreviousPrompts(prev => {
      // Remove the prompt if it already exists to avoid duplicates
      const filtered = prev.filter(p => p !== newPrompt);
      // Add the new prompt at the beginning and limit to 10 prompts
      const updated = [newPrompt, ...filtered].slice(0, 10);
      return updated;
    });
  }, []);

  /**
   * Handler for prompt input changes
   * Enables image generation and updates current prompt
   */
  const handlePromptInputChange = useCallback((newPrompt: string) => {
    setImageGenerationEnabled(true);
    setCurrentPrompt(newPrompt);
  }, []);

  /**
   * Handler for selecting a prompt from the dropdown
   * Updates current prompt and triggers generation
   */
  const handlePromptSelect = useCallback((selectedPrompt: string) => {
    setImageGenerationEnabled(true);
    setCurrentPrompt(selectedPrompt);
    setShowDropdown(false);
  }, [handlePromptChange]);

  /**
   * Handler for toggling the prompt dropdown visibility
   */
  const handleDropdownToggle = useCallback(() => {
    setShowDropdown(!showDropdown);
  }, [showDropdown]);

  return (
    <div className="main-canvas">
      {/* Header with theme toggle and favorites navigation */}
      <div className="main-canvas-header">
        <ThemeToggle />
        <button 
          className="favorites-nav-button" 
          onClick={handleGoToFavorites}
          title="View Favorites"
        >
          ⭐ Favorites
        </button>
      </div>
      
      {/* Prompt input component with controls */}
      <PromptInput
        onPromptChange={handlePromptInputChange}
        onArrangeToGrid={handleArrangeToGrid}
        onClearCanvas={handleClearCanvas}
        isGenerating={isGenerating}
        initialPrompt={currentPrompt}
        previousPrompts={previousPrompts}
        onPromptSelect={handlePromptSelect}
        onDropdownToggle={handleDropdownToggle}
        showDropdown={showDropdown}
      />
      
      {/* Main canvas area with image tiles */}
      <ImageCanvas
        images={images}
        onPositionChange={handlePositionChange}
        onDuplicate={handleDuplicate}
        onRemove={handleRemove}
        onExpand={handleExpand}
        onSelect={handleSelectImage}
        onAddToFavorites={handleAddToFavorites}
        onClearCanvas={handleClearCanvas}
        onArrangeToGrid={handleArrangeToGrid}
        onCanvasSizeChange={setCanvasSize}
      />
    </div>
  );
};