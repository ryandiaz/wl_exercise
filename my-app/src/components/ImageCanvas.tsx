import React, { useRef, useEffect, useState } from 'react';
import { ImageData, CanvasSize } from '../types';
import { ImageTile } from './ImageTile';
import './ImageCanvas.css';

interface ImageCanvasProps {
  images: ImageData[];
  onPositionChange: (id: string, position: { x: number; y: number }) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onExpand: (id: string) => void;
  onSelect: (id: string) => void;
}

export const ImageCanvas: React.FC<ImageCanvasProps> = ({
  images,
  onPositionChange,
  onDuplicate,
  onRemove,
  onExpand,
  onSelect
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 0, height: 0 });

  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setCanvasSize({
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

  return (
    <div className="image-canvas" ref={canvasRef}>
      {images.length === 0 ? (
        <div className="canvas-placeholder">
          <div className="placeholder-content">
            <div className="placeholder-icon">🎨</div>
            <h3>No Images Yet</h3>
            <p>Start typing a prompt above to generate your first image!</p>
          </div>
        </div>
      ) : (
        images.map(image => (
          <ImageTile
            key={image.id}
            image={image}
            onPositionChange={onPositionChange}
            onDuplicate={onDuplicate}
            onRemove={onRemove}
            onExpand={onExpand}
            onSelect={onSelect}
          />
        ))
      )}
    </div>
  );
}; 