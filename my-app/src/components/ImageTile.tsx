import React, { useEffect, useState, useRef } from 'react';
import { ImageData } from '../types';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import './ImageTile.css';

/**
 * Props interface for the ImageTile component
 */
interface ImageTileProps {
  image: ImageData;
  onPositionChange: (id: string, position: { x: number; y: number }) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onExpand: (id: string) => void;
  onSelect: (id: string) => void;
  onAddToFavorites?: (id: string) => void;
}

/**
 * ImageTile component - Renders a draggable image tile with controls
 * 
 * This component represents a single image in the canvas that can be:
 * - Dragged around the canvas
 * - Duplicated to create copies
 * - Removed from the canvas
 * - Expanded to generate variations
 * - Selected for interaction
 * - Added to favorites (if feature is enabled)
 * 
 * The component shows different states: generating, loaded image, or placeholder
 */
export const ImageTile: React.FC<ImageTileProps> = ({
  image,
  onPositionChange,
  onDuplicate,
  onRemove,
  onExpand,
  onSelect,
  onAddToFavorites
}) => {
  // State for controlling tooltip visibility
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Ref to manage hover timeout for tooltip display
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Custom hook for drag and drop functionality
  // Returns dragging state and event handlers for mouse interactions
  const { isDragging, handleMouseDown, handleMouseMove, handleMouseUp } = useDragAndDrop(
    image.position,
    (position) => onPositionChange(image.id, position)
  );

  /**
   * Effect to handle mouse event listeners during dragging
   * Adds global mouse event listeners when dragging starts
   * Cleans up listeners when dragging ends or component unmounts
   */
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  /**
   * Handler for duplicating the current image tile
   * Stops event propagation to prevent triggering drag/select
   */
  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicate(image.id);
  };

  /**
   * Handler for removing the current image tile
   * Stops event propagation to prevent triggering drag/select
   */
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(image.id);
  };

  /**
   * Handler for expanding the image (generating variations)
   * Stops event propagation to prevent triggering drag/select
   */
  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    onExpand(image.id);
  };

  /**
   * Handler for adding image to favorites
   * Stops event propagation to prevent triggering drag/select
   */
  const handleAddToFavorites = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToFavorites) {
      onAddToFavorites(image.id);
    }
  };

  /**
   * Handler for mouse enter event
   * Shows tooltip after a short delay (100ms) if not currently dragging
   */
  const handleMouseEnter = () => {
    if (!isDragging) {
      hoverTimeoutRef.current = setTimeout(() => {
        setShowTooltip(true);
      }, 100);
    }
  };

  /**
   * Handler for mouse leave event
   * Clears the tooltip timeout and hides tooltip
   */
  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setShowTooltip(false);
  };

  /**
   * Cleanup effect to clear timeout on component unmount
   * Prevents memory leaks from pending timeouts
   */
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      className={`image-tile ${isDragging ? 'dragging' : ''} ${image.isGenerating ? 'generating' : ''}`}
      style={{
        left: image.position.x,
        top: image.position.y,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={(e) => {
        if (e.button === 2) return; // Ignore right clicks
        handleMouseDown(e); 
        onSelect(image.id);
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Conditional rendering based on image state */}
      {image.isGenerating ? (
        // Loading state - show spinner and generating text
        <div className="image-placeholder generating">
          <div className="loading-spinner"></div>
          <span>Generating...</span>
        </div>
      ) : image.imageUrl ? (
        // Image loaded state - show image with control overlay
        <>
          <img 
            src={image.imageUrl} 
            alt={image.prompt} 
            className="tile-image"
            draggable={false} // Disable native drag to use custom drag handling
          />
          
          {/* Control buttons overlay */}
          <div className="tile-overlay">
            <button 
              className="tile-button duplicate-btn" 
              onClick={handleDuplicate}
              title="Duplicate"
            >
              +
            </button>
            <button 
              className="tile-button remove-btn" 
              onClick={handleRemove}
              title="Remove"
            >
              -
            </button>
            <button 
              className="tile-button expand-btn" 
              onClick={handleExpand}
              title="Generate variations"
            >
              !
            </button>
            {/* Conditionally render favorites button if feature is enabled and not already favorited */}
            {onAddToFavorites && !image.isFavorite && (
              <button 
                className="tile-button favorite-btn" 
                onClick={handleAddToFavorites}
                title="Add to favorites"
              >
                ⭐
              </button>
            )}
          </div>
        </>
      ) : (
        // Error/empty state - show placeholder
        <div className="image-placeholder">
          <span>No Image</span>
        </div>
      )}
      
      {/* Tooltip showing the image prompt - only visible when hovering and not dragging */}
      {showTooltip && !isDragging && (
        <div className="debug-tooltip">
          {image.prompt}
        </div>
      )}
    </div>
  );
}; 