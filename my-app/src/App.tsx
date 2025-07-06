import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ImageData } from './types';
import { MainCanvas } from './components/MainCanvas';
import { FavoritesPage } from './components/FavoritesPage';
import { ThemeProvider } from './contexts/ThemeContext';
import './App.css';

function App() {
  const [selectedFavorite, setSelectedFavorite] = useState<ImageData | null>(null);

  const handleSelectFavorite = (favorite: ImageData) => {
    favorite.isFavorite = true;
    setSelectedFavorite(favorite);
  };

  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="app">
          <Routes>
            <Route 
              path="/" 
              element={
                <MainCanvas 
                  initialImages={selectedFavorite ? [selectedFavorite] : []}
                  initialPrompt={selectedFavorite ? selectedFavorite.prompt : ''}
                  initialSelectedImage={selectedFavorite ? selectedFavorite.id : null}
                />
              } 
            />
            <Route 
              path="/favorites" 
              element={<FavoritesPage onSelectFavorite={handleSelectFavorite} />} 
            />
          </Routes>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
