import { ImageData, Position, CanvasSize } from '../types';

export const TILE_SIZE = 128;
export const TILE_MARGIN = 16;

export class LayoutUtils {
  static arrangeToGrid(images: ImageData[], canvasSize: CanvasSize): ImageData[] {
    if (images.length === 0) return images;

    const cols = Math.floor(canvasSize.width / (TILE_SIZE + TILE_MARGIN));
    const effectiveCols = Math.max(1, cols);

    return images.map((image, index) => {
      const col = index % effectiveCols;
      const row = Math.floor(index / effectiveCols);
      
      return {
        ...image,
        position: {
          x: col * (TILE_SIZE + TILE_MARGIN) + TILE_MARGIN,
          y: row * (TILE_SIZE + TILE_MARGIN) + TILE_MARGIN
        }
      };
    });
  }

  static findNearestGridPosition(position: Position, canvasSize: CanvasSize): Position {
    const cols = Math.floor(canvasSize.width / (TILE_SIZE + TILE_MARGIN));
    const effectiveCols = Math.max(1, cols);

    const col = Math.round((position.x - TILE_MARGIN) / (TILE_SIZE + TILE_MARGIN));
    const row = Math.round((position.y - TILE_MARGIN) / (TILE_SIZE + TILE_MARGIN));

    const clampedCol = Math.max(0, Math.min(col, effectiveCols - 1));
    const clampedRow = Math.max(0, row);

    return {
      x: clampedCol * (TILE_SIZE + TILE_MARGIN) + TILE_MARGIN,
      y: clampedRow * (TILE_SIZE + TILE_MARGIN) + TILE_MARGIN
    };
  }

  static generateUniqueId(): string {
    return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 