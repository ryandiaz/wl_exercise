import React, { useEffect, useState, useRef } from 'react';
import { ImageData } from '../types';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import './ImageTile.css';

interface ImageTileProps {
  image: ImageData;
  onPositionChange: (id: string, position: { x: number; y: number }) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onExpand: (id: string) => void;
  onSelect: (id: string) => void;
}

export const ImageTile: React.FC<ImageTileProps> = ({
  image,
  onPositionChange,
  onDuplicate,
  onRemove,
  onExpand,
  onSelect
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debug logging
  console.log('RYANDEBUG tooltip render', { showTooltip, hasPrompt: !!image.prompt, prompt: image.prompt });

  const { isDragging, handleMouseDown, handleMouseMove, handleMouseUp } = useDragAndDrop(
    image.position,
    (position) => onPositionChange(image.id, position)
  );

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

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicate(image.id);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(image.id);
  };

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    onExpand(image.id);
  };

  const handleMouseEnter = () => {
    if (!isDragging) {
      hoverTimeoutRef.current = setTimeout(() => {
        setShowTooltip(true);
      }, 100);
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setShowTooltip(false);
  };

  // Clear timeout on unmount
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
        onMouseDown={(e) => {handleMouseDown(e); onSelect(image.id);}}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {image.isGenerating ? (
          <div className="image-placeholder generating">
            <div className="loading-spinner"></div>
            <span>Generating...</span>
          </div>
        ) : image.imageUrl ? (
          <>
            <img 
              src={image.imageUrl} 
              alt={image.prompt} 
              className="tile-image"
              draggable={false}
            />
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
            </div>
          </>
        ) : (
          <div className="image-placeholder">
            <span>No Image</span>
          </div>
        )}
        
        {showTooltip && !isDragging && (
          <div className="debug-tooltip">
            {image.prompt}
          </div>
        )}
      </div>
  );
}; 