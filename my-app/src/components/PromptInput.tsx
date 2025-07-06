import React from 'react';
import './PromptInput.css';

/**
 * Props interface for the PromptInput component
 */
interface PromptInputProps {
  onPromptChange: (prompt: string) => void;
  onArrangeToGrid: () => void;
  onClearCanvas: () => void;
  isGenerating?: boolean;
  initialPrompt?: string;
  previousPrompts: string[];
  onPromptSelect: (prompt: string) => void;
  onDropdownToggle: () => void;
  showDropdown: boolean;
}

/**
 * PromptInput component - User interface for entering prompts and controlling the canvas
 * 
 * This component provides:
 * - Text input field for entering image generation prompts
 * - Dropdown menu showing previously used prompts for quick selection
 * - Control buttons for arranging images and clearing the canvas
 * - Loading state management during image generation
 * - Responsive design with proper accessibility features
 * 
 * The component communicates with parent component through callback props
 * and manages its own local interaction state
 */
export const PromptInput: React.FC<PromptInputProps> = ({ 
  onPromptChange, 
  onArrangeToGrid, 
  onClearCanvas,
  isGenerating = false,
  initialPrompt = '',
  previousPrompts,
  onPromptSelect,
  onDropdownToggle,
  showDropdown
}) => {
  /**
   * Handler for text input changes
   * Forwards the input value to parent component
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onPromptChange(e.target.value);
  };

  /**
   * Handler for selecting a prompt from the dropdown
   * Forwards the selected prompt to parent component
   */
  const handlePromptSelect = (selectedPrompt: string) => {
    onPromptSelect(selectedPrompt);
  };

  /**
   * Handler for clear button with confirmation dialog
   * Shows confirmation dialog before clearing the canvas
   */
  const handleClearCanvas = () => {
    const confirmed = window.confirm("Are you sure you want to clear the canvas? This action cannot be undone.");
    if (confirmed) {
      onClearCanvas();
    }
  };

  return (
    <div className="prompt-input-container">
      {/* Main application title */}
      <h1 className="app-title">Live Image Generation</h1>
      
      <div className="input-controls">
        {/* Prompt input section with dropdown */}
        <div className="prompt-input-wrapper">
          <input
            type="text"
            value={initialPrompt}
            onChange={handleInputChange}
            placeholder="Type your prompt here..."
            className="prompt-input"
            disabled={isGenerating}
          />
          
          {/* Previous prompts dropdown - only shown if there are previous prompts */}
          {previousPrompts.length > 0 && (
            <>
              <button
                type="button"
                className="dropdown-toggle-inline"
                onClick={onDropdownToggle}
                disabled={isGenerating}
                title="Previous prompts"
              >
                ↓
              </button>
              
              {/* Dropdown menu with previous prompts */}
              {showDropdown && (
                <div className="dropdown-menu">
                  {previousPrompts.map((prevPrompt, index) => (
                    <button
                      key={index}
                      className="dropdown-item"
                      onClick={() => handlePromptSelect(prevPrompt)}
                    >
                      {prevPrompt}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Canvas control buttons */}
        <div className="button-row">
          <button 
            onClick={handleClearCanvas}
            className="clear-button"
            disabled={isGenerating}
            title="Clear Canvas"
          >
            Clear
          </button>
          <button 
            onClick={onArrangeToGrid}
            className="arrange-button"
            disabled={isGenerating}
          >
            Arrange to Grid
          </button>
        </div>
      </div>
    </div>
  );
}; 