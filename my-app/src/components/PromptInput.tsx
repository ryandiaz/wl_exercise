import React, { useState, useEffect } from 'react';
import './PromptInput.css';

interface PromptInputProps {
  onPromptChange: (prompt: string) => void;
  onArrangeToGrid: () => void;
  isGenerating?: boolean;
}

export const PromptInput: React.FC<PromptInputProps> = ({ 
  onPromptChange, 
  onArrangeToGrid, 
  isGenerating = false 
}) => {
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (prompt.trim()) {
        onPromptChange(prompt);
      }
    }, 500); // Debounce for live updates

    return () => clearTimeout(debounceTimer);
  }, [prompt, onPromptChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrompt(e.target.value);
  };

  return (
    <div className="prompt-input-container">
      <h1 className="app-title">Live Image Generation</h1>
      <div className="input-controls">
        <input
          type="text"
          value={prompt}
          onChange={handleInputChange}
          placeholder="Type your prompt here..."
          className="prompt-input"
          disabled={isGenerating}
        />
        <button 
          onClick={onArrangeToGrid}
          className="arrange-button"
          disabled={isGenerating}
        >
          Arrange to Grid
        </button>
      </div>
    </div>
  );
}; 