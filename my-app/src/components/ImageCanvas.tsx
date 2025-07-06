import React, { useRef, useEffect, useState } from 'react';
import { ImageData, CanvasSize } from '../types';
import { ImageTile } from './ImageTile';
import './ImageCanvas.css';

/**
 * Props interface for the ImageCanvas component
 */
interface ImageCanvasProps {
  images: ImageData[];
  onPositionChange: (id: string, position: { x: number; y: number }) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onExpand: (id: string) => void;
  onSelect: (id: string) => void;
  onAddToFavorites?: (id: string) => void;
  onClearCanvas?: () => void;
  onArrangeToGrid?: () => void;
  onCanvasSizeChange: (size: CanvasSize) => void;
}

/**
 * ImageCanvas component - The main workspace area for displaying and manipulating images
 * 
 * This component provides:
 * - Canvas area where ImageTile components are rendered and positioned
 * - Context menu (right-click) functionality for canvas operations
 * - Responsive canvas sizing that adapts to viewport changes
 * - Empty state display when no images are present
 * - Proper event handling for canvas interactions
 * - Coordination between individual image tiles and parent operations
 * 
 * The component acts as a container and event coordinator, delegating
 * individual image operations to ImageTile components while managing
 * canvas-wide operations through the context menu system
 */
export const ImageCanvas: React.FC<ImageCanvasProps> = ({
  images,
  onPositionChange,
  onDuplicate,
  onRemove,
  onExpand,
  onSelect,
  onAddToFavorites,
  onClearCanvas,
  onArrangeToGrid,
  onCanvasSizeChange
}) => {
  // Ref for accessing the canvas DOM element
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // State for managing context menu visibility and position
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({ visible: false, x: 0, y: 0 });

  /**
   * Effect to handle canvas size updates on mount and window resize
   * Ensures canvas dimensions are properly tracked for layout calculations
   */
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        onCanvasSizeChange({
          width: rect.width,
          height: rect.height
        });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);

  /**
   * Effect to handle clicks outside context menu to close it
   * Improves UX by dismissing context menu when clicking elsewhere
   */
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        setContextMenu({ visible: false, x: 0, y: 0 });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu.visible]);

  /**
   * Handler for context menu (right-click) events
   * Only shows context menu when right-clicking on empty canvas area
   */
  const handleContextMenu = (e: React.MouseEvent) => {
    // Only show custom context menu if right-clicking on the canvas itself (blank area)
    // Allow default behavior for clicks on child elements like images
    if (e.target !== canvasRef.current) {
      return;
    }
    
    e.preventDefault();
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Calculate context menu position relative to canvas
    setContextMenu({
      visible: true,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  /**
   * Handler for clear canvas action from context menu
   * Hides context menu and triggers parent's clear canvas function
   */
  const handleClearCanvas = () => {
    setContextMenu({ visible: false, x: 0, y: 0 });
    onClearCanvas?.();
  };

  /**
   * Handler for arrange to grid action from context menu
   * Hides context menu and triggers parent's arrange to grid function
   */
  const handleArrangeToGrid = () => {
    setContextMenu({ visible: false, x: 0, y: 0 });
    onArrangeToGrid?.();
  };

  return (
    <div className="image-canvas" ref={canvasRef} onContextMenu={handleContextMenu}>
      {/* Conditional rendering based on whether images exist */}
      {images.length === 0 ? (
        // Empty state when no images are present
        <div className="canvas-placeholder">
          <div className="placeholder-content">
            <div className="placeholder-icon">🎨</div>
            <h3>No Images Yet</h3>
            <p>Start typing a prompt above to generate your first image!</p>
          </div>
        </div>
      ) : (
        // Render all image tiles when images exist
        images.map(image => (
          <ImageTile
            key={image.id}
            image={image}
            onPositionChange={onPositionChange}
            onDuplicate={onDuplicate}
            onRemove={onRemove}
            onExpand={onExpand}
            onSelect={onSelect}
            onAddToFavorites={onAddToFavorites}
          />
        ))
      )}
      
      {/* Context menu - only visible when right-clicking on empty canvas */}
      {contextMenu.visible && (
        <div
          className="context-menu"
          style={{
            left: contextMenu.x,
            top: contextMenu.y
          }}
          onClick={(e) => e.stopPropagation()} // Prevent event bubbling
        >
          <button 
            className="context-menu-item"
            onClick={handleClearCanvas}
            disabled={images.length === 0}
          >
            Clear Canvas
          </button>
          <button 
            className="context-menu-item"
            onClick={handleArrangeToGrid}
            disabled={images.length === 0}
          >
            Arrange to Grid
          </button>
        </div>
      )}
    </div>
  );
}; 