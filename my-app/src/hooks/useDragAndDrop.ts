import { useState, useCallback } from 'react';
import { Position } from '../types';

interface DragState {
  isDragging: boolean;
  dragOffset: Position;
  initialPosition: Position;
}

export const useDragAndDrop = (
  initialPosition: Position,
  onPositionChange: (position: Position) => void
) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    initialPosition
  });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const offset = {
      x: e.clientX - initialPosition.x,
      y: e.clientY - initialPosition.y
    };

    setDragState({
      isDragging: true,
      dragOffset: offset,
      initialPosition
    });
  }, [initialPosition]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging) return;

    const newPosition = {
      x: e.clientX - dragState.dragOffset.x,
      y: e.clientY - dragState.dragOffset.y
    };

    onPositionChange(newPosition);
  }, [dragState.isDragging, dragState.dragOffset, onPositionChange]);

  const handleMouseUp = useCallback(() => {
    setDragState(prev => ({ ...prev, isDragging: false }));
  }, []);

  // Effect handlers would be attached in the component using this hook

  return {
    isDragging: dragState.isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  };
}; 